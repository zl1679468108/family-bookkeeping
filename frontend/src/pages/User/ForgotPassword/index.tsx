import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { resetPasswordByCode, sendResetCode } from '../../../services/api'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import AuthLayout from '../../../components/AuthLayout'
import {
  buildStepDotClassName,
  buildStepLineClassName,
  buildAuthMessageClassName,
  isRecoverSecondStepReached,
  recoverFirstStepDotState,
  recoverSecondStepDotState,
} from '../../../utils/authFlow'
import { ForgotIllustration } from '../../../components/AuthLayout/AuthIllustrations'
import { Button } from '../../../components/ui/Button'
import { PasswordField } from '../../../components/ui/PasswordField'
import { FormField } from '../../../components/ui/FormField'
import { validatePasswordMatch, validatePasswordMinLength } from '../../../utils/validation'
import { SUCCESS_CODE_RESENT } from '../../../utils/successCopy'
import { FORM_REGISTERED_EMAIL_PLACEHOLDER, FORM_CAPTCHA_DIGITS_PLACEHOLDER, FORM_PASSWORD_MIN_SHORT, FORM_PASSWORD_CONFIRM_PLACEHOLDER, FORM_EMAIL_VALID_REQUIRED, FORM_CAPTCHA_DIGITS_REQUIRED, MAX_RESET_CODE_LENGTH } from '../../../utils/formCopy'
import { FIELD_EMAIL_ADDRESS, FIELD_CAPTCHA, FIELD_NEW_PASSWORD, FIELD_CONFIRM_PASSWORD } from '../../../utils/fieldCopy'
import { AUTH_TITLE_FORGOT, AUTH_TITLE_RESET, AUTH_TITLE_RESET_SUCCESS, AUTH_TITLE_RECOVER, AUTH_DESC_CODE_SENT, ACTION_SEND_CODE, ACTION_SENDING, ACTION_RESEND_CODE, ACTION_RESET_PASSWORD, ACTION_RESETTING, AUTH_SUB_FORGOT_EMAIL, AUTH_SUB_PASSWORD_UPDATED, AUTH_SUB_RECOVER_LINE1, AUTH_SUB_RECOVER_LINE2, AUTH_TITLE_PASSWORD_RESET_SUCCESS, AUTH_CODE_SENT_TO_PREFIX, AUTH_SEND_FAILED_CHECK_EMAIL } from '../../../utils/authCopy'

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
      setMessage(FORM_EMAIL_VALID_REQUIRED)
      setMessageType('error')
      return
    }
    setMessage('')
    try {
      await sendResetCode(email)
      setMessage(AUTH_CODE_SENT_TO_PREFIX + email)
      setMessageType('success')
      setStep(2)
      setCountdown(60)
    } catch {
      setMessage(AUTH_SEND_FAILED_CHECK_EMAIL)
      setMessageType('error')
    }
  })

  const { run: handleSubmit, isRunning: submitLoading } = useDebouncedAction(async () => {
    if (!code || code.length !== 6) {
      setMessage(FORM_CAPTCHA_DIGITS_REQUIRED)
      setMessageType('error')
      return
    }
    const pwdErr =
      validatePasswordMinLength(password) ||
      validatePasswordMatch(password, confirmPassword)
    if (pwdErr) {
      setMessage(pwdErr)
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
      setMessage(SUCCESS_CODE_RESENT)
      setMessageType('success')
    } catch {
      // 忽略
    }
  })

  const title = step === 1 ? AUTH_TITLE_FORGOT : step === 3 ? AUTH_TITLE_RESET_SUCCESS : AUTH_TITLE_RESET
  const subtitle = step === 1
    ? AUTH_SUB_FORGOT_EMAIL
    : step === 3
      ? AUTH_SUB_PASSWORD_UPDATED
      : AUTH_DESC_CODE_SENT

  return (
    <AuthLayout
      illustration={<ForgotIllustration />}
      title={AUTH_TITLE_RECOVER}
      subtitle={
        <>
          <p>{AUTH_SUB_RECOVER_LINE1}</p>
          <p>{AUTH_SUB_RECOVER_LINE2}</p>
        </>
      }
    >
      <h3>{title}</h3>
      <p className="form-desc">{subtitle}</p>

      {step !== 3 && (
        <div className="step-indicator">
          <div className={buildStepDotClassName({ state: recoverFirstStepDotState(step) })} />
          <div className={buildStepLineClassName({ done: isRecoverSecondStepReached(step) })} />
          <div className={buildStepDotClassName({ state: recoverSecondStepDotState(step) })} />
        </div>
      )}

      {message && (
        <div className={buildAuthMessageClassName({ type: messageType })}>{message}</div>
      )}

      {step === 1 && (
        <div>
          <FormField
            id="forgotEmail"
            label={FIELD_EMAIL_ADDRESS}
            type="email"
            placeholder={FORM_REGISTERED_EMAIL_PLACEHOLDER}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Button
            type="button"
            variant="primary"
            block
            size="lg"
           
            onClick={handleSendCode}
            disabled={sendLoading}
          >
            {sendLoading ? ACTION_SENDING : ACTION_SEND_CODE}
          </Button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
          <FormField
            id="forgotEmailDisplay"
            label={FIELD_EMAIL_ADDRESS}
            type="email"
            value={email}
            disabled
          />

          <FormField id="forgotCode" label={FIELD_CAPTCHA}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="forgotCode"
                type="text"
                placeholder={FORM_CAPTCHA_DIGITS_PLACEHOLDER}
                maxLength={MAX_RESET_CODE_LENGTH}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                style={{ flex: 1 }}
                disabled={submitLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                className="btn-code"
                onClick={handleResend}
                disabled={countdown > 0 || resendLoading}
              >
                {countdown > 0 ? `${countdown}s` : (resendLoading ? ACTION_SENDING : ACTION_RESEND_CODE)}
              </Button>
            </div>
          </FormField>

          <div className="form-row">
          <PasswordField
            id="forgotNewPass"
            label={FIELD_NEW_PASSWORD}
            placeholder={FORM_PASSWORD_MIN_SHORT}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={submitLoading}
          />
          <PasswordField
            id="forgotNewPass2"
            label={FIELD_CONFIRM_PASSWORD}
            placeholder={FORM_PASSWORD_CONFIRM_PLACEHOLDER}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={submitLoading}
          />
          </div>

          <Button type="submit" variant="primary" block size="lg" disabled={submitLoading}>
            {submitLoading ? ACTION_RESETTING : ACTION_RESET_PASSWORD}
          </Button>
        </form>
      )}

      {step === 3 && (
        <div>
          <div className="success-card">
            <div className="sc-icon">✅</div>
            <h4>{AUTH_TITLE_PASSWORD_RESET_SUCCESS}</h4>
            <p>请使用新密码登录账户</p>
          </div>
          <Link to="/login">
            <Button type="button" variant="primary" block size="lg" style={{ marginTop: 16 }}>
              返回登录
            </Button>
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
