import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import socketClient from '../services/socketClient.js';
import type { 
  AuctionBid, 
  AuctionData, 
  AuctionRoom,
  JoinAuctionPayload,
  PlaceBidPayload,
  BidPlacedResponse,
  AuctionTimerResponse,
  AuctionEndedResponse,
  SocketErrorResponse 
} from '../types/socket.js';

export const useAuctionSocket = (auctionId: number | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [auctionRoom, setAuctionRoom] = useState<AuctionRoom | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bidError, setBidError] = useState<string | null>(null);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [lastBidAmount, setLastBidAmount] = useState<number | null>(null);

  const currentAuctionId = useRef(auctionId);
  const timerInterval = useRef<number | null>(null);

  useEffect(() => {
    currentAuctionId.current = auctionId;
  }, [auctionId]);

  const connectSocket = useCallback(() => {
    try {
      const socketInstance = socketClient.connect();
      setSocket(socketInstance);
      setIsConnected(socketInstance.connected);

      // Socket event listeners
      socketInstance.on('connect', () => {
        setIsConnected(true);
        setError(null);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
        setIsJoined(false);
        clearTimer();
      });

      // Auction specific events
      socketInstance.on('auction_joined', (data: AuctionRoom) => {
        setAuctionRoom(data);
        setIsJoined(true);
        setIsJoining(false);
        startTimer();
      });

      socketInstance.on('auction_error', (errorData: SocketErrorResponse) => {
        setError(errorData.error);
        setIsJoining(false);
        setIsPlacingBid(false);
      });

      socketInstance.on('bid_error', (errorData: SocketErrorResponse) => {
        setBidError(errorData.error);
        setIsPlacingBid(false);
      });

      socketInstance.on('bid_placed', (data: BidPlacedResponse) => {
        setAuctionRoom(prev => prev ? {
          ...prev,
          current_price: data.current_price,
          bid_count: data.bid_count,
          recent_bids: [data.bid, ...prev.recent_bids.slice(0, 9)] // Keep last 10 bids
        } : null);
        
        setIsPlacingBid(false);
        setBidError(null);
        
        // Store last successful bid amount
        setLastBidAmount(data.bid.bid_amount);
      });

      socketInstance.on('auction_timer_update', (data: AuctionTimerResponse) => {
        setAuctionRoom(prev => prev ? {
          ...prev,
          time_remaining: data.time_remaining
        } : null);
      });

      socketInstance.on('auction_ended', (data: AuctionEndedResponse) => {
        if (data.auction_id === currentAuctionId.current) {
          setAuctionRoom(prev => prev ? {
            ...prev,
            auction: {
              ...prev.auction,
              status: 'ended' as const,
              winner_id: data.winner_id
            },
            current_price: data.final_price,
            time_remaining: 0
          } : null);
          clearTimer();
        }
      });

      return socketInstance;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to socket');
      setIsJoining(false);
      return null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    
    // Update timer every second for UI feedback
    timerInterval.current = window.setInterval(() => {
      setAuctionRoom(prev => {
        if (!prev || prev.time_remaining <= 0) {
          clearTimer();
          return prev;
        }
        
        return {
          ...prev,
          time_remaining: Math.max(0, prev.time_remaining - 1)
        };
      });
    }, 1000);
  }, [clearTimer]);

  const joinAuction = useCallback((auctionId: number) => {
    if (!socket || !isConnected) {
      setError('Socket not connected');
      return;
    }

    setIsJoining(true);
    setError(null);
    setBidError(null);
    
    const payload: JoinAuctionPayload = { auction_id: auctionId };
    socket.emit('join_auction', payload);
  }, [socket, isConnected]);

  const leaveAuction = useCallback((auctionId: number) => {
    if (!socket) return;

    socket.emit('leave_auction', { auction_id: auctionId });
    setAuctionRoom(null);
    setIsJoined(false);
    setLastBidAmount(null);
    clearTimer();
  }, [socket, clearTimer]);

  const placeBid = useCallback((auctionId: number, bidAmount: number) => {
    if (!socket || !isConnected) {
      setBidError('Socket not connected');
      return;
    }

    if (!isJoined) {
      setBidError('Not joined to auction');
      return;
    }

    if (isPlacingBid) {
      setBidError('Already placing a bid, please wait');
      return;
    }

    if (!auctionRoom) {
      setBidError('Auction data not available');
      return;
    }

    // Validate bid amount
    const minBid = auctionRoom.current_price + auctionRoom.auction.min_increment;
    if (bidAmount < minBid) {
      setBidError(`Minimum bid is ${minBid.toLocaleString()}`);
      return;
    }

    if (auctionRoom.auction.status !== 'active') {
      setBidError('Auction is not active');
      return;
    }

    if (auctionRoom.time_remaining <= 0) {
      setBidError('Auction has ended');
      return;
    }

    setIsPlacingBid(true);
    setBidError(null);

    const payload: PlaceBidPayload = { 
      auction_id: auctionId, 
      bid_amount: bidAmount 
    };
    
    socket.emit('place_bid', payload);
  }, [socket, isConnected, isJoined, isPlacingBid, auctionRoom]);

  // Helper to get minimum next bid
  const getMinimumBid = useCallback((): number => {
    if (!auctionRoom) return 0;
    return auctionRoom.current_price + auctionRoom.auction.min_increment;
  }, [auctionRoom]);

  // Helper to check if user can bid
  const canPlaceBid = useCallback((): boolean => {
    return !!(
      isConnected &&
      isJoined &&
      !isPlacingBid &&
      auctionRoom &&
      auctionRoom.auction.status === 'active' &&
      auctionRoom.time_remaining > 0
    );
  }, [isConnected, isJoined, isPlacingBid, auctionRoom]);

  // Helper to format time remaining
  const formatTimeRemaining = useCallback((seconds: number): string => {
    if (seconds <= 0) return 'Ended';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Auto join auction when auctionId changes
  useEffect(() => {
    if (!auctionId) {
      setAuctionRoom(null);
      setIsJoined(false);
      clearTimer();
      return;
    }

    if (!socket) {
      connectSocket();
      return;
    }

    if (isConnected && !isJoined && !isJoining) {
      joinAuction(auctionId);
    }

    return () => {
      if (auctionId) {
        leaveAuction(auctionId);
      }
    };
  }, [auctionId, socket, isConnected, isJoined, isJoining, connectSocket, joinAuction, leaveAuction, clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      if (currentAuctionId.current) {
        leaveAuction(currentAuctionId.current);
      }
    };
  }, [leaveAuction, clearTimer]);

  return {
    // State
    auctionRoom,
    isConnected,
    isJoined,
    isJoining,
    error,
    bidError,
    isPlacingBid,
    lastBidAmount,
    
    // Actions
    placeBid,
    joinAuction,
    leaveAuction,
    connectSocket,
    
    // Utils
    getMinimumBid,
    canPlaceBid,
    formatTimeRemaining,
    clearError: () => setError(null),
    clearBidError: () => setBidError(null),
    
    // Computed values
    timeRemaining: auctionRoom?.time_remaining || 0,
    currentPrice: auctionRoom?.current_price || 0,
    bidCount: auctionRoom?.bid_count || 0,
    auctionStatus: auctionRoom?.auction?.status || 'upcoming',
    isAuctionActive: auctionRoom?.auction?.status === 'active' && (auctionRoom?.time_remaining || 0) > 0
  };
};