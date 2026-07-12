import React from 'react';

interface SpaceProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  direction?: 'horizontal' | 'vertical';
  className?: string;
  children: React.ReactNode;
}

export const Space: React.FC<SpaceProps> = ({
  size = 'md',
  direction = 'horizontal',
  className = '',
  children,
}) => {
  const sizeMap = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
  };

  return (
    <div
      className={`space space--${direction} space--${size} ${className}`}
      style={{
        gap: sizeMap[size],
      }}
    >
      {React.Children.map(children, (child, index) => (
        child && <div key={index}>{child}</div>
      ))}
    </div>
  );
};

export default Space;
