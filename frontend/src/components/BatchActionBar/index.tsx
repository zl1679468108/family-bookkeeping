import React from 'react';

interface BatchActionBarProps {
  selectedCount: number;
  loading: boolean;
  onUpdateCategory: () => void;
  onUpdateType: () => void;
  onUpdateDate: () => void;
  onMoveBook: () => void;
  onDelete: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  loading,
  onUpdateCategory,
  onUpdateType,
  onUpdateDate,
  onMoveBook,
  onDelete,
}) => {
  if (selectedCount === 0) return null;

  const btnStyle = (danger = false): React.CSSProperties => ({
    padding: '6px 12px',
    fontSize: '13px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    background: danger ? 'var(--danger)' : 'var(--surface)',
    color: danger ? '#fff' : 'var(--fg)',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap' as const,
  });

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
        已选 {selectedCount} 项
      </span>
      <button style={btnStyle()} disabled={loading} onClick={onUpdateCategory}>
        改分类
      </button>
      <button style={btnStyle()} disabled={loading} onClick={onUpdateType}>
        改类型
      </button>
      <button style={btnStyle()} disabled={loading} onClick={onUpdateDate}>
        改日期
      </button>
      <button style={btnStyle()} disabled={loading} onClick={onMoveBook}>
        迁移账本
      </button>
      <button style={btnStyle(true)} disabled={loading} onClick={onDelete}>
        🗑️ 删除
      </button>
    </div>
  );
};

export default BatchActionBar;
