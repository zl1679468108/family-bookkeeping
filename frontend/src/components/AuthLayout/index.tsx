import React from 'react'
import './index.scss'
import { AUTH_BRAND_TAGLINE } from '../../utils/authCopy'

interface AuthLayoutProps {
  illustration: React.ReactNode
  title: string
  subtitle: React.ReactNode
  children: React.ReactNode
  footer?: string
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  illustration,
  title,
  subtitle,
  children,
  footer = AUTH_BRAND_TAGLINE,
}) => {
  return (
    <div className="auth-page">
      {/* ── 左侧：沉浸式插画面板 ── */}
      <div className="auth-illus">
        <div className="illus-bg">
          <div className="deco-circle" style={{ width: 420, height: 420, top: -100, right: -120 }} />
          <div className="deco-circle" style={{ width: 280, height: 280, bottom: -80, left: -60 }} />
          <div className="deco-circle" style={{ width: 100, height: 100, top: 280, left: 120 }} />
        </div>

        <div className="illus-content">
          <div className="illus-svg-wrap">{illustration}</div>
          <h2 className="illus-title">{title}</h2>
          <div className="illus-sub">{subtitle}</div>
        </div>

        <div className="illus-footer">{footer}</div>
      </div>

      {/* ── 右侧：表单面板 ── */}
      <div className="auth-form">
        <div className="form-inner">
          {/* Logo */}
          <div className="form-logo">
            <div className="fl-icon">静</div>
            <span className="fl-text">静记</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
