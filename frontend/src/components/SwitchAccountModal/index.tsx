/**
 * 切换账号弹窗 — 显示已保存账号列表，支持一键切换和添加新账号
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../utils/auth'
import { getCaptcha, switchAccount, login, storeToken } from '../../services/api'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import { notify } from '../../utils/notifications'
import {
  getSavedAccounts,
  removeAccount,
  decodePassword,
  updateAccountInfo,
  SavedAccount,
} from '../../utils/savedAccounts'
import './index.scss'

interface SwitchAccountModalProps {
  visible: boolean
  onClose: () => void
}

const SwitchAccountModal: React.FC<SwitchAccountModalProps> = ({ visible, onClose }) => {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [accounts, setAccounts] = useState<SavedAccount[]>(() => getSavedAccounts())
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [captchaCode, setCaptchaCode] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const [captchaSvg, setCaptchaSvg] = useState('')
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null)
  const [switchFailed, setSwitchFailed] = useState(false) // 切换失败，显示验证码登录

  // 刷新验证码
  const refreshCaptcha = async () => {
    try {
      const { captchaId: id, svg } = await getCaptcha()
      setCaptchaId(id)
      setCaptchaSvg(svg)
      setCaptchaCode('')
    } catch {
      // 错误已由全局通知处理
    }
  }

  // 切换到已有账号：先用已保存的账号密码+token免验证码切换，失败则跳转到登录页
  const { run: handleSwitch, isRunning: switchLoading } = useDebouncedAction(
    async (account: SavedAccount) => {
      if (account.email === accounts.find(a => a.email === user?.email)?.email) {
        notify({ type: 'info', message: '当前已是该账号' })
        return
      }
      setSwitchingEmail(account.email)
      setSwitchFailed(false)
      try {
        const password = decodePassword(account.password)
        const { token } = await switchAccount(account.email, password, account.token)
        // 切换成功：先存储新 token，再刷新用户信息
        storeToken(token)
        updateAccountInfo(account.email, { token })
        await refreshUser()
        notify({ type: 'success', message: '账号切换成功' })
        setAccounts(getSavedAccounts())
        onClose()
        navigate('/')
        return
      } catch (err: unknown) {
        // 检查是否是登录过期错误
        const errorMessage = err instanceof Error ? err.message : ''
        if (errorMessage.includes('登录状态已过期')) {
          // 登录已过期：关闭弹窗，直接跳转到登录页（不带重定向参数）
          onClose()
          navigate('/login', { replace: true })
          return
        }
        // 其他错误，显示验证码登录表单
        setSwitchFailed(true)
        setLoginEmail(account.email)
        setLoginPassword(decodePassword(account.password))
        setShowLoginForm(true)
        refreshCaptcha()
      } finally {
        setSwitchingEmail(null)
      }
    }
  )

  // 使用邮箱密码+验证码登录（切换失败后的回退流程）
  const { run: handleLogin, isRunning: loginLoading } = useDebouncedAction(async () => {
    if (!loginEmail || !loginPassword || !captchaCode) return
    try {
      await login(loginEmail, loginPassword, captchaId, captchaCode)
      await refreshUser()
      notify({ type: 'success', message: '账号切换成功' })
      setAccounts(getSavedAccounts())
      setShowLoginForm(false)
      setLoginEmail('')
      setLoginPassword('')
      setCaptchaCode('')
      onClose()
      navigate('/')
    } catch {
      refreshCaptcha()
    }
  })

  // 删除已保存账号
  const handleRemove = (email: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeAccount(email)
    setAccounts(getSavedAccounts())
  }

  if (!visible) return null

  const currentEmail = accounts.find(a => a.email === user?.email)?.email

  return (
    <div className="switch-account-overlay" onClick={onClose}>
      <div className="switch-account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="switch-account-header">
          <h3>切换账号</h3>
          <button className="switch-account-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="switch-account-body">
          {/* 已保存账号列表 */}
          {accounts.length > 0 && !showLoginForm && (
            <div className="account-list">
              {accounts.map((account) => {
                const isCurrent = account.email === currentEmail
                const initial = (account.username || account.email).charAt(0).toUpperCase()
                return (
                  <div
                    key={account.email}
                    className={`account-item${isCurrent ? ' current' : ''}`}
                    onClick={() => !isCurrent && !switchLoading && handleSwitch(account)}
                  >
                    <div className="account-item-avatar">
                      {account.avatar_url ? (
                        <img src={account.avatar_url} alt="" />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <div className="account-item-info">
                      <div className="account-item-name">
                        {account.username || account.email}
                        {isCurrent && <span className="current-badge">当前</span>}
                      </div>
                      <div className="account-item-email">{account.email}</div>
                    </div>
                    {!isCurrent && (
                      <button
                        className="account-item-remove"
                        onClick={(e) => handleRemove(account.email, e)}
                        title="移除账号"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                    {!isCurrent && switchingEmail === account.email && (
                      <div className="account-item-loading">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="spinning">
                          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* 切换失败后的验证码登录表单 */}
          {showLoginForm && (
            <div className="account-add-form">
              <div className="account-form-hint">
                {switchFailed ? '请重新验证身份' : '添加新账号登录'}
              </div>
              <div className="form-group">
                <label>邮箱地址</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label>密码</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="form-group">
                <label>验证码</label>
                <div className="captcha-row">
                  <input
                    type="text"
                    placeholder="请输入验证码"
                    value={captchaCode}
                    onChange={(e) => setCaptchaCode(e.target.value)}
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
              <div className="account-add-actions">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowLoginForm(false)
                    setLoginEmail('')
                    setLoginPassword('')
                    setCaptchaCode('')
                    setSwitchFailed(false)
                  }}
                >
                  返回
                </button>
                <button
                  className="btn-login"
                  onClick={() => handleLogin()}
                  disabled={loginLoading || !loginEmail || !loginPassword || !captchaCode}
                >
                  {loginLoading ? '登录中...' : '登录'}
                </button>
              </div>
            </div>
          )}

          {/* 添加账号按钮 */}
          {!showLoginForm && (
            <button
              className="account-add-btn"
              onClick={() => {
                setShowLoginForm(true)
                setLoginEmail('')
                setLoginPassword('')
                setSwitchFailed(false)
                refreshCaptcha()
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加账号
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SwitchAccountModal
