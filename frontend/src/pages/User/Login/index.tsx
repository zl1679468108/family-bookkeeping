import React, { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../utils/auth'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import { useOnceEffect } from '../../../hooks/useOnceEffect'
import AuthLayout from '../../../components/AuthLayout'
import { LoginIllustration } from '../../../components/AuthLayout/AuthIllustrations'
import { notify } from '../../../utils/notifications'
import { getCaptcha } from '../../../services/api'
import { Button } from '../../../components/ui/Button'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [captchaCode, setCaptchaCode] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const [captchaSvg, setCaptchaSvg] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const refreshCaptcha = async () => {
    try {
      const { captchaId, svg } = await getCaptcha()
      setCaptchaId(captchaId)
      setCaptchaSvg(svg)
      setCaptchaCode('')
    } catch {
      // 错误已由全局通知处理
    }
  }

  useOnceEffect(() => {
    refreshCaptcha()
  })

  const { run: handleSubmit, isRunning: loading } = useDebouncedAction(async () => {
    if (!email || !password || !captchaCode) return
    try {
      await signIn(email, password, captchaId, captchaCode)
      const redirect = searchParams.get('redirect') || '/'
      navigate(redirect)
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败，请重试'
      notify({ type: 'error', message })
      refreshCaptcha()
    }
  })

  return (
    <AuthLayout
      illustration={<LoginIllustration />}
      title="欢迎回来"
      subtitle={
        <>
          <p>记录每一笔，看清每一分</p>
          <p>让家庭的财务井井有条</p>
        </>
      }
    >
      <h3>登录账户</h3>
      <p className="form-desc">欢迎回来，请输入您的账户信息</p>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
        <div className="form-group">
          <label htmlFor="loginEmail">邮箱地址</label>
          <input
            id="loginEmail"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="loginPass">密码</label>
          <div className="password-wrapper">
            <input
              id="loginPass"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="captchaCode">验证码</label>
          <div className="captcha-row">
            <input
              id="captchaCode"
              type="text"
              placeholder="请输入验证码"
              value={captchaCode}
              onChange={(e) => setCaptchaCode(e.target.value)}
              required
              maxLength={4}
              autoComplete="off"
            />
            {captchaSvg && (
              <img
                className="captcha-img"
                src={`data:image/svg+xml;utf8,${encodeURIComponent(captchaSvg)}`}
                alt="验证码"
                onClick={refreshCaptcha}
                title="点击刷新验证码"
              />
            )}
          </div>
        </div>

        <Button type="submit" variant="primary" block size="lg" className="btn-submit" disabled={loading}>
          {loading ? '登录中...' : '登 录'}
        </Button>
      </form>

      <div className="form-links">
        <Link to="/forgot-password">忘记密码？</Link>
        <Link to="/register">注册新账户</Link>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
