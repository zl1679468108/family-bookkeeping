import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../utils/auth'
import { getProfile, updateProfile, changePassword } from '../../../services/api'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import { notify } from '../../../utils/notifications'
import './index.scss'

const compressImage = (file: File, maxSize = 128): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > height) {
          height = (height / width) * maxSize
          width = maxSize
        } else {
          width = (width / height) * maxSize
          height = maxSize
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        // 白色背景（避免 PNG 透明变黑色）
        ctx!.fillStyle = '#ffffff'
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
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  const { run: handleSubmit, isRunning: loading } = useDebouncedAction(async () => {
    setError('')

    if (newPassword.length < 6) {
      setError('新密码长度至少为 6 位')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError('新密码必须同时包含大小写字母和数字')
      return
    }

    try {
      await changePassword({ oldPassword, newPassword, confirmPassword })
      notify({ type: 'success', message: '密码修改成功' })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '修改密码失败'
      setError(message)
    }
  })

  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">修改密码</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="modal-form">
          <div className="form-group">
            <label className="form-label">当前密码</label>
            <div className="password-wrapper">
              <input
                type={showOld ? 'text' : 'password'}
                className="form-input"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="请输入当前密码"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowOld(v => !v)}
                tabIndex={-1}
              >
                {showOld ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">新密码</label>
            <div className="password-wrapper">
              <input
                type={showNew ? 'text' : 'password'}
                className="form-input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="至少 6 位，含大小写+数字"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNew(v => !v)}
                tabIndex={-1}
              >
                {showNew ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">确认新密码</label>
            <div className="password-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                className="form-input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirm(v => !v)}
                tabIndex={-1}
              >
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div className="form-error">{error}</div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '提交中...' : '确认'}
            </button>
          </div>
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

  // 加载个人信息
  useEffect(() => {
    getProfile()
      .then(data => {
        setUsername(data.username || '')
        setEmail(data.email || '')
        setAvatarUrl(data.avatar_url || '')
        setAvatarPreview(data.avatar_url || '')
      })
      .catch(() => {
        notify({ type: 'error', message: '获取个人信息失败' })
      })
  }, [])

  // 头像上传
  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      notify({ type: 'error', message: '请选择图片文件' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      notify({ type: 'error', message: '图片大小不能超过 5MB' })
      return
    }

    try {
      const base64 = await compressImage(file)
      setAvatarPreview(base64)
      setAvatarUrl(base64)
      notify({ type: 'success', message: '头像已选择，点击保存生效' })
    } catch {
      notify({ type: 'error', message: '图片处理失败' })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [])

  const { run: handleSubmit, isRunning: loading } = useDebouncedAction(async () => {
    setError('')

    if (!username.trim()) {
      setError('用户名不能为空')
      return
    }
    if (!email.trim()) {
      setError('邮箱不能为空')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('邮箱格式不正确')
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
      notify({ type: 'success', message: '保存成功' })
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2a5 5 0 00-5 5 5 5 0 005 5c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                    <path d="M20 21a8 8 0 00-16 0" />
                  </svg>
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
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <p className="avatar-hint">点击上传头像，建议使用正方形图片</p>
          </div>

          {/* 右侧信息 */}
          <div className="profile-info">
            <form className="profile-form" onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
              <div className="form-group">
                <label className="form-label">用户名</label>
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label className="form-label">邮箱</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                />
              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="profile-actions">
                {/* 修改密码按钮 */}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(true)}
                >
                  修改密码
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? '更新中...' : '更新信息'}
                </button>
              </div>
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
