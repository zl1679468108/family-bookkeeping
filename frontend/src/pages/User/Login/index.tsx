import React, { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../utils/auth'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import { useOnceEffect } from '../../../hooks/useOnceEffect'
import AuthLayout from '../../../components/AuthLayout'
import { LoginIllustration } from '../../../components/AuthLayout/AuthIllustrations'
import { getCaptcha } from '../../../services/api'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaCode, setCaptchaCode] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const [captchaSvg, setCaptchaSvg] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 获取验证码
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

  // 页面加载时获取验证码（仅执行一次，避免 React 18 严格模式下重复请求）
  useOnceEffect(() => {
    refreshCaptcha()
  })

  const { run: handleSubmit, isRunning: loading } = useDebouncedAction(async () => {
    if (!email || !password || !captchaCode) return
    try {
      await signIn(email, password, captchaId, captchaCode)
      const redirect = searchParams.get('redirect') || '/'
      navigate(redirect)
    } catch {
      // 登录失败刷新验证码
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
          <input
            id="loginPass"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
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
            <div
              className="captcha-img"
              onClick={refreshCaptcha}
              title="点击刷新验证码"
              dangerouslySetInnerHTML={{ __html: captchaSvg }}
            />
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? '登录中...' : '登 录'}
        </button>
      </form>

      <div className="form-links">
        <Link to="/forgot-password">忘记密码？</Link>
        <Link to="/register">注册新账户</Link>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
