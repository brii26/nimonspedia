import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuctionTimer } from '../../../hooks/useAuctionTimer.js';
import Badge from '../ui/Badge.js';
import { getProductImageUrl } from '../../../utils/imageUtils.js'; 

interface AuctionCardProps {
  id: number;
  title: string;
  image: string;
  price: number;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  startTime: string;
  endsAt: string;
  bidCount?: number;
}

const AuctionCard: React.FC<AuctionCardProps> = ({ 
  id, title, image, price, status, startTime, endsAt, bidCount = 0 
}) => {
  const navigate = useNavigate();
  
  const targetTime = status === 'scheduled' ? startTime : endsAt;
  const { timeLeft, isEnded } = useAuctionTimer(targetTime, status);
  const finalImageUrl = getProductImageUrl(image);

  const getBadgeVariant = () => {
    switch(status) {
      case 'active': return 'success';
      case 'scheduled': return 'info';
      case 'ended': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'gray';
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 overflow-hidden flex flex-col h-full"
      onClick={() => navigate(`/auction/${id}`)}
    >
      {/* Image Section */}
      <div className="relative h-48 w-full bg-gray-100">
        <img 
          src={finalImageUrl} 
          alt={title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge variant={getBadgeVariant()} size="sm">
            {status}
          </Badge>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-800 line-clamp-1 mb-1" title={title}>
          {title}
        </h3>
        
        <div className="mt-auto">
          <p className="text-xs text-gray-500 mb-0.5">
            {status === 'scheduled' ? 'Starting Price' : 'Current Bid'}
          </p>
          <p className="text-xl font-bold text-gray-900">
            Rp {price.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
           <div className="flex flex-col">
             <span className="text-xs text-gray-500">
               {status === 'scheduled' ? 'Starts in:' : 'Ends in:'}
             </span>
             <span className={`font-mono font-medium ${isEnded ? 'text-red-500' : 'text-blue-600'}`}>
               {timeLeft}
             </span>
           </div>

           <div className="flex flex-col items-end">
             <span className="text-xs text-gray-500">Bidders</span>
             <span className="font-medium text-gray-700">
               {bidCount} <span className="text-xs text-gray-400">bids</span>
             </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionCard;