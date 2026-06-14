import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCreateModal } from '../Books/BookCreateModal';
import { BookInviteModal } from '../Books/BookInviteModal';
import './index.scss';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

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
