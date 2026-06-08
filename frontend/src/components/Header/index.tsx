import React from 'react'
import './index.scss'

interface HeaderProps {
  title: string
  description?: string
  onBack?: () => void
  children?: React.ReactNode
}

export const Header: React.FC<HeaderProps> = ({ title, description, onBack, children }) => {
  return (
    <div className="page-header">
      <div className="page-header__left">
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: '13px',
              cursor: 'pointer',
              marginBottom: '8px',
              padding: '0',
            }}
          >
            <span>←</span>
            <span>返回</span>
          </button>
        )}
        <div className="page-header__title-row">
          <span className="page-header__bar" aria-hidden="true" />
          <h1 className="page-header__title">{title}</h1>
        </div>
        {description && (
          <p className="page-header__desc">{description}</p>
        )}
      </div>
      {children && <div className="page-header__actions">{children}</div>}
    </div>
  )
}
