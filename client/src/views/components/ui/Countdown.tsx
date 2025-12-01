import React, { useState, useEffect } from 'react';
import type { HTMLAttributes } from 'react';

type CountdownFormat = 'full' | 'short' | 'minimal';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface CountdownProps extends HTMLAttributes<HTMLDivElement> {
  targetDate: string | Date;
  onComplete?: () => void;
  format?: CountdownFormat;
  className?: string;
}

const Countdown: React.FC<CountdownProps> = ({ 
  targetDate, 
  onComplete,
  format = 'full',
  className = '',
  ...props 
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  function calculateTimeLeft(): TimeLeft {
    const difference = new Date(targetDate).getTime() - new Date().getTime();
    
    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const formatTime = () => {
    if (format === 'full') {
      return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else if (format === 'short') {
      if (timeLeft.days > 0) return `${timeLeft.days}d ${timeLeft.hours}h`;
      if (timeLeft.hours > 0) return `${timeLeft.hours}h ${timeLeft.minutes}m`;
      if (timeLeft.minutes > 0) return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
      return `${timeLeft.seconds}s`;
    } else if (format === 'minimal') {
      return `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;
    }
  };

  return (
    <div className={`text-xl font-bold text-gray-900 ${className}`} {...props}>
      {formatTime()}
    </div>
  );
};

export default Countdown;
