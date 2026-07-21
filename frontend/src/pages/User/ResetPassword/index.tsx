import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPasswordByToken } from '../../../services/api'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import AuthLayout from '../../../components/AuthLayout'
import { ForgotIllustration } from '../../../components/AuthLayout/AuthIllustrations'

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const { run: handleSubmit, isRunning: submitLoading } = useDebouncedAction(async () => {
    if (password.length < 6) {
      setMessage('密码至少6位')
      setMessageType('error')
      return
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      setMessage('密码必须包含字母和数字')
      setMessageType('error')
      return
    }
    if (password !== confirmPassword) {
      setMessage('两次密码不一致')
      setMessageType('error')
      return
    }
    setMessage('')
    try {
      await resetPasswordByToken(token, password)
      setDone(true)
    } catch (err: any) {
      setMessage(err?.message || '重置失败，请重试')
      setMessageType('error')
    }
  })

  // 链接缺少 token：直接提示无效
  if (!token) {
    return (
      <AuthLayout
        illustration={<ForgotIllustration />}
        title="重置密码"
        subtitle={
          <>
            <p>链接无效或已失效</p>
            <p>请重新申请密码重置</p>
          </>
        }
      >
        <div className="auth-message error">重置链接缺少必要的令牌参数</div>
        <Link to="/forgot-password">
          <button type="button" className="btn-submit">
            去申请重置
          </button>
        </Link>
        <div className="form-links" style={{ justifyContent: 'center' }}>
          <Link to="/login">← 返回登录</Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      illustration={<ForgotIllustration />}
      title="设置新密码"
      subtitle={
        <>
          <p>请输入你的新密码</p>
          <p>重置后请使用新密码登录</p>
        </>
      }
    >
      <h3>重置密码</h3>
      <p className="form-desc">请设置一个至少 6 位、且包含字母和数字的新密码</p>

      {message && (
        <div className={`auth-message ${messageType}`}>{message}</div>
      )}

      {!done ? (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="resetNewPass">新密码</label>
              <div className="password-wrapper">
                <input
                  id="resetNewPass"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="至少6位，含字母和数字"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={submitLoading}
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
              <label htmlFor="resetNewPass2">确认密码</label>
              <div className="password-wrapper">
                <input
                  id="resetNewPass2"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="再次输入"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={submitLoading}
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

          <button type="submit" className="btn-submit" disabled={submitLoading}>
            {submitLoading ? '重置中...' : '重置密码'}
          </button>
        </form>
      ) : (
        <div>
          <div className="success-card">
            <div className="sc-icon">✅</div>
            <h4>密码重置成功</h4>
            <p>请使用新密码登录账户</p>
          </div>
          <Link to="/login">
            <button type="button" className="btn-submit" style={{ marginTop: 16 }}>
              返回登录
            </button>
          </Link>
        </div>
      )}

      <div className="form-links" style={{ justifyContent: 'center' }}>
        <Link to="/login">← 返回登录</Link>
      </div>
    </AuthLayout>
  )
}

export default ResetPassword
