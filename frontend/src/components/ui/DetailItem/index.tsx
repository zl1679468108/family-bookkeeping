import React from 'react';
import { buildDetailItemClassName } from '../../../utils/detailItem';

interface DetailItemProps {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}

export const DetailItem: React.FC<DetailItemProps> = ({ label, value, className = '' }) => {
  return (
    <div className={buildDetailItemClassName({ className })}>
      <span className="detail-item-label">{label}</span>
      <span className="detail-item-value">{value}</span>
    </div>
  );
};

export default DetailItem;
