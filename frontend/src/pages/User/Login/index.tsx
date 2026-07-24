import React, { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../utils/auth'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import { useOnceEffect } from '../../../hooks/useOnceEffect'
import AuthLayout from '../../../components/AuthLayout'
import { LoginIllustration } from '../../../components/AuthLayout/AuthIllustrations'
import { notifyError } from '../../../utils/notifyError'
import { getCaptcha } from '../../../services/api'
import { Button } from '../../../components/ui/Button'
import { PasswordField } from '../../../components/ui/PasswordField'
import { FormField } from '../../../components/ui/FormField'
import { FORM_CAPTCHA_PLACEHOLDER, FORM_EMAIL_EXAMPLE, FORM_PASSWORD_PLACEHOLDER } from '../../../utils/formCopy'
import { AUTH_TITLE_WELCOME_BACK, AUTH_CAPTCHA_ALT, AUTH_CAPTCHA_REFRESH_TITLE, AUTH_FORGOT_LINK, ACTION_LOGGING_IN, ACTION_LOGIN_SPACED, AUTH_REGISTER_LINK, AUTH_LOGIN_FAILED } from '../../../utils/authCopy'
import { FIELD_EMAIL_ADDRESS, FIELD_PASSWORD, FIELD_CAPTCHA } from '../../../utils/fieldCopy'
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      const message = error instanceof Error ? error.message : AUTH_LOGIN_FAILED
      notifyError(message)
      refreshCaptcha()
    }
  })

  return (
    <AuthLayout
      illustration={<LoginIllustration />}
      title={AUTH_TITLE_WELCOME_BACK}
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
        <FormField
          id="loginEmail"
          label={FIELD_EMAIL_ADDRESS}
          type="email"
          placeholder={FORM_EMAIL_EXAMPLE}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <PasswordField
          id="loginPass"
          label={FIELD_PASSWORD}
          placeholder={FORM_PASSWORD_PLACEHOLDER}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <FormField id="captchaCode" label={FIELD_CAPTCHA}>
          <div className="captcha-row">
            <input
              id="captchaCode"
              type="text"
              placeholder={FORM_CAPTCHA_PLACEHOLDER}
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
                alt={AUTH_CAPTCHA_ALT}
                onClick={refreshCaptcha}
                title={AUTH_CAPTCHA_REFRESH_TITLE}
              />
            )}
          </div>
        </FormField>

        <Button type="submit" variant="primary" block size="lg" disabled={loading}>
          {loading ? ACTION_LOGGING_IN : ACTION_LOGIN_SPACED}
        </Button>
      </form>

      <div className="form-links">
        <Link to="/forgot-password">{AUTH_FORGOT_LINK}</Link>
        <Link to="/register">{AUTH_REGISTER_LINK}</Link>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
