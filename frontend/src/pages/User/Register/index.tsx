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
            <input
              id="regPass"
              type="password"
              placeholder="至少6位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="regPass2">确认密码</label>
            <input
              id="regPass2"
              type="password"
              placeholder="再次输入"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
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
