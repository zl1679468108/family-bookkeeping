import React, { useState, useEffect } from 'react';
import type { Template } from '../../types/template';

interface TemplatePopoverProps {
  template: Template;
  open: boolean;
  onClose: () => void;
  onExecute: (amount?: number) => void;
}

export const TemplatePopover: React.FC<TemplatePopoverProps> = ({
  template, open, onClose, onExecute,
}) => {
  const [amount, setAmount] = useState('');
  useEffect(() => { if (open) setAmount(template.amount ? String(template.amount) : ''); }, [open, template]);

  if (!open) return null;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 24,
        minWidth: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📋 {template.name}</h3>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          类型: {template.type === 'income' ? '💰 收入' : '💸 支出'}
          {template.note && <div>备注: {template.note}</div>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>金额</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="输入金额" style={{
              width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)',
              fontSize: 16, background: 'var(--surface)', color: 'var(--fg)',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--fg)', cursor: 'pointer',
          }}>取消</button>
          <button onClick={() => onExecute(amount ? Number(amount) : undefined)} style={{
            padding: '8px 16px', borderRadius: 6, border: 'none',
            background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600,
          }}>确认记账</button>
        </div>
      </div>
    </div>
  );
};
