import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/auth';
import { BookCreateModal } from '../Books/BookCreateModal';
import { BookInviteModal } from '../Books/BookInviteModal';
import './index.scss';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    navigate('/', { replace: true });
  };

  const handleJoinSuccess = () => {
    setShowJoinModal(false);
    navigate('/', { replace: true });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="onboarding-wrap">
      <div className="onboarding-card">
        <div className="onboarding-hero">
          <div className="onboarding-logo">📒</div>
          <h1>欢迎来到静记</h1>
          <p>创建属于你自己的账本，或通过邀请码加入他人的账本</p>
        </div>

        <div className="onboarding-actions">
          <button
            type="button"
            className="onboarding-btn onboarding-btn--primary"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="onboarding-btn-icon">📖</span>
            <div className="onboarding-btn-content">
              <span className="onboarding-btn-title">我自己创建账本</span>
              <span className="onboarding-btn-desc">新建一个空账本，开始记录收支</span>
            </div>
            <span className="onboarding-btn-arrow">→</span>
          </button>

          <button
            type="button"
            className="onboarding-btn"
            onClick={() => setShowJoinModal(true)}
          >
            <span className="onboarding-btn-icon">✉️</span>
            <div className="onboarding-btn-content">
              <span className="onboarding-btn-title">使用邀请码加入</span>
              <span className="onboarding-btn-desc">输入他人分享的邀请码，加入已有账本</span>
            </div>
            <span className="onboarding-btn-arrow">→</span>
          </button>
        </div>

        <div className="onboarding-footer">
          <button
            type="button"
            className="onboarding-logout-btn"
            onClick={handleLogout}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            退出登录
          </button>
        </div>
      </div>

      {/* 复用 BookCreateModal 组件创建账本 */}
      <BookCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* 邀请码弹窗 —— 使用抽离后的 BookInviteModal */}
      <BookInviteModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
};

export default OnboardingPage;
