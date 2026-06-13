import React from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmDanger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: React.ReactNode
}

/**
 * 通用确认弹窗
 * 项目所有删除/危险操作的二次确认统一使用此组件
 *
 * @example
 * <ConfirmDialog
 *   open={!!deleteTarget}
 *   title="确认删除"
 *   message="确定要删除这本书吗？删除后不可恢复。"
 *   onConfirm={handleDelete}
 *   onCancel={() => setDeleteTarget(null)}
 *   loading={mutation.isPending}
 * />
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText = '确认删除',
  cancelText = '取消',
  confirmDanger = true,
  loading = false,
  onConfirm,
  onCancel,
  children,
}) => {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onCancel}
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
          {title}
        </h3>
        <p style={{
          fontSize: '14px',
          lineHeight: 1.6,
          color: 'var(--muted)',
        }}>
          {message}
        </p>

        {children}

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
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
              transition: 'background 0.15s ease',
            }}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
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
              background: confirmDanger ? 'var(--danger)' : 'var(--accent)',
              color: '#fff',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s ease',
            }}
            onClick={onConfirm}
            disabled={loading}
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
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default ConfirmDialog
