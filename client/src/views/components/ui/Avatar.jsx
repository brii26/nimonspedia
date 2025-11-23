import React from 'react';

const Avatar = ({ 
  src, 
  alt = '', 
  size = 'md',
  shape = 'circle',
  fallback,
  className = '',
  ...props 
}) => {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    xs: 'avatar-xs',
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl',
  };

  const shapeClasses = {
    circle: 'avatar-circle',
    square: 'avatar-square',
    rounded: 'avatar-rounded',
  };

  const classes = [
    'avatar',
    sizeClasses[size],
    shapeClasses[shape],
    className
  ].filter(Boolean).join(' ');

  const handleError = () => {
    setImageError(true);
  };

  if (imageError || !src) {
    return (
      <div className={classes} {...props}>
        <span className="avatar-fallback">
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
        className="avatar-img"
        onError={handleError}
      />
    </div>
  );
};

export const AvatarGroup = ({ children, max = 3, className = '', ...props }) => {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  return (
    <div className={`avatar-group ${className}`} {...props}>
      {visibleChildren}
      {remainingCount > 0 && (
        <div className="avatar avatar-md avatar-circle">
          <span className="avatar-fallback">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};

export default Avatar;
