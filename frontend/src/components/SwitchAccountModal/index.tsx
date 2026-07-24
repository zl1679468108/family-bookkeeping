/**
 * 切换账号弹窗 — 显示已保存账号列表，支持一键切换
 * token 失效时弹出过期提示，引导用户跳转登录页
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../utils/auth'
import { BADGE_CURRENT } from '../../utils/fieldCopy'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'

import {
  getSavedAccounts,
  removeAccount,
  SavedAccount,
} from '../../utils/savedAccounts'
import './index.scss'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Spinner } from '../ui/Spinner'
import { FooterActions } from '../ui/FooterActions'
import { notifySuccess, notifyInfo } from '../../utils/notifyError'
import { userDisplayName, userInitial } from '../../utils/userDisplay'
import { SUCCESS_ACCOUNT_SWITCHED } from '../../utils/successCopy'
import { FORM_ALREADY_CURRENT_ACCOUNT } from '../../utils/formCopy'
import { ACTION_CLOSE, ACTION_SWITCH_ACCOUNT,
  ACTION_REMOVE_ACCOUNT,
} from '../../utils/actionCopy'
import { EMPTY_NO_SAVED_ACCOUNTS } from '../../utils/emptyCopy'
import { AUTH_LOGIN_EXPIRED, authLoginExpiredRelogin } from '../../utils/authCopy'
import {
  buildAccountItemClassName,
  buildSwitchAccountOverlayClassName,
  buildSwitchAccountModalClassName,
} from '../../utils/switchAccount'

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
        notifyInfo(FORM_ALREADY_CURRENT_ACCOUNT)
        return
      }
      setSwitchingEmail(account.email)
      try {
        const accessToken = account.accessToken ?? account.token
        if (accessToken) {
          await switchByToken(account.email, accessToken, account.refreshToken)
          notifySuccess(SUCCESS_ACCOUNT_SWITCHED)
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
    <div className={buildSwitchAccountOverlayClassName()} onClick={onClose}>
      <div className={buildSwitchAccountModalClassName()} onClick={(e) => e.stopPropagation()}>
        <div className="switch-account-header">
          <h3>{ACTION_SWITCH_ACCOUNT}</h3>
          <button type="button" className="switch-account-close" onClick={onClose} aria-label={ACTION_CLOSE}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="switch-account-body">
          {accounts.length > 0 && (
            <div className="account-list">
              {accounts.map((account) => {
                const isCurrent = account.email === currentEmail
                const initial = userInitial(account)
                return (
                  <div
                    key={account.email}
                    className={buildAccountItemClassName({ current: isCurrent })}
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
                        {userDisplayName(account)}
                        {isCurrent && <span className="current-badge">{BADGE_CURRENT}</span>}
                      </div>
                      <div className="account-item-email">{account.email}</div>
                    </div>
                    {!isCurrent && (
                      <button
                        className="account-item-remove"
                        onClick={(e) => handleRemove(account.email, e)}
                        title={ACTION_REMOVE_ACCOUNT}
                      >
                        <Icon name="close" size={14} />
                      </button>
                    )}
                    {!isCurrent && switchingEmail === account.email && (
                      <div className="account-item-loading">
                        <Spinner size={16} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {accounts.length === 0 && (
            <div className="account-empty-hint">{EMPTY_NO_SAVED_ACCOUNTS}</div>
          )}
        </div>
      </div>

      {/* 登录过期提示弹窗 */}
      {expiredEmail && (
        <div className="expired-modal-overlay" onClick={() => setExpiredEmail(null)}>
          <div className="expired-modal" onClick={(e) => e.stopPropagation()}>
            <div className="expired-modal-icon">
              <Icon name="info" size={32} />
            </div>
            <div className="expired-modal-title">{AUTH_LOGIN_EXPIRED}</div>
            <div className="expired-modal-desc">
              {authLoginExpiredRelogin(expiredEmail)}
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
