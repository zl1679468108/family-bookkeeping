import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { resetPasswordByCode, sendResetCode } from '../../../services/api'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import AuthLayout from '../../../components/AuthLayout'
import { ForgotIllustration } from '../../../components/AuthLayout/AuthIllustrations'

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState<number>(1)
  const [countdown, setCountdown] = useState(0)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const { run: handleSendCode, isRunning: sendLoading } = useDebouncedAction(async () => {
    if (!email) {
      setMessage('请输入有效的邮箱地址')
      setMessageType('error')
      return
    }
    setMessage('')
    try {
      await sendResetCode(email)
      setMessage('验证码已发送至 ' + email)
      setMessageType('success')
      setStep(2)
      setCountdown(60)
    } catch {
      setMessage('发送失败，请检查邮箱地址')
      setMessageType('error')
    }
  })

  const { run: handleSubmit, isRunning: submitLoading } = useDebouncedAction(async () => {
    if (!code || code.length !== 6) {
      setMessage('请输入6位验证码')
      setMessageType('error')
      return
    }
    if (password.length < 6) {
      setMessage('密码至少6位')
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
      await resetPasswordByCode(email, code, password, confirmPassword)
      setStep(3)
    } catch {
      // 错误已由全局通知处理
    }
  })

  const { run: handleResend, isRunning: resendLoading } = useDebouncedAction(async () => {
    try {
      await sendResetCode(email)
      setCountdown(60)
      setMessage('验证码已重新发送')
      setMessageType('success')
    } catch {
      // 忽略
    }
  })

  const title = step === 1 ? '忘记密码' : step === 3 ? '重置成功' : '重置密码'
  const subtitle = step === 1
    ? '请输入注册邮箱，我们将发送验证码'
    : step === 3
      ? '密码已更新，请使用新密码登录'
      : '验证码已发送至您的邮箱'

  return (
    <AuthLayout
      illustration={<ForgotIllustration />}
      title="找回密码"
      subtitle={
        <>
          <p>别担心，我们帮你找回</p>
          <p>请验证您的身份信息</p>
        </>
      }
    >
      <h3>{title}</h3>
      <p className="form-desc">{subtitle}</p>

      {step !== 3 && (
        <div className="step-indicator">
          <div className={`step-dot ${step === 1 ? 'active' : 'done'}`} />
          <div className={`step-line ${step >= 2 ? 'done' : ''}`} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
        </div>
      )}

      {message && (
        <div className={`auth-message ${messageType}`}>{message}</div>
      )}

      {step === 1 && (
        <div>
          <div className="form-group">
            <label htmlFor="forgotEmail">邮箱地址</label>
            <input
              id="forgotEmail"
              type="email"
              placeholder="注册时使用的邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <button
            type="button"
            className="btn-submit"
            onClick={handleSendCode}
            disabled={sendLoading}
          >
            {sendLoading ? '发送中...' : '发送验证码'}
          </button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
          <div className="form-group">
            <label htmlFor="forgotEmailDisplay">邮箱地址</label>
            <input
              id="forgotEmailDisplay"
              type="email"
              value={email}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="forgotCode">验证码</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="forgotCode"
                type="text"
                placeholder="6位数字"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                style={{ flex: 1 }}
                disabled={submitLoading}
              />
              <button
                type="button"
                className="btn-code"
                onClick={handleResend}
                disabled={countdown > 0 || resendLoading}
              >
                {countdown > 0 ? `${countdown}s` : (resendLoading ? '发送中...' : '重新发送')}
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="forgotNewPass">新密码</label>
              <input
                id="forgotNewPass"
                type="password"
                placeholder="至少6位"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={submitLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="forgotNewPass2">确认密码</label>
              <input
                id="forgotNewPass2"
                type="password"
                placeholder="再次输入"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={submitLoading}
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={submitLoading}>
            {submitLoading ? '重置中...' : '重置密码'}
          </button>
        </form>
      )}

      {step === 3 && (
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

      {step !== 3 && (
        <div className="form-links" style={{ justifyContent: 'center' }}>
          <Link to="/login">← 返回登录</Link>
        </div>
      )}
    </AuthLayout>
  )
}

export default ForgotPassword
