import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../../utils/auth'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import { notify } from '../../../utils/notifications'
import { notifyInfo } from '../../../utils/notifyError'
import { validatePasswordMatch, validatePasswordMinLength } from '../../../utils/validation'
import AuthLayout from '../../../components/AuthLayout'
import { RegisterIllustration } from '../../../components/AuthLayout/AuthIllustrations'
import { Button } from '../../../components/ui/Button'
import { PasswordField } from '../../../components/ui/PasswordField'
import { FormField } from '../../../components/ui/FormField'

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const { run: handleSubmit, isRunning: loading } = useDebouncedAction(async () => {
    const pwdErr =
      validatePasswordMatch(password, confirmPassword, '两次输入的密码不一致') ||
      validatePasswordMinLength(password, { message: '密码长度至少为6位' })
    if (pwdErr) {
      notifyInfo(pwdErr)
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
        <FormField
          id="regUser"
          label="用户名"
          type="text"
          placeholder="您的昵称"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="name"
        />

        <FormField
          id="regEmail"
          label="邮箱地址"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <div className="form-row">
          <PasswordField
            id="regPass"
            label="密码"
            placeholder="至少6位"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <PasswordField
            id="regPass2"
            label="确认密码"
            placeholder="再次输入"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" variant="primary" block size="lg" disabled={loading}>
          {loading ? '注册中...' : '注 册'}
        </Button>
      </form>

      <div className="form-links" style={{ justifyContent: 'center' }}>
        <Link to="/login">已有账户？立即登录</Link>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
