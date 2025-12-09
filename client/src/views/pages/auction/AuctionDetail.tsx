import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socketClient from '../../../services/socketClient.js';
import { useAuctionTimer } from '../../../hooks/useAuctionTimer.js';
import { getProductImageUrl } from '../../../utils/imageUtils.js';

interface AuctionDetailData {
  id: number;
  title: string;
  image: string | null; 
  description: string;
  current_price: number;
  min_increment: number;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  start_time: string;
  end_time: string;
  winner_name?: string;
  bid_history: {
    bidder_name: string;
    amount: number;
    time: string;
  }[];
}

const AuctionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [auction, setAuction] = useState<AuctionDetailData | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Hook Timer
  const targetTime = auction?.status === 'scheduled' ? auction.start_time : auction?.end_time || '';
  const { timeLeft, isEnded } = useAuctionTimer(targetTime, auction?.status || '');

  useEffect(() => {
    if (!id) return;

    if (!socketClient.isConnected()) {
        try {
            socketClient.connect();
        } catch(e) { console.error(e); }
    }

    const auctionId = parseInt(id);

    socketClient.emit('join_auction', { auctionId });

    // Listeners
    const handleJoined = (payload: any) => {

        setAuction({
            id: payload.auction.auction_id,
            title: payload.auction.product_name || payload.auction.title,
            image: payload.auction.image || payload.auction.main_image_path, 
            description: payload.auction.description || 'No description',
            current_price: Number(payload.auction.current_price),
            min_increment: Number(payload.auction.min_increment),
            status: payload.auction.status,
            start_time: payload.auction.start_time,
            end_time: payload.auction.end_time,
            winner_name: payload.auction.winner_name,
            bid_history: payload.auction.bid_history || []
        });
        
        // Set default bid suggestion
        setBidAmount(Number(payload.auction.current_price) + Number(payload.auction.min_increment));
        setLoading(false);
    };

    const handleNewBid = (payload: any) => {
        setAuction((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                current_price: payload.amount,
                end_time: payload.newEndTime ? new Date(payload.newEndTime).toISOString() : prev.end_time,
                bid_history: [
                    { 
                        bidder_name: payload.bidderName, 
                        amount: payload.amount, 
                        time: new Date().toISOString() 
                    },
                    ...(prev.bid_history || []).slice(0, 9)
                ]
            };
        });
        setBidAmount(payload.amount + (auction?.min_increment || 0));
    };

    const handleAuctionEnded = (payload: any) => {
        setAuction((prev) => {
            if(!prev) return null;
            return { ...prev, status: 'ended', winner_name: payload.winner };
        });
    };

    const handleError = (payload: any) => {
        setError(payload.message);
        setLoading(false);
    };

    socketClient.on('auction_joined', handleJoined);
    socketClient.on('new_bid', handleNewBid);
    socketClient.on('auction_ended', handleAuctionEnded);
    socketClient.on('auction_error', handleError);
    socketClient.on('bid_error', handleError);

    return () => {
        socketClient.emit('leave_auction', { auctionId });
        socketClient.off('auction_joined', handleJoined);
        socketClient.off('new_bid', handleNewBid);
        socketClient.off('auction_ended', handleAuctionEnded);
        socketClient.off('auction_error', handleError);
        socketClient.off('bid_error', handleError);
    };
  }, [id]);

  const handlePlaceBid = () => {
    if (!auction || !id) return;
    setError(null);

    if (bidAmount < auction.current_price + auction.min_increment) {
        setError(`Bid minimal adalah Rp ${(auction.current_price + auction.min_increment).toLocaleString('id-ID')}`);
        return;
    }

    socketClient.emit('place_bid', {
        auctionId: parseInt(id),
        amount: bidAmount
    });
  };

  if (loading) return (
    <div className="flex h-screen justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!auction) return <div className="p-8 text-center text-red-500">Auction not found</div>;

  // Generate URL Gambar
  const finalImageUrl = getProductImageUrl(auction.image);

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={() => navigate('/auction')} className="mb-6 text-gray-600 hover:text-blue-600 flex items-center">
        ← Back to List
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-xl shadow-lg overflow-hidden">
        
        {/* Left: Image */}
        <div className="bg-gray-100 p-4 flex items-center justify-center min-h-[400px]">
          <img 
            src={finalImageUrl}
            alt={auction.title} 
            className="max-h-[500px] object-contain w-full rounded-lg"
            onError={(e) => {
                (e.target as HTMLImageElement).src = '/storage/product_images/default-product.svg';
            }}
          />
        </div>

        {/* Right: Info & Bidding */}
        <div className="p-8 flex flex-col">
           <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{auction.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                ${auction.status === 'active' ? 'bg-green-100 text-green-800' : 
                  auction.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}
              `}>
                {auction.status}
              </span>
           </div>

           <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">
                {auction.status === 'scheduled' ? 'Auction starts in:' : 'Auction ends in:'}
              </p>
              <div className={`text-3xl font-mono font-bold ${isEnded ? 'text-red-500' : 'text-blue-600'}`}>
                 {timeLeft}
              </div>
           </div>

           <div className="mt-6">
              <p className="text-sm text-gray-500">Current Price</p>
              <p className="text-4xl font-bold text-green-600">
                Rp {auction.current_price.toLocaleString('id-ID')}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Min. Increment: Rp {auction.min_increment.toLocaleString('id-ID')}
              </p>
           </div>

           {error && (
             <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">
               {error}
             </div>
           )}

           {auction.status === 'active' ? (
             <div className="mt-6 p-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bid</label>
                <div className="flex space-x-2">
                   <input 
                     type="number"
                     value={bidAmount}
                     onChange={(e) => setBidAmount(Number(e.target.value))}
                     className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                     min={auction.current_price + auction.min_increment}
                   />
                   <button 
                     onClick={handlePlaceBid}
                     className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm"
                   >
                     Place Bid
                   </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                   Minimal bid: Rp {(auction.current_price + auction.min_increment).toLocaleString('id-ID')}
                </p>
             </div>
           ) : auction.status === 'ended' ? (
             <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-yellow-800 font-bold text-lg">Auction Ended</p>
                {auction.winner_name && (
                    <p className="text-yellow-700">Pemenang: {auction.winner_name}</p>
                )}
             </div>
           ) : null}

           <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Bid History</h3>
              <div className="space-y-3">
                 {auction.bid_history?.length > 0 ? (
                    auction.bid_history.map((bid, idx) => (
                       <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                          <span className="font-medium text-gray-700">
                             {bid.bidder_name}
                             {idx === 0 && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Highest</span>}
                          </span>
                          <span className="text-gray-500">Rp {bid.amount.toLocaleString('id-ID')}</span>
                       </div>
                    ))
                 ) : (
                    <p className="text-gray-400 text-sm italic">No bids yet</p>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;