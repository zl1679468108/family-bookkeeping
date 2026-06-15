import React from 'react';
import './index.scss';

interface DetailItemProps {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}

export const DetailItem: React.FC<DetailItemProps> = ({ label, value, className = '' }) => {
  return (
    <div className={`detail-item ${className}`}>
      <span className="detail-item-label">{label}</span>
      <span className="detail-item-value">{value}</span>
    </div>
  );
};

export default DetailItem;
