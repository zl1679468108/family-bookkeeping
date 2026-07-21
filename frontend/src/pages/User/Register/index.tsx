import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../../utils/auth'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import { notify } from '../../../utils/notifications'
import AuthLayout from '../../../components/AuthLayout'
import { RegisterIllustration } from '../../../components/AuthLayout/AuthIllustrations'

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const { run: handleSubmit, isRunning: loading } = useDebouncedAction(async () => {
    if (password !== confirmPassword) {
      notify({ type: 'error', message: '两次输入的密码不一致' })
      return
    }
    if (password.length < 6) {
      notify({ type: 'error', message: '密码长度至少为6位' })
      return
    }
    try {
      await signUp(email, password, username)
      navigate('/')
    } catch {
      // 错误已由全局通知处理
    }
  })

  return (
    <AuthLayout
      illustration={<RegisterIllustration />}
      title="开始记账"
      subtitle={
        <>
          <p>加入静记，开启智能记账之旅</p>
          <p>让每一笔收支都一目了然</p>
        </>
      }
    >
      <h3>创建账户</h3>
      <p className="form-desc">填写以下信息注册新账户</p>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
        <div className="form-group">
          <label htmlFor="regUser">用户名</label>
          <input
            id="regUser"
            type="text"
            placeholder="您的昵称"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="regEmail">邮箱地址</label>
          <input
            id="regEmail"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="regPass">密码</label>
            <div className="password-wrapper">
              <input
                id="regPass"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="至少6位"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
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
            <label htmlFor="regPass2">确认密码</label>
            <div className="password-wrapper">
              <input
                id="regPass2"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="再次输入"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(v => !v)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}
              </button>
            </div>
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? '注册中...' : '注 册'}
        </button>
      </form>

      <div className="form-links" style={{ justifyContent: 'center' }}>
        <Link to="/login">已有账户？立即登录</Link>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
