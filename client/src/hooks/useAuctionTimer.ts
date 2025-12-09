import { useState, useEffect } from 'react';
import { socketClient } from '../services/socketClient.js';

export const useAuctionTimer = (targetTime: string, status: string, auctionId?: number) => {
  const [timeLeft, setTimeLeft] = useState<string>(status);
  const [isEnded, setIsEnded] = useState(false);
  const [hasTriggeredUpdate, setHasTriggeredUpdate] = useState(false);

  const calculateTime = () => {
    const now = new Date().getTime();
    const target = new Date(targetTime).getTime();
    const distance = target - now;

    if (distance <= 0) {
      if (status === 'scheduled') {
        setTimeLeft('Live Now');
        if (!hasTriggeredUpdate && auctionId) {
          socketClient.emit('update_auction_status', {
            auction_id: auctionId,
            new_status: 'active'
          });
          setHasTriggeredUpdate(true);
        }
      } else {
        setTimeLeft('Ended');
        setIsEnded(true);
      }
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (days > 0) {
      setTimeLeft(`${days}d ${hours}h`);
    } else {
      const h = String(hours).padStart(2, '0');
      const m = String(minutes).padStart(2, '0');
      const s = String(seconds).padStart(2, '0');
      setTimeLeft(`${h}:${m}:${s}`);
    }
  };

  useEffect(() => {
    if (status === 'ended') {
      setTimeLeft('Ended');
      setIsEnded(true);
      return;
    }
    if (status === 'cancelled') {
      setTimeLeft('Cancelled');
      setIsEnded(true);
      return;
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [targetTime, status]);

  return { timeLeft, isEnded };
};