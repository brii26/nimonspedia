import { useState, useEffect } from 'react';

export const useAuctionTimer = (targetTime: string, status: string) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isEnded, setIsEnded] = useState(false);

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

    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(targetTime).getTime();
      const distance = target - now;

      if (distance < 0) {
        // Jika waktu habis
        if (status === 'scheduled') {
             setTimeLeft('Live Now'); // Transisi dari scheduled -> active
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

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [targetTime, status]);

  return { timeLeft, isEnded };
};