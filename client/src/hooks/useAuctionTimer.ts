import { useState, useEffect, useRef, useCallback } from 'react';
import { socketClient } from '../services/socketClient.js';

let timerBroadcast: BroadcastChannel | null = null;
try {
  timerBroadcast = new BroadcastChannel('auction_timer_sync');
} catch (e) {
}

const getStoredDisplayEndTime = (auctionId: number): number | null => {
  try {
    const stored = localStorage.getItem(`auction_display_end_${auctionId}`);
    if (stored) {
      const endTime = parseInt(stored, 10);
      if (endTime > Date.now()) {
        return endTime;
      }
    }
  } catch (e) {}
  return null;
};

const setStoredDisplayEndTime = (auctionId: number, endTime: number, broadcast = false) => {
  try {
    localStorage.setItem(`auction_display_end_${auctionId}`, String(endTime));
    // Broadcast to other components (e.g., list page) to sync
    if (broadcast && timerBroadcast) {
      timerBroadcast.postMessage({ type: 'timer_reset', auctionId, endTime });
    }
  } catch (e) {}
};

const clearStoredDisplayEndTime = (auctionId: number) => {
  try {
    localStorage.removeItem(`auction_display_end_${auctionId}`);
  } catch (e) {}
};

export const useAuctionTimer = (targetTime: string, status: string, auctionId?: number, initialServerTime?: number | null) => {
  const [displayTime, setDisplayTime] = useState<string>('');
  const [isEnded, setIsEnded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const actualTimeRef = useRef<number>(0);
  const displayCountdownRef = useRef<number>(0);
  const statusRef = useRef<string>(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const getDisplaySeconds = useCallback((actualSeconds: number, stat: string): number => {
    if (stat === 'active') {
      return Math.min(actualSeconds, 15);
    }
    return actualSeconds;
  }, []);

  // Format time display
  const formatDisplay = useCallback((seconds: number, stat: string): string => {
    if (seconds <= 0) {
      return stat === 'scheduled' ? 'Live Now' : 'Ended';
    }

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (n: number) => n < 10 ? '0' + n : String(n);

    if (days >= 1) {
      return pad(days) + ':' + pad(hours) + ':' + pad(minutes);
    }
    return pad(hours) + ':' + pad(minutes) + ':' + pad(secs);
  }, []);

  const updateDisplayFromRef = useCallback((stat: string) => {
    const displaySeconds = stat === 'active' 
      ? displayCountdownRef.current 
      : actualTimeRef.current;
    
    const formatted = formatDisplay(displaySeconds, stat);
    setDisplayTime(formatted);
    
    if (actualTimeRef.current <= 0 && stat === 'active') {
      setIsEnded(true);
    }
  }, [formatDisplay]);

  useEffect(() => {
    if (!auctionId) return;
    if (status === 'scheduled') return;

    const handleTimerUpdate = (payload: any) => {
      if (payload.auctionId === auctionId) {
        const serverTime = payload.timeLeft || 0;
        const prevActual = actualTimeRef.current;
        actualTimeRef.current = serverTime;
        
        if (statusRef.current === 'active') {
          const diff = prevActual - serverTime;
          if (diff > 0 && diff <= 2) {
            displayCountdownRef.current = Math.max(0, displayCountdownRef.current - diff);
            setStoredDisplayEndTime(auctionId, Date.now() + displayCountdownRef.current * 1000);
          } else if (diff > 2 || prevActual === 0) {
            const storedEnd = getStoredDisplayEndTime(auctionId);
            if (storedEnd) {
              displayCountdownRef.current = Math.max(0, Math.floor((storedEnd - Date.now()) / 1000));
            } else {
              displayCountdownRef.current = Math.min(serverTime, 15);
              setStoredDisplayEndTime(auctionId, Date.now() + displayCountdownRef.current * 1000);
            }
          }
          updateDisplayFromRef(statusRef.current);
        }
        if (serverTime <= 0 && statusRef.current === 'active') {
          setIsEnded(true);
          clearStoredDisplayEndTime(auctionId);
        }
      }
    };

    const handleNewBid = (payload: any) => {
      if (payload.auctionId === auctionId && statusRef.current === 'active') {
        displayCountdownRef.current = 15;
        const newEndTime = Date.now() + 15 * 1000;
        setStoredDisplayEndTime(auctionId, newEndTime, true);
        
        if (payload.newEndTime) {
          const newEndTimeMs = typeof payload.newEndTime === 'number' 
            ? payload.newEndTime 
            : new Date(payload.newEndTime).getTime();
          const newActual = Math.max(0, Math.floor((newEndTimeMs - Date.now()) / 1000));
          actualTimeRef.current = newActual;
        }
        
        updateDisplayFromRef(statusRef.current);
        console.log('[Timer] Reset to 15 on new_bid, broadcasted to list');
      }
    };

    socketClient.on('timer_update', handleTimerUpdate);
    socketClient.on('new_bid', handleNewBid);
    
    const checkConnection = () => {
      if (socketClient.isConnected()) {
        socketClient.off('timer_update', handleTimerUpdate);
        socketClient.off('new_bid', handleNewBid);
        socketClient.on('timer_update', handleTimerUpdate);
        socketClient.on('new_bid', handleNewBid);
      }
    };
    
    socketClient.on('connect', checkConnection);
    
    return () => {
      socketClient.off('timer_update', handleTimerUpdate);
      socketClient.off('new_bid', handleNewBid);
      socketClient.off('connect', checkConnection);
    };
  }, [auctionId, status, updateDisplayFromRef]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!status) return;

    // Handle ended/cancelled
    if (status === 'ended' || status === 'cancelled') {
      setDisplayTime(status === 'ended' ? 'Ended' : 'Cancelled');
      setIsEnded(true);
      return;
    }

    if (auctionId && status === 'active' && initialServerTime !== null && initialServerTime !== undefined) {
      const storedDisplayEnd = getStoredDisplayEndTime(auctionId);
      
      if (storedDisplayEnd) {
        const displaySecondsLeft = Math.max(0, Math.floor((storedDisplayEnd - Date.now()) / 1000));
        displayCountdownRef.current = displaySecondsLeft;
      } else {
        let actualSeconds = 0;
        if (initialServerTime !== null && initialServerTime !== undefined) {
          actualSeconds = initialServerTime;
        } else if (targetTime) {
          const now = Date.now();
          const target = new Date(targetTime).getTime();
          actualSeconds = Math.max(0, Math.floor((target - now) / 1000));
        }
        
        displayCountdownRef.current = Math.min(actualSeconds, 15);
        setStoredDisplayEndTime(auctionId, Date.now() + displayCountdownRef.current * 1000);
      }
      
      if (initialServerTime !== null && initialServerTime !== undefined) {
        actualTimeRef.current = initialServerTime;
      } else if (targetTime) {
        const now = Date.now();
        const target = new Date(targetTime).getTime();
        actualTimeRef.current = Math.max(0, Math.floor((target - now) / 1000));
      }
      
      updateDisplayFromRef(status);
      return;
    }

    if (targetTime) {
      const now = Date.now();
      const target = new Date(targetTime).getTime();
      const initialSeconds = Math.max(0, Math.floor((target - now) / 1000));

      console.log('[useAuctionTimer] CASE 2:', { status, targetTime, now, target, initialSeconds, auctionId });

      if (initialSeconds <= 0 && status === 'scheduled') {
        setDisplayTime('Live Now');
        return;
      }

      actualTimeRef.current = initialSeconds;
      
      if (status === 'active' && auctionId) {
        const storedDisplayEnd = getStoredDisplayEndTime(auctionId);
        if (storedDisplayEnd) {
          const displaySecondsLeft = Math.max(0, Math.floor((storedDisplayEnd - Date.now()) / 1000));
          displayCountdownRef.current = displaySecondsLeft;
        } else {
          displayCountdownRef.current = Math.min(initialSeconds, 15);
          setStoredDisplayEndTime(auctionId, Date.now() + displayCountdownRef.current * 1000, false);
        }
      } else if (status === 'active') {
        displayCountdownRef.current = Math.min(initialSeconds, 15);
      } else {
        displayCountdownRef.current = initialSeconds;
      }
      
      updateDisplayFromRef(status);

      // Broadcast listener for timer resets 
      let broadcastHandler: ((event: MessageEvent) => void) | null = null;
      if (status === 'active' && auctionId && timerBroadcast) {
        broadcastHandler = (event: MessageEvent) => {
          if (event.data.type === 'timer_reset' && event.data.auctionId === auctionId) {
            const displaySecondsLeft = Math.max(0, Math.floor((event.data.endTime - Date.now()) / 1000));
            displayCountdownRef.current = displaySecondsLeft;
            updateDisplayFromRef(statusRef.current);
            console.log('[List Timer] Reset from broadcast:', displaySecondsLeft);
          }
        };
        timerBroadcast.addEventListener('message', broadcastHandler);
      }

      timerRef.current = setInterval(() => {
        actualTimeRef.current = Math.max(0, actualTimeRef.current - 1);
        displayCountdownRef.current = Math.max(0, displayCountdownRef.current - 1);
        
        if (auctionId && statusRef.current === 'active') {
          setStoredDisplayEndTime(auctionId, Date.now() + displayCountdownRef.current * 1000, false);
        }
        
        const displayVal = statusRef.current === 'active' 
          ? displayCountdownRef.current 
          : actualTimeRef.current;
        
        const formatted = formatDisplay(displayVal, statusRef.current);
        setDisplayTime(formatted);

        if (actualTimeRef.current <= 0) {
          setIsEnded(true);
          if (auctionId) {
            clearStoredDisplayEndTime(auctionId);
          }
          if (statusRef.current === 'scheduled' && auctionId) {
            socketClient.emit('update_auction_status', {
              auction_id: auctionId,
              new_status: 'active'
            });
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      }, 1000);
      
      // Return cleanup
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (broadcastHandler && timerBroadcast) {
          timerBroadcast.removeEventListener('message', broadcastHandler);
        }
      };
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [targetTime, status, auctionId, initialServerTime, updateDisplayFromRef, formatDisplay]);

  return { 
    timeLeft: actualTimeRef.current, 
    displayTime, 
    isEnded 
  };
};