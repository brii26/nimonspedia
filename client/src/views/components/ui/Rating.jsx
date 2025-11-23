import React from 'react';

const Rating = ({ 
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

  const sizeClasses = {
    sm: 'rating-sm',
    md: 'rating-md',
    lg: 'rating-lg',
  };

  const handleClick = (rating) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating) => {
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

  return (
    <div 
      className={`rating ${sizeClasses[size]} ${readonly ? 'rating-readonly' : ''} ${className}`}
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
            className={`rating-star ${isFilled ? 'rating-star-filled' : ''}`}
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

export const RatingDisplay = ({ value = 0, max = 5, count, showValue = true, className = '' }) => {
  return (
    <div className={`rating-display ${className}`}>
      <Rating value={value} max={max} readonly />
      {showValue && (
        <span className="rating-value">
          {value.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="rating-count">
          ({count})
        </span>
      )}
    </div>
  );
};

export default Rating;
