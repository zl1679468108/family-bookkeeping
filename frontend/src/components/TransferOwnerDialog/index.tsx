import React, { useState } from 'react';
import { request } from '../../services/api';
import { notify } from '../../utils/notifications';

interface TransferOwnerDialogProps {
  open: boolean;
  bookId: string;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * 转让账本所有权弹窗
 * 需要输入新所有者的邮箱和当前用户密码进行验证
 */
export const TransferOwnerDialog: React.FC<TransferOwnerDialogProps> = ({
  open,
  bookId,
  onClose,
  onConfirm,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await request('/books/' + bookId + '/transfer-owner', {
        method: 'PUT',
        requiresAuth: true,
        body: { newOwnerEmail: email.trim(), password },
      });
      notify({ type: 'success', message: '所有权转让成功' });
      setEmail('');
      setPassword('');
      onConfirm();
    } catch (err: any) {
      notify({ type: 'error', message: err.message || '转让失败' });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          margin: '0 16px',
          width: '100%',
          maxWidth: '380px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface)',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--fg)',
          marginBottom: '8px',
        }}>
          转让账本所有权
        </h3>
        <p style={{
          fontSize: '14px',
          lineHeight: 1.6,
          color: 'var(--muted)',
          marginBottom: '16px',
        }}>
          转让后，你将变为普通成员。请输入新所有者的邮箱和你的密码进行确认。
        </p>

        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--fg)', marginBottom: '6px' }}>
          新所有者邮箱
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="输入新所有者的注册邮箱"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            fontSize: '14px',
            background: 'var(--bg)',
            color: 'var(--fg)',
            marginBottom: '12px',
            boxSizing: 'border-box',
          }}
          autoFocus
        />

        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--fg)', marginBottom: '6px' }}>
          你的密码（验证身份）
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="输入你的登录密码"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            fontSize: '14px',
            background: 'var(--bg)',
            color: 'var(--fg)',
            marginBottom: '20px',
            boxSizing: 'border-box',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && email.trim() && password) {
              handleSubmit();
            }
          }}
        />

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            style={{
              flex: 1,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface)',
              color: 'var(--fg)',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'opacity 0.15s ease',
            }}
            onClick={onClose}
            disabled={loading}
          >
            取消
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: (loading || !email.trim() || !password) ? 'var(--muted)' : 'var(--accent)',
              color: '#fff',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: (loading || !email.trim() || !password) ? 'not-allowed' : 'pointer',
              opacity: (loading || !email.trim() || !password) ? 0.7 : 1,
              transition: 'opacity 0.15s ease',
            }}
            onClick={handleSubmit}
            disabled={loading || !email.trim() || !password}
          >
            {loading && (
              <svg
                style={{ width: '16px', height: '16px', animation: 'spin 0.8s linear infinite' }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            确认转让
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
