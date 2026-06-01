import React from 'react';

interface TemplateBadgeProps {
  name: string;
  type: 'expense' | 'income';
  onClick: () => void;
}

export const TemplateBadge: React.FC<TemplateBadgeProps> = ({ name, type, onClick }) => (
  <button onClick={onClick} style={{
    display: 'block', width: '100%', textAlign: 'left',
    padding: '6px 10px', marginBottom: 4, borderRadius: 6,
    border: '1px solid var(--border)', background: 'var(--surface)',
    color: type === 'income' ? 'var(--success)' : 'var(--danger)',
    fontSize: 13, cursor: 'pointer',
  }}>
    📋 {name}
  </button>
);
