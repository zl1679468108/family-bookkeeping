import React from 'react'
import './index.scss'

interface AuthLayoutProps {
  /** SVG 插画组件 */
  illustration: React.ReactNode
  /** 插画标题 */
  title: string
  /** 插画副标题 */
  subtitle: any
  /** 右侧表单内容 */
  children: React.ReactNode
  /** 插画面板底部文字 */
  footer?: string
}

/**
 * 认证页面通用布局
 * 左侧：绿色渐变插画面板
 * 右侧：白色表单面板
 * ≤900px 隐藏左侧
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({
  illustration,
  title,
  subtitle,
  children,
  footer = '静记 · 让每一笔都清晰可见',
}) => {
  return (
    <div className="auth-page">
      {/* ── 左侧：插画面板 ── */}
      <div className="auth-illus">
        {/* 装饰圆 */}
        <div className="illus-bg">
          <div className="deco-circle" style={{ width: 420, height: 420, top: -100, right: -120, opacity: 0.06 }} />
          <div className="deco-circle" style={{ width: 280, height: 280, bottom: -80, left: -60, opacity: 0.04 }} />
          <div className="deco-circle" style={{ width: 100, height: 100, top: 280, left: 120, opacity: 0.06 }} />
        </div>

        {/* 插画内容 */}
        <div className="illus-content">
          <div className="illus-svg-wrap">{illustration}</div>
          <h2 className="illus-title">{title}</h2>
          <div className="illus-sub">{subtitle}</div>
        </div>

        {/* 底部文字 */}
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
