import React from 'react';

const Skeleton = ({ 
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  ...props 
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rect: 'rounded-md',
    avatar: 'rounded-full',
  };

  const style = {
    width: width || (variant === 'circle' || variant === 'avatar' ? '40px' : '100%'),
    height: height || (variant === 'text' ? '1rem' : variant === 'circle' || variant === 'avatar' ? '40px' : '100px'),
  };

  const skeletons = Array(count).fill(null);

  return (
    <>
      {skeletons.map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 animate-pulse ${variantClasses[variant]} ${className}`}
          style={style}
          {...props}
        />
      ))}
    </>
  );
};

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <Skeleton variant="rect" height="200px" />
      <div className="p-4 space-y-3">
        <Skeleton width="60%" height="1.5rem" />
        <Skeleton width="100%" count={2} />
        <Skeleton width="40%" />
      </div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div className="grid gap-4 p-4 bg-gray-50 border-b border-gray-200" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array(columns).fill(null).map((_, i) => (
          <Skeleton key={i} height="2rem" />
        ))}
      </div>
      <div className="divide-y divide-gray-200">
        {Array(rows).fill(null).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array(columns).fill(null).map((_, colIndex) => (
              <Skeleton key={colIndex} height="1.5rem" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
