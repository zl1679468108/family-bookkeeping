import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../utils/auth';
import { useBook } from '../../hooks/useBook';
import './index.scss';

const STORAGE_KEY = 'no_book_waiting_mode';

/**
 * 无账本强制弹窗
 * 用户登录后如果没有任何账本，则弹出此弹窗。
 * 不提供关闭按钮，仅两个操作：
 *   1) 跳转到账本管理页面，自行创建账本
 *   2) 暂时关闭，等别人通过邮箱邀请自己加入账本
 */
export const NoBooksRequiredModal: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { books, loading: booksLoading, hasBooks } = useBook();
  const navigate = useNavigate();
  const location = useLocation();

  const [waitingMode, setWaitingMode] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const AUTH_ROUTES = useMemo(
    () => ['/login', '/register', '/forgot-password'],
    [],
  );

  // 当前若处于账本管理页面，且已选择创建账本，则不强制弹窗（避免打断操作）
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);
  const isBooksPage = location.pathname === '/books';

  const shouldShow = useMemo(() => {
    // 未登录或仍在加载 → 不显示
    if (!user || authLoading) return false;
    // 账本信息仍在加载 → 不显示
    if (booksLoading) return false;
    // 用户已有账本 → 不显示
    if (hasBooks) return false;
    // 在登录注册相关页面 → 不显示
    if (isAuthPage) return false;
    // 用户选择了等待邀请模式 → 当前会话不强制显示
    if (waitingMode) return false;
    return true;
  }, [user, authLoading, booksLoading, hasBooks, isAuthPage, waitingMode]);

  // 当用户获得账本后，清空等待标记
  useEffect(() => {
    if (hasBooks && waitingMode) {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setWaitingMode(false);
    }
  }, [hasBooks, waitingMode]);

  if (!shouldShow) return null;

  const handleCreate = () => {
    navigate('/books');
  };

  const handleWaitInvite = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setWaitingMode(true);
  };

  const handleRefresh = () => {
    // 手动刷新页面以重新拉取账本列表
    window.location.reload();
  };

  return (
    <div className="no-books-overlay" role="dialog" aria-modal="true">
      <div className="no-books-modal">
        <div className="no-books-modal__icon">📖</div>
        <h2 className="no-books-modal__title">欢迎加入「静记」</h2>
        <p className="no-books-modal__desc">
          你目前还没有任何账本。请选择一个操作开始：
        </p>

        <div className="no-books-modal__actions">
          <button
            type="button"
            className="btn btn-primary no-books-modal__btn"
            onClick={handleCreate}
          >
            我自己创建一个账本
          </button>
          <button
            type="button"
            className="btn btn-secondary no-books-modal__btn"
            onClick={handleWaitInvite}
          >
            等别人邀请我加入
          </button>
        </div>

        <p className="no-books-modal__hint">
          {isBooksPage
            ? '提示：在下方点击「+ 新账本」即可创建。'
            : '提示：也可以点击「我自己创建一个账本」跳转到账本管理页面新建。'}
        </p>

        {waitingMode === false && books.length === 0 && (
          <p className="no-books-modal__subhint">
            如果有人已通过邮箱邀请你，邀请成功后可
            <button
              type="button"
              className="no-books-modal__link"
              onClick={handleRefresh}
            >
              刷新页面
            </button>
            查看
          </p>
        )}
      </div>
    </div>
  );
};

export default NoBooksRequiredModal;
