import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/auth';
import { useBook } from '../../hooks/useBook';
import { BookCreateModal } from '../Books/BookCreateModal';
import { BookInviteModal } from '../Books/BookInviteModal';
import './index.scss';
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { ACTION_LOGOUT } from '../../utils/actionCopy'
import { TITLE_JOIN_BY_INVITE } from '../../utils/sectionCopy'

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, refreshUser } = useAuth();
  const { refetchBooks } = useBook();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleBookReady = async () => {
    // 后端已更新 current_book_id；在进入首页前同步本地资料与账本缓存，
    // 防止首批统计请求仍读取创建前的空账本状态。
    await refreshUser();
    await refetchBooks();
    navigate('/', { replace: true });
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    void handleBookReady();
  };

  const handleJoinSuccess = () => {
    setShowJoinModal(false);
    void handleBookReady();
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
            <span className="onboarding-btn-arrow"><Icon name="chevron-right" size={18} /></span>
          </button>

          <button
            type="button"
            className="onboarding-btn"
            onClick={() => setShowJoinModal(true)}
          >
            <span className="onboarding-btn-icon">✉️</span>
            <div className="onboarding-btn-content">
              <span className="onboarding-btn-title">{TITLE_JOIN_BY_INVITE}</span>
              <span className="onboarding-btn-desc">输入他人分享的邀请码，加入已有账本</span>
            </div>
            <span className="onboarding-btn-arrow"><Icon name="chevron-right" size={18} /></span>
          </button>
        </div>

        <div className="onboarding-footer">
          <Button type="button" variant="ghost" className="onboarding-logout-btn" onClick={handleLogout} icon={
            <Icon name="logout" size={16} />
          }>
            {ACTION_LOGOUT}
          </Button>
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
