import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socketClient from '../../../services/socketClient.js';
import { useAuctionTimer } from '../../../hooks/useAuctionTimer.js';
import { getProductImageUrl } from '../../../utils/imageUtils.js';
import { useAuth } from '../../../context/AuthContext.js';
import Modal, { ModalHeader, ModalBody } from '../../components/ui/Modal.js';
import Button from '../../components/ui/Button.js';
import Badge from '../../components/ui/Badge.js';
import Spinner from '../../components/ui/Spinner.js';

interface BidHistoryItem {
  bidder_name: string;
  amount: number;
  time: string;
  bidder_id?: number;
}

interface AuctionDetailData {
  auction_id: number;
  product_name: string;
  image: string | null; 
  description: string;
  starting_price: number;
  current_price: number;
  min_increment: number;
  quantity: number;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  start_time: string;
  end_time: string;
  winner_name?: string | null;
  owner_id?: number;
  store_name?: string;
  bid_history?: BidHistoryItem[];
}

const AuctionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  
  const [auction, setAuction] = useState<AuctionDetailData | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(true);
  const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [stoppedBySeller, setStoppedBySeller] = useState<string | null>(null);
  const [currentUserBalance, setCurrentUserBalance] = useState<number>(0);
  const [serverTimeLeft, setServerTimeLeft] = useState<number | null>(null);

  const auctionIdNum = id ? parseInt(id) : undefined;
  const targetTime = useMemo(() => {
      if (!auction) return '';
      const timeString = auction.status === 'scheduled' ? auction.start_time : auction.end_time;
      console.log('[AuctionDetail] targetTime calculation:', { 
        status: auction.status, 
        start_time: auction.start_time, 
        end_time: auction.end_time,
        selected: timeString 
      });
      return timeString || '';
  }, [auction]);

  const { timeLeft, displayTime, isEnded } = useAuctionTimer(targetTime, auction?.status || '', auctionIdNum, serverTimeLeft);
  const isSeller = auth?.user?.id != null && auction?.owner_id != null && String(auth.user.id) === String(auction.owner_id);

  useEffect(() => {
    if (auth?.user?.balance !== undefined) {
      setCurrentUserBalance(auth.user.balance);
    }
  }, [auth?.user?.balance]);

  useEffect(() => {
    if (!id) return;

    const auctionId = parseInt(id);
    
    // Join auction room
    const joinAuction = () => {
        console.log('[AuctionDetail] Emitting join_auction for:', auctionId);
        socketClient.emit('join_auction', { auctionId });
    };

    // Connect and join
    if (socketClient.isConnected()) {
        joinAuction();
    } else {
        try { 
            socketClient.connect();
            const socket = socketClient.getSocket();
            if (socket) {
                socket.once('connect', () => {
                    console.log('[AuctionDetail] Socket connected, now joining auction');
                    joinAuction();
                });
            }
        } catch(e) { 
            console.error('[AuctionDetail] Socket connection error:', e); 
            setError('Failed to connect to auction server');
            setLoading(false);
        }
    }

    // Timeout fallback 
    const joinTimeout = setTimeout(() => {
        if (loadingRef.current) {
            console.error('[AuctionDetail] Join auction timeout - no response from server');
            setError('Connection timeout. Please refresh the page.');
            setLoading(false);
            loadingRef.current = false;
        }
    }, 10000);

    // Listeners
    const handleJoined = (payload: any) => {
        clearTimeout(joinTimeout);
        console.log('[AuctionDetail] Received auction_joined:', payload);
        loadingRef.current = false;
        const auctionData = payload.auction;
        
        if (payload.timeLeft !== undefined) {
            setServerTimeLeft(payload.timeLeft);
        }
        
        setAuction({
            auction_id: auctionData.auction_id,
            product_name: auctionData.product_name,
            image: auctionData.image || auctionData.main_image_path, 
            description: auctionData.description || 'No description available',
            starting_price: Number(auctionData.starting_price),
            current_price: Number(auctionData.current_price),
            min_increment: Number(auctionData.min_increment),
            quantity: Number(auctionData.quantity) || 1,
            status: auctionData.status,
            start_time: auctionData.start_time,
            end_time: auctionData.end_time,
            winner_name: auctionData.winner_name,
            owner_id: auctionData.owner_id,
            store_name: auctionData.store_name
        });
        
        setBidHistory(auctionData.bid_history || []);
        setBidAmount(Number(auctionData.current_price) + Number(auctionData.min_increment));
        setLoading(false);
    };

    const handleNewBid = (payload: any) => {
        setAuction((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                current_price: payload.amount,
                end_time: payload.newEndTime ? new Date(payload.newEndTime).toISOString() : prev.end_time
            };
        });
        
        setBidHistory((prev) => [
            { 
                bidder_name: payload.bidderName, 
                amount: payload.amount, 
                time: new Date().toISOString(),
                bidder_id: payload.bidderId
            },
            ...prev
        ].slice(0, 10));
        
        if (auction) {
             setBidAmount(payload.amount + Number(auction.min_increment));
        }
    };

    const handleAuctionEnded = (payload: any) => {
        setAuction((prev) => {
            if(!prev) return null;
            return { ...prev, status: 'ended', winner_name: payload.winner };
        });
    };

    const handleBidPlaced = (payload: any) => {
        fetch('/api/node/auctions/user/balance', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setCurrentUserBalance(data.balance);
                console.log('Updated balance:', data.balance);
            }
        })
        .catch(err => console.error('Balance fetch error:', err));
    };

    const handleError = (payload: any) => {
        clearTimeout(joinTimeout);
        console.error('[AuctionDetail] Error:', payload);
        setError(payload.message);
        setLoading(false);
    };

    socketClient.on('auction_joined', handleJoined);
    socketClient.on('new_bid', handleNewBid);
    socketClient.on('bid_placed', handleBidPlaced);
    socketClient.on('auction_ended', handleAuctionEnded);
    socketClient.on('auction_error', handleError);
    socketClient.on('bid_error', handleError);

    return () => {
        clearTimeout(joinTimeout);
        socketClient.emit('leave_auction', { auctionId });
        socketClient.off('auction_joined', handleJoined);
        socketClient.off('new_bid', handleNewBid);
        socketClient.off('bid_placed', handleBidPlaced);
        socketClient.off('auction_ended', handleAuctionEnded);
        socketClient.off('auction_error', handleError);
        socketClient.off('bid_error', handleError);
    };
  }, [id]);

  const handlePlaceBid = async () => {
    if (!auction || !id) return;
    setError(null);

    const minimumBid = auction.current_price + auction.min_increment;
    if (bidAmount < minimumBid) {
        setError(`Bid minimal adalah Rp ${minimumBid.toLocaleString('id-ID')}`);
        return;
    }

    if (bidAmount > currentUserBalance) {
        setError(`Saldo tidak cukup. (Saldo: Rp ${currentUserBalance.toLocaleString('id-ID')})`);
        return;
    }

    try {
        const response = await fetch('/api/node/auctions/place-bid', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include',
            body: JSON.stringify({
                auction_id: parseInt(id),
                bid_amount: bidAmount
            })
        });

        const data = await response.json();

        if (data.success) {
            setError(null);
            
            // Update user balance 
            if (data.new_balance !== undefined) {
                setCurrentUserBalance(data.new_balance);
            }
            
            // Broadcast bid
            socketClient.emit('place_bid', {
                auctionId: parseInt(id),
                amount: bidAmount,
                bidId: data.data.bid_id
            });

            setBidAmount(data.data.new_price + auction.min_increment);

        } else {
            setError(data.message || 'Gagal menempatkan bid');
        }
    } catch (err) {
        console.error('Bid error:', err);
        setError('Terjadi kesalahan saat menempatkan bid');
    }
  };


    const handleStopAuction = () => {
        if (!auction || !id) return;
        setIsCancelling(true);
        socketClient.emit('stop_auction', { auctionId: parseInt(id) });
        setShowCancelModal(false);
        setTimeout(() => setIsCancelling(false), 1000);
    };

    // Listen for auction stopped event (for seller)
    useEffect(() => {
        const handleAuctionStopped = (payload: any) => {
            if (payload && payload.stoppedBy) {
                setStoppedBySeller(payload.stoppedBy);
            }
        };
        socketClient.on('auction_stopped', handleAuctionStopped);
        return () => {
            socketClient.off('auction_stopped', handleAuctionStopped);
        };
    }, []);

  if (loading) return (
    <div className="flex h-screen justify-center items-center bg-gray-50">
        <div className="text-center">
            <Spinner size="lg" variant="primary" />
            <p className="mt-4 text-gray-500 font-medium animate-pulse">Entering Auction Room...</p>
        </div>
    </div>
  );

  if (!auction) return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold text-gray-800">Auction Not Found</h2>
      <Button variant="ghost" onClick={() => navigate(isSeller ? '/seller/products' : '/auction')} className="mt-4">
        {isSeller ? 'Back to Products' : 'Back to List'}
      </Button>
    </div>
  );

  const finalImageUrl = getProductImageUrl(auction.image);
  const minimumBid = auction.current_price + auction.min_increment;
  const canBid = auction.status === 'active' && !isSeller && bidAmount >= minimumBid && bidAmount <= currentUserBalance;
  const canStopAuction = isSeller && auction.status === 'active';
  const totalBidders = new Set(bidHistory.map(b => b.bidder_name)).size;

  // UI Theme
  const getStatusColor = () => {
      switch(auction.status) {
          case 'active': return 'text-green-600 bg-green-50 border-green-200';
          case 'scheduled': return 'text-blue-600 bg-blue-50 border-blue-200';
          case 'ended': return 'text-gray-600 bg-gray-100 border-gray-200';
          case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
          default: return 'text-gray-600 bg-gray-50 border-gray-200';
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <button 
              onClick={() => {
                if (isSeller) {
                  window.location.href = '/seller/products';
                } else {
                  navigate('/auction');
                }
              }} 
              className="text-gray-500 hover:text-[#667eea] flex items-center gap-2 text-sm font-medium transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                {isSeller ? 'Back to Products' : 'Back to Auctions'}
            </button>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Status</span>
                <Badge variant={auction.status === 'active' ? 'success' : auction.status === 'scheduled' ? 'info' : 'gray'}>
                    {auction.status}
                </Badge>
            </div>
          </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 xl:col-span-8 space-y-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 overflow-hidden group">
                    <div className="relative aspect-video w-full bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                        <img 
                            src={finalImageUrl}
                            alt={auction.product_name} 
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/default-product.svg'; }}
                        />
                        {auction.status === 'ended' && (
                            <div className={`absolute top-4 left-4 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md ${
                                auction.winner_name ? 'bg-green-600/90' : 'bg-gray-600/90'
                            }`}>
                                {auction.winner_name ? 'Sold' : 'No Bids'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
                        {auction.product_name}
                    </h1>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                        <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                            <span className="font-medium text-gray-900 hover:text-[#667eea] cursor-pointer transition-colors">
                                {auction.store_name || 'Official Store'}
                            </span>
                        </div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <span>Stock: <span className="font-medium text-gray-900">{auction.quantity}</span></span>
                    </div>

                    <div className="prose prose-sm max-w-none text-gray-600">
                        <h3 className="text-gray-900 font-semibold mb-2">Description</h3>
                        <div className="leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: auction.description }} />
                    </div>
                </div>

                {/* Bid History Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            Live Bid History
                        </h3>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-200 text-gray-600 rounded-md">
                            {totalBidders} Participants
                        </span>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto">
                        {bidHistory.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">User</th>
                                        <th className="px-6 py-3 font-semibold text-right">Bid Amount</th>
                                        <th className="px-6 py-3 font-semibold text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bidHistory.slice(0, 15).map((bid, idx) => {
                                        const isMe = auth?.user?.id === bid.bidder_id;
                                        return (
                                            <tr key={idx} className={`hover:bg-gray-50 transition-colors ${idx === 0 ? 'bg-green-50/60' : ''}`}>
                                                <td className="px-6 py-3 font-medium text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isMe ? 'bg-[#667eea] text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                            {bid.bidder_name.charAt(0)}
                                                        </div>
                                                        {bid.bidder_name}
                                                        {idx === 0 && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold border border-green-200">LEADER</span>}
                                                        {isMe && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-200">YOU</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono font-medium text-gray-700">
                                                    Rp {bid.amount.toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-3 text-right text-gray-400 text-xs tabular-nums">
                                                    {new Date(bid.time).toLocaleTimeString('id-ID')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <svg className="w-12 h-12 mb-2 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/></svg>
                                <p className="text-sm">Be the first to place a bid!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== RIGHT COLUMN: ACTION PANEL ===== */}
            <div className="lg:col-span-5 xl:col-span-4 relative">
                <div className="sticky top-24 space-y-6">
                    
                    {/* --- MAIN BIDDING CARD --- */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
                        <div className={`h-2 w-full ${
                            auction.status === 'active' ? 'bg-gradient-to-r from-green-400 to-emerald-600' :
                            auction.status === 'scheduled' ? 'bg-gradient-to-r from-blue-400 to-indigo-600' :
                            'bg-gray-300'
                        }`}></div>

                        <div className="p-6">
                            {/* Timer Display */}
                            <div className="text-center mb-8">
                                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">
                                    {auction.status === 'scheduled' ? 'STARTS IN' : auction.status === 'active' ? 'CLOSING IN' : 'STATUS'}
                                </p>
                                <div className={`text-5xl font-mono font-bold tracking-tighter ${
                                    isEnded ? 'text-red-500' : 
                                    auction.status === 'active' ? 'text-gray-900' : 'text-blue-600'
                                }`}>
                                    {displayTime}
                                </div>
                                {auction.status === 'active' && (
                                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-green-600 animate-pulse">
                                        <span className="relative flex h-3 w-3">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                        </span>
                                        Live Bidding Active
                                    </div>
                                )}
                            </div>

                            {/* Price Display */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-sm text-gray-500">Current Highest Bid</span>
                                    {auction.status === 'active' && <span className="text-xs font-bold text-green-600">+ Increment Rp {auction.min_increment.toLocaleString()}</span>}
                                </div>
                                <div className="text-3xl font-bold text-gray-900">
                                    Rp {auction.current_price.toLocaleString('id-ID')}
                                </div>
                            </div>

                            {/* Bidding Controls */}
                            {auction.status === 'active' && !isSeller ? (
                                <div className="space-y-4">
                                    {/* Manual Input */}
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-gray-400 font-semibold">Rp</span>
                                        </div>
                                        <input 
                                            type="number"
                                            value={bidAmount || ''}
                                            onChange={(e) => setBidAmount(Number(e.target.value))}
                                            className="w-full pl-10 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-lg font-bold text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none transition-all shadow-sm"
                                            placeholder="0"
                                        />
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-2">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                            {error}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <Button 
                                        onClick={handlePlaceBid}
                                        disabled={!canBid}
                                        variant="primary"
                                        className="w-full py-4 text-lg shadow-lg hover:shadow-xl shadow-[#667eea]/30"
                                    >
                                        Place Bid Now
                                    </Button>
                                    
                                    <div className="text-center">
                                        <span className="text-xs text-gray-400">
                                            Your Balance: <span className="font-medium text-gray-600">Rp {currentUserBalance.toLocaleString()}</span>
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    {auction.status === 'scheduled' ? (
                                        <div>
                                            <p className="text-gray-900 font-bold mb-1">Upcoming</p>
                                            <p className="text-xs text-gray-500">Bidding opens when timer hits zero.</p>
                                        </div>
                                    ) : auction.status === 'ended' ? (
                                        <div>
                                            <p className="text-gray-900 font-bold mb-1">Auction Closed</p>
                                            {auction.winner_name ? (
                                                <p className="text-sm text-green-600 font-medium">Winner: {auction.winner_name}</p>
                                            ) : (
                                                <p className="text-sm text-gray-500">No bids were placed</p>
                                            )}
                                        </div>
                                    ) : isSeller ? (
                                        <div>
                                            <p className="text-gray-900 font-bold mb-1">Your Auction</p>
                                            <p className="text-xs text-gray-500">You cannot bid on your own item.</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-gray-900 font-bold mb-1">Auction In Progress</p>
                                            <p className="text-xs text-gray-500">Login to place a bid.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Seller Controls Footer */}
                        {isSeller && auction.status === 'active' && (
                            <div className="bg-gray-50 p-4 border-t border-gray-100">
                                <Button 
                                    onClick={() => setShowCancelModal(true)}
                                    variant="danger"
                                    className="w-full"
                                    size="sm"
                                    disabled={isCancelling}
                                >
                                    {isCancelling ? 'Processing...' : 'Stop Auction Early'}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* --- Helper Info Card --- */}
					{/* Helper Info Card or Auction Stopped Card */}
					{stoppedBySeller && !isSeller ? (
						<div className="bg-white rounded-xl shadow border border-red-200 p-6 flex flex-col items-center justify-center text-center animate-fade-in">
							<h4 className="text-lg font-bold text-red-600 mb-2">Auction had been stopped by {stoppedBySeller}</h4>
							<p className="text-xs text-gray-400 mt-2">This auction was ended early by the seller.</p>
						</div>
					) : (
						<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
							<div className="flex items-start gap-3">
									<div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
									</div>
									<div>
											<h4 className="text-sm font-bold text-gray-900">15 Sec</h4>
											<p className="text-xs text-gray-500 mt-1 leading-relaxed">
													Good Luck , and hev funn!!!
											</p>
									</div>
							</div>
						</div>
					)}

                </div>
            </div>

        </div>
      </div>

      {/* Cancel Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)}>
        <ModalHeader onClose={() => setShowCancelModal(false)}>Stop Auction</ModalHeader>
        <ModalBody>
          <div className="space-y-4 p-2">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-lg">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <p className="text-sm font-medium">The auction will end immediately.</p>
            </div>
            <p className="text-gray-600 text-sm">
              Highest bidder ({auction.current_price > auction.starting_price ? 'Present' : 'None'}) will be declared the winner.
            </p>
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="ghost" onClick={() => setShowCancelModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleStopAuction}>Confirm Stop</Button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default AuctionDetail;