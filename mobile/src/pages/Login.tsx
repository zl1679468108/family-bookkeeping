/**
 * Login page — mobile-optimized login form.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('请输入邮箱和密码');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : '登录失败，请稍后重试';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center px-6">
      {/* Logo / Brand */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="18" rx="2" />
            <line x1="6" y1="8" x2="10" y2="8" />
            <line x1="6" y1="12" x2="14" y2="12" />
            <line x1="6" y1="16" x2="18" y2="16" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-text">家庭记账</h1>
        <p className="text-sm text-text-secondary mt-1">记录每一笔，管好每一分</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱"
          autoComplete="email"
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码"
          autoComplete="current-password"
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />

        {error && (
          <p className="text-danger text-xs text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm active:bg-primary-light disabled:opacity-60 transition-colors"
        >
          {submitting ? '登录中...' : '登录'}
        </button>
      </form>

      {/* Register link */}
      <p className="text-center mt-6 text-sm text-text-secondary">
        还没有账号？{' '}
        <Link to="/register" className="text-primary font-medium">
          立即注册
        </Link>
      </p>
    </div>
  );
};

export default Login;
