import React from 'react';
import type { HTMLAttributes } from 'react';

type RatingSize = 'sm' | 'md' | 'lg';

interface RatingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: number;
  max?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: RatingSize;
  icon?: string;
  className?: string;
}

interface RatingDisplayProps {
  value: number;
  max?: number;
  count: number;
}

const Rating: React.FC<RatingProps> = ({ 
  value = 0,
  max = 5,
  onChange,
  readonly = false,
  size = 'md',
  icon = '★',
  className = '',
  ...props 
}) => {
  const [hoverValue, setHoverValue] = React.useState(0);

  const sizeClasses: Record<RatingSize, string> = {
    sm: 'rating-sm',
    md: 'rating-md',
    lg: 'rating-lg',
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(0);
    }
  };

  const displayValue = hoverValue || value;

  const sizeMap = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div 
      className={`flex items-center gap-1 ${sizeMap[size]} ${readonly ? 'cursor-default' : 'cursor-pointer'} ${className}`}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {Array.from({ length: max }, (_, index) => {
        const rating = index + 1;
        const isFilled = rating <= displayValue;

        return (
          <button
            key={rating}
            type="button"
            className={`transition-colors ${
              isFilled ? 'text-yellow-400' : 'text-gray-300'
            } ${readonly ? 'cursor-default' : 'hover:scale-110 transform'}`}
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            disabled={readonly}
            aria-label={`Rate ${rating} out of ${max}`}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
};

export const RatingDisplay: React.FC<RatingDisplayProps & { showValue?: boolean; className?: string }> = ({ value = 0, max = 5, count, showValue = true, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Rating value={value} max={max} readonly onChange={() => {}} />
      {showValue && (
        <span className="text-sm font-medium text-gray-700">
          {value.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-sm text-gray-500">
          ({count})
        </span>
      )}
    </div>
  );
};

export default Rating;
