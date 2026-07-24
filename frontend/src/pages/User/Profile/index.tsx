import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../utils/auth'
import { updateProfile, changePassword } from '../../../services/api'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'

import { Button } from '../../../components/ui/Button'
import { PasswordField } from '../../../components/ui/PasswordField'
import { FormField } from '../../../components/ui/FormField'
import { FooterActions } from '../../../components/ui/FooterActions'
import './index.scss'
import { notifySuccess, notifyError } from '../../../utils/notifyError'
import { Icon } from '../../../components/ui/Icon'
import { submittingLabel } from '../../../utils/actionCopy'
import {
  validateEmail,
  validatePasswordMatch,
  validatePasswordMinLength,
  validatePasswordStrength,
} from '../../../utils/validation'
import { SUCCESS_AVATAR_SELECTED_HINT, SUCCESS_PASSWORD_CHANGED, SUCCESS_SAVED } from '../../../utils/successCopy'
import { FORM_PASSWORD_MIN_NEW, FORM_PASSWORD_MISMATCH_NEW, FORM_PASSWORD_CURRENT, FORM_PASSWORD_CONFIRM_NEW_PLACEHOLDER, FORM_USERNAME_PLACEHOLDER, FORM_EMAIL_PLACEHOLDER, FORM_PASSWORD_STRENGTH_HINT, FORM_USERNAME_REQUIRED, MAX_USERNAME_LENGTH } from '../../../utils/formCopy'
import { fitWithinMaxSide } from '../../../utils/imageSize'
import {
  isWithinUploadSize,
  UPLOAD_IMAGE_SIZE_LIMIT,
  IMAGE_PROCESS_FAILED,
  IMAGE_FILE_REQUIRED,
  IMAGE_ACCEPT_WILDCARD,
} from '../../../utils/uploadCopy'
import { FIELD_CURRENT_PASSWORD, FIELD_NEW_PASSWORD, FIELD_CONFIRM_NEW_PASSWORD, FIELD_USERNAME, FIELD_EMAIL, FIELD_AVATAR_ALT } from '../../../utils/fieldCopy'
import { ACTION_UPDATING, ACTION_UPDATE_INFO, AUTH_CHANGE_PASSWORD_FAILED, AUTH_SAVE_PROFILE_FAILED,
  ACTION_CHANGE_PASSWORD,
} from '../../../utils/authCopy'

/** 头像 JPEG 压缩画布底色：有意固定白底，避免透明 PNG 转 JPEG 发黑（与主题无关） */
const AVATAR_JPEG_BG = '#ffffff'

const compressImage = (file: File, maxSize = 128): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = fitWithinMaxSide(img.width, img.height, maxSize)
        let { width, height } = size
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        // 白色背景（避免 PNG 透明变黑色）
        ctx!.fillStyle = AVATAR_JPEG_BG
        ctx!.fillRect(0, 0, width, height)
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

interface PasswordModalProps {
  visible: boolean
  onClose: () => void
}

const PasswordModal: React.FC<PasswordModalProps> = ({ visible, onClose }) => {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const { run: handleSubmit, isRunning: loading } = useDebouncedAction(async () => {
    setError('')

    const pwdErr =
      validatePasswordMinLength(newPassword, { message: FORM_PASSWORD_MIN_NEW }) ||
      validatePasswordMatch(newPassword, confirmPassword, FORM_PASSWORD_MISMATCH_NEW) ||
      validatePasswordStrength(newPassword)
    if (pwdErr) {
      setError(pwdErr)
      return
    }

    try {
      await changePassword({ oldPassword, newPassword, confirmPassword })
      notifySuccess(SUCCESS_PASSWORD_CHANGED)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : AUTH_CHANGE_PASSWORD_FAILED
      setError(message)
    }
  })

  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{ACTION_CHANGE_PASSWORD}</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="modal-form">
          <PasswordField
            label={FIELD_CURRENT_PASSWORD}
            labelClassName="form-label field-required"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            placeholder={FORM_PASSWORD_CURRENT}
            autoComplete="current-password"
          />
          <PasswordField
            label={FIELD_NEW_PASSWORD}
            labelClassName="form-label field-required"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder={FORM_PASSWORD_STRENGTH_HINT}
            autoComplete="new-password"
          />
          <PasswordField
            label={FIELD_CONFIRM_NEW_PASSWORD}
            labelClassName="form-label field-required"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder={FORM_PASSWORD_CONFIRM_NEW_PLACEHOLDER}
            autoComplete="new-password"
          />

          {error && (
            <div className="form-error">{error}</div>
          )}

          <FooterActions align="end" className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {submittingLabel(loading)}
            </Button>
          </FooterActions>
        </form>
      </div>
    </div>
  )
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '')
  const [error, setError] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // user 来自 AuthProvider（已在初始化时拉过一次 /auth/profile），这里直接复用，避免重复请求
  useEffect(() => {
    if (user) {
      setUsername(user.username || '')
      setEmail(user.email || '')
      setAvatarUrl(user.avatar_url || '')
      setAvatarPreview(user.avatar_url || '')
    }
  }, [user])

  // 头像上传
  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      notifyError(IMAGE_FILE_REQUIRED)
      return
    }
    if (!isWithinUploadSize(file.size)) {
      notifyError(UPLOAD_IMAGE_SIZE_LIMIT)
      return
    }

    try {
      const base64 = await compressImage(file)
      setAvatarPreview(base64)
      setAvatarUrl(base64)
      notifySuccess(SUCCESS_AVATAR_SELECTED_HINT)
    } catch {
      notifyError(IMAGE_PROCESS_FAILED)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [])

  const { run: handleSubmit, isRunning: loading } = useDebouncedAction(async () => {
    setError('')

    if (!username.trim()) {
      setError(FORM_USERNAME_REQUIRED)
      return
    }
    const emailErr = validateEmail(email)
    if (emailErr) {
      setError(emailErr)
      return
    }

    try {
      const payload: { username: string; email: string; avatar_url?: string } = {
        username: username.trim(),
        email: email.trim(),
      }
      if (avatarUrl && avatarUrl.startsWith('data:')) {
        payload.avatar_url = avatarUrl
      }
      await updateProfile(payload)
      await refreshUser()
      notifySuccess(SUCCESS_SAVED)
      navigate(-1)
    } catch (err: unknown) {
      console.error('更新个人信息失败:', err)
      const message = err instanceof Error ? err.message : '保存失败，请检查网络或稍后重试'
      setError(message)
    }
  })

  return (
    <div className="page-container profile-page">
      <div className="profile-card">
        {/* 头部区域：左边头像，右边信息 */}
        <div className="profile-header">
          {/* 头像 */}
          <div className="profile-avatar-wrapper">
            <div
              className="avatar-uploader"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="头像" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  <Icon name="user" size={32} strokeWidth={1.5} />
                  <span>上传头像</span>
                </div>
              )}
              <div className="avatar-overlay">
                <span>更换</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT_WILDCARD}
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <p className="avatar-hint">点击上传头像，建议使用正方形图片</p>
          </div>

          {/* 右侧信息 */}
          <div className="profile-info">
            <form className="profile-form" onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
              <FormField
                label={FIELD_USERNAME}
                labelClassName="form-label field-required"
                type="text"
                className="form-input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={FORM_USERNAME_PLACEHOLDER}
                maxLength={MAX_USERNAME_LENGTH}
              />

              <FormField
                label={FIELD_EMAIL}
                labelClassName="form-label field-required"
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={FORM_EMAIL_PLACEHOLDER}
              />

              {error && <div className="form-error">{error}</div>}

              <FooterActions align="end" className="profile-actions">
                {/* 修改密码按钮 */}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPasswordModal(true)}
                >
                  {ACTION_CHANGE_PASSWORD}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? ACTION_UPDATING : ACTION_UPDATE_INFO}
                </Button>
              </FooterActions>
            </form>
          </div>
        </div>
      </div>

      {/* 修改密码弹窗 */}
      <PasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  )
}

export default ProfilePage
