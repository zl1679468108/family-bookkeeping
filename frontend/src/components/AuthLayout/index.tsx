import React from 'react'
import './index.scss'
import { AUTH_BRAND_TAGLINE } from '../../utils/authCopy'
import { APP_NAME, APP_BRAND_MARK } from '../../config/version'
import {
  AUTH_DECO_CIRCLES,
  authDecoCircleStyle,
  buildAuthPageClassName,
  buildAuthIllusClassName,
  buildAuthFormClassName,
} from '../../utils/authLayout'

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
    <div className={buildAuthPageClassName()}>
      {/* ── 左侧：沉浸式插画面板 ── */}
      <div className={buildAuthIllusClassName()}>
        <div className="illus-bg">
          {AUTH_DECO_CIRCLES.map((circle, idx) => (
            <div key={idx} className="deco-circle" style={authDecoCircleStyle(circle)} />
          ))}
        </div>

        <div className="illus-content">
          <div className="illus-svg-wrap">{illustration}</div>
          <h2 className="illus-title">{title}</h2>
          <div className="illus-sub">{subtitle}</div>
        </div>

        <div className="illus-footer">{footer}</div>
      </div>

      {/* ── 右侧：表单面板 ── */}
      <div className={buildAuthFormClassName()}>
        <div className="form-inner">
          {/* Logo */}
          <div className="form-logo">
            <div className="fl-icon">{APP_BRAND_MARK}</div>
            <span className="fl-text">{APP_NAME}</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
