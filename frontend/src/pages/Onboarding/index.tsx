import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BookCreateModal } from '../../components/BookCreateModal';
import { joinByInvitation } from '../../services/booksApi';
import { notify } from '../../utils/notifications';
import './index.scss';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const joinMutation = useMutation({
    mutationFn: () => joinByInvitation(inviteCode.trim().toUpperCase()),
    onSuccess: () => {
      notify({ type: 'success', message: '加入成功' });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setShowJoinModal(false);
      setInviteCode('');
      navigate('/', { replace: true });
    },
  });

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['books'] });
    setShowCreateModal(false);
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

      {/* 优化后的邀请码弹窗 */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div
            className="invite-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="invite-modal-header">
              <h3>使用邀请码加入</h3>
              <button
                className="invite-modal-close"
                onClick={() => setShowJoinModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="invite-modal-body">
              <div className="invite-modal-icon">
                <span>🔗</span>
              </div>
              <div className="invite-form-group">
                <label>邀请码</label>
                <div className="invite-input-wrapper">
                  <input
                    type="text"
                    className="invite-input"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="例如 A3F8K2"
                    maxLength={32}
                    autoFocus
                  />
                </div>
              </div>
              <p className="invite-form-tip">
                <strong>邀请码获取方式：</strong>由账主在「账本详情 → 生成邀请码」中生成，有效期为 7 天。
              </p>
            </div>
            <div className="invite-modal-footer">
              <button
                type="button"
                className="invite-btn invite-btn--secondary"
                onClick={() => setShowJoinModal(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="invite-btn invite-btn--primary"
                disabled={joinMutation.isPending || inviteCode.trim().length < 4}
                onClick={() => joinMutation.mutate()}
              >
                {joinMutation.isPending ? '加入中...' : '加入账本'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;
