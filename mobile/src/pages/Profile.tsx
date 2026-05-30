/**
 * Profile / "My" page — User info, menu list, logout.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TabBar from '../components/TabBar';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const menuItems: MenuItem[] = [
    {
      label: '账本切换',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      ),
      onClick: () => navigate('/books'),
    },
    {
      label: '预算管理',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
      onClick: () => navigate('/budgets'),
    },
    {
      label: '分类管理',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      onClick: () => navigate('/categories'),
    },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* User info — gradient header */}
      <div className="bg-gradient-to-b from-primary to-primary-light px-5 pt-8 pb-10 rounded-b-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{user?.username?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{user?.username || '用户'}</p>
            <p className="text-sm text-white/70">{user?.email || ''}</p>
          </div>
        </div>
      </div>

      {/* Menu list */}
      <div className="-mt-4 mx-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        {menuItems.map((item, idx) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm active:bg-gray-50 transition-colors ${
              idx < menuItems.length - 1 ? 'border-b border-gray-50' : ''
            } ${item.danger ? 'text-danger' : 'text-text'}`}
          >
            <span className="text-text-secondary">{item.icon}</span>
            {item.label}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-auto text-text-secondary"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="mt-8 mx-4">
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-xl bg-white border border-gray-100 text-text-secondary text-sm font-medium active:bg-gray-50 transition-colors"
        >
          退出登录
        </button>
      </div>

      {/* Version info */}
      <p className="text-center mt-6 text-xs text-text-secondary">
        家庭记账 v1.0.0
      </p>

      <TabBar />
    </div>
  );
};

export default Profile;
