import React from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarShape = 'circle' | 'square' | 'rounded';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null | undefined;
  alt?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  fallback?: string | null | undefined;
  className?: string;
}

interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  max?: number;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt = '', 
  size = 'md',
  shape = 'circle',
  fallback,
  className = '',
  ...props 
}) => {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses: Record<AvatarSize, string> = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const shapeClasses: Record<AvatarShape, string> = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const baseClasses = 'inline-flex items-center justify-center bg-[#42b549] text-white font-semibold overflow-hidden';
  const classes = `${baseClasses} ${sizeClasses[size]} ${shapeClasses[shape]} ${className}`;

  const handleError = () => {
    setImageError(true);
  };

  if (imageError || !src) {
    return (
      <div className={classes} {...props}>
        <span>
          {fallback || alt.charAt(0).toUpperCase() || '?'}
        </span>
      </div>
    );
  }

  return (
    <div className={classes} {...props}>
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover"
        onError={handleError}
      />
    </div>
  );
};

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ children, max = 3, className = '', ...props }) => {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  return (
    <div className={`flex items-center -space-x-2 ${className}`} {...props}>
      {visibleChildren}
      {remainingCount > 0 && (
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#42b549] text-white text-sm font-semibold">
          <span>+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};

export default Avatar;
