import { useState, useEffect, useRef, useCallback } from 'react';
import { socketClient } from '../services/socketClient.js';

export const useAuctionTimer = (
  targetTime: string, 
  status: string, 
  auctionId?: number, 
  initialServerTime?: number | null
) => {
  const [displayTime, setDisplayTime] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isEnded, setIsEnded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statusRef = useRef<string>(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

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

  useEffect(() => {
    if (!auctionId) return;
    if (status !== 'active') return;

    const handleTimerUpdate = (payload: any) => {
      if (payload.auctionId === auctionId) {
        const serverDisplayTime = payload.displayTimeLeft ?? Math.min(payload.timeLeft, 15);
        setTimeLeft(payload.timeLeft);
        setDisplayTime(formatDisplay(serverDisplayTime, 'active'));
        
        if (payload.timeLeft <= 0) {
          setIsEnded(true);
        }
      }
    };

    socketClient.on('timer_update', handleTimerUpdate);
    
    return () => {
      socketClient.off('timer_update', handleTimerUpdate);
    };
  }, [auctionId, status, formatDisplay]);

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

    // Local Timer
    if (status === 'scheduled' && targetTime) {
      const target = new Date(targetTime).getTime();
      
      const tick = () => {
        const now = Date.now();
        const seconds = Math.max(0, Math.floor((target - now) / 1000));
        setTimeLeft(seconds);
        setDisplayTime(formatDisplay(seconds, 'scheduled'));
        
        if (seconds <= 0) {
          setIsEnded(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      };
      
      tick(); 
      timerRef.current = setInterval(tick, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }

    // Server Time
    if (status === 'active') {
      let initialDisplay = 15;
      let actualSeconds = 0;
      
      if (initialServerTime !== null && initialServerTime !== undefined) {
        initialDisplay = initialServerTime;
        if (targetTime) {
          const now = Date.now();
          const target = new Date(targetTime).getTime();
          actualSeconds = Math.max(0, Math.floor((target - now) / 1000));
        } else {
          actualSeconds = initialServerTime;
        }
      } else if (targetTime) {
        const now = Date.now();
        const target = new Date(targetTime).getTime();
        actualSeconds = Math.max(0, Math.floor((target - now) / 1000));
        initialDisplay = Math.min(actualSeconds, 15);
      }
      
      setTimeLeft(actualSeconds);
      setDisplayTime(formatDisplay(initialDisplay, 'active'));
      
      if (actualSeconds <= 0) {
        setIsEnded(true);
        return;
      }
      
      if (!auctionId) {
        let localDisplay = initialDisplay;
        let localActual = actualSeconds;
        
        timerRef.current = setInterval(() => {
          localActual = Math.max(0, localActual - 1);
          localDisplay = Math.max(0, localDisplay - 1);
          
          setTimeLeft(localActual);
          setDisplayTime(formatDisplay(localDisplay, 'active'));
          
          if (localActual <= 0) {
            setIsEnded(true);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
          }
        }, 1000);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, targetTime, initialServerTime, formatDisplay, auctionId]);

  return { 
    timeLeft, 
    displayTime, 
    isEnded
  };
};
export default useAuctionTimer;