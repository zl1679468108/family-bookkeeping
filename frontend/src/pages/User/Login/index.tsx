import React, { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../utils/auth'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import AuthLayout from '../../../components/AuthLayout'
import { LoginIllustration } from '../../../components/AuthLayout/AuthIllustrations'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { run: handleSubmit, isRunning: loading } = useDebouncedAction(async () => {
    if (!email || !password) return
    try {
      await signIn(email, password)
      const redirect = searchParams.get('redirect') || '/'
      navigate(redirect)
    } catch {
      // 错误已由全局通知处理
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
