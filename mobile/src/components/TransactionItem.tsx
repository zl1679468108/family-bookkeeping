/**
 * TransactionItem — Swipeable transaction row with delete action.
 */

import React, { useState, useRef, useCallback } from 'react';
import { getCategoryBg } from '../utils/categoryColors';

interface TransactionItemProps {
  icon: string;
  categoryName: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense';
  onClick?: () => void;
  onDelete?: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  icon,
  categoryName,
  description,
  amount,
  type,
  onClick,
  onDelete,
}) => {
  const amountStr = `${type === 'income' ? '+' : '-'}¥${amount.toFixed(2)}`;
  const amountColor = type === 'income' ? 'text-success' : 'text-danger';

  const [swiped, setSwiped] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!onDelete) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    },
    [onDelete],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!onDelete) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (Math.abs(dy) > Math.abs(dx)) return;
      const clamped = Math.max(-80, Math.min(0, (swiped ? -80 : 0) + dx));
      setOffsetX(clamped);
    },
    [onDelete, swiped],
  );

  const handleTouchEnd = useCallback(() => {
    if (!onDelete) return;
    if (offsetX < -40) {
      setOffsetX(-80);
      setSwiped(true);
    } else {
      setOffsetX(0);
      setSwiped(false);
    }
  }, [offsetX, onDelete]);

  const handleDelete = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onDelete?.();
    setOffsetX(0);
    setSwiped(false);
  };

  const handleTap = () => {
    if (swiped) {
      setOffsetX(0);
      setSwiped(false);
      return;
    }
    onClick?.();
  };

  return (
    <div className="relative overflow-hidden">
      {/* Delete background */}
      {onDelete && (
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            onClick={handleDelete}
            className="h-full px-6 bg-[#D85A30] text-white text-sm font-medium active:opacity-80"
            style={{ width: 80 }}
          >
            删除
          </button>
        </div>
      )}

      {/* Content */}
      <div
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex items-center gap-3 py-3 px-4 bg-white active:bg-gray-50 transition-colors relative"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: offsetX === 0 && !swiped ? 'transform 0.15s ease' : 'none',
        }}
        role="button"
        tabIndex={0}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${getCategoryBg(categoryName)}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{categoryName}</p>
          {description && (
            <p className="text-xs text-text-secondary truncate">{description}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-base font-semibold ${amountColor}`}>{amountStr}</p>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;
