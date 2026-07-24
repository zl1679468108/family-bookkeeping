import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPasswordByToken } from '../../../services/api'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import AuthLayout from '../../../components/AuthLayout'
import { ForgotIllustration } from '../../../components/AuthLayout/AuthIllustrations'
import { Button } from '../../../components/ui/Button'
import { PasswordField } from '../../../components/ui/PasswordField'
import { getErrorMessage } from '../../../utils/errorMessage'
import {
  validatePasswordAlphaNumeric,
  validatePasswordMatch,
  validatePasswordMinLength,
} from '../../../utils/validation'

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const { run: handleSubmit, isRunning: submitLoading } = useDebouncedAction(async () => {
    const pwdErr =
      validatePasswordMinLength(password, { message: '密码至少6位' }) ||
      validatePasswordAlphaNumeric(password) ||
      validatePasswordMatch(password, confirmPassword, '两次密码不一致')
    if (pwdErr) {
      setMessage(pwdErr)
      setMessageType('error')
      return
    }
    setMessage('')
    try {
      await resetPasswordByToken(token, password)
      setDone(true)
    } catch (err: any) {
      setMessage(getErrorMessage(err, '重置失败，请重试'))
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
          <Button type="button" variant="primary" block size="lg">
            去申请重置
          </Button>
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
          <PasswordField
            id="resetNewPass"
            label="新密码"
            placeholder="至少6位，含字母和数字"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={submitLoading}
          />
          <PasswordField
            id="resetNewPass2"
            label="确认密码"
            placeholder="再次输入"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={submitLoading}
          />
          </div>

          <Button type="submit" variant="primary" block size="lg" disabled={submitLoading}>
            {submitLoading ? '重置中...' : '重置密码'}
          </Button>
        </form>
      ) : (
        <div>
          <div className="success-card">
            <div className="sc-icon">✅</div>
            <h4>密码重置成功</h4>
            <p>请使用新密码登录账户</p>
          </div>
          <Link to="/login">
            <Button type="button" variant="primary" block size="lg" style={{ marginTop: 16 }}>
              返回登录
            </Button>
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
