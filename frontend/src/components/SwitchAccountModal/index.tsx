/**
 * 切换账号弹窗 — 显示已保存账号列表，支持一键切换
 * token 失效时弹出过期提示，引导用户跳转登录页
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../utils/auth'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'

import {
  getSavedAccounts,
  removeAccount,
  SavedAccount,
} from '../../utils/savedAccounts'
import './index.scss'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { FooterActions } from '../ui/FooterActions'
import { notifySuccess, notifyInfo } from '../../utils/notifyError'

interface SwitchAccountModalProps {
  visible: boolean
  onClose: () => void
}

const SwitchAccountModal: React.FC<SwitchAccountModalProps> = ({ visible, onClose }) => {
  const navigate = useNavigate()
  const { user, switchByToken } = useAuth()
  const [accounts, setAccounts] = useState<SavedAccount[]>(() => getSavedAccounts())
  const [expiredEmail, setExpiredEmail] = useState<string | null>(null)
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null)

  // 切换到已有账号：用已保存的 token 切换，token 失效则弹出过期提示
  const { run: handleSwitch, isRunning: switchLoading } = useDebouncedAction(
    async (account: SavedAccount) => {
      if (account.email === accounts.find(a => a.email === user?.email)?.email) {
        notifyInfo('当前已是该账号')
        return
      }
      setSwitchingEmail(account.email)
      try {
        const accessToken = account.accessToken ?? account.token
        if (accessToken) {
          await switchByToken(account.email, accessToken, account.refreshToken)
          notifySuccess('账号切换成功')
          setAccounts(getSavedAccounts())
          onClose()
          navigate('/')
          return
        }
        // 无 token，弹出过期提示
        setExpiredEmail(account.email)
      } catch {
        // token 失效，弹出过期提示
        setExpiredEmail(account.email)
      } finally {
        setSwitchingEmail(null)
      }
    }
  )

  const handleRemove = (email: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeAccount(email)
    setAccounts(getSavedAccounts())
  }

  // 跳转登录页
  const goLogin = () => {
    setExpiredEmail(null)
    onClose()
    navigate('/login')
  }

  if (!visible) return null

  const currentEmail = accounts.find(a => a.email === user?.email)?.email

  return (
    <div className="switch-account-overlay" onClick={onClose}>
      <div className="switch-account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="switch-account-header">
          <h3>切换账号</h3>
          <button type="button" className="switch-account-close" onClick={onClose} aria-label="关闭">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="switch-account-body">
          {accounts.length > 0 && (
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

          {accounts.length === 0 && (
            <div className="account-empty-hint">暂无已保存的账号</div>
          )}
        </div>
      </div>

      {/* 登录过期提示弹窗 */}
      {expiredEmail && (
        <div className="expired-modal-overlay" onClick={() => setExpiredEmail(null)}>
          <div className="expired-modal" onClick={(e) => e.stopPropagation()}>
            <div className="expired-modal-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="expired-modal-title">登录已过期</div>
            <div className="expired-modal-desc">
              {expiredEmail} 的登录状态已失效，请重新登录
            </div>
            <FooterActions align="stretch" className="expired-modal-actions">
              <Button
                type="button"
                variant="secondary"
                className="expired-modal-btn expired-modal-btn-cancel"
                onClick={() => setExpiredEmail(null)}
              >
                取消
              </Button>
              <Button
                type="button"
                variant="primary"
                className="expired-modal-btn expired-modal-btn-login"
                onClick={goLogin}
              >
                去登录
              </Button>
            </FooterActions>
          </div>
        </div>
      )}
    </div>
  )
}

export default SwitchAccountModal
