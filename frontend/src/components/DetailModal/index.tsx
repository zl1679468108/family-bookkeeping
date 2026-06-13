import React from 'react'
import './index.scss'

interface DetailModalProps {
  visible: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export const DetailModal: React.FC<DetailModalProps> = ({
  visible,
  onClose,
  title,
  children,
  footer,
}) => {
  if (!visible) return null

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <h2>{title}</h2>
          <button className="detail-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="detail-modal-body">
          {children}
        </div>
        {footer && (
          <div className="detail-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default DetailModal
