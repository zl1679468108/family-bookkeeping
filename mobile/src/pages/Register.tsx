/**
 * Register page — mobile-optimized registration form.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setError('请填写所有必填项');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await signUp(email.trim(), password, username.trim());
      navigate('/', { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : '注册失败，请稍后重试';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center px-6">
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold text-text">创建账号</h1>
        <p className="text-sm text-text-secondary mt-1">开始你的记账之旅</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="用户名"
          autoComplete="username"
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
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
          placeholder="密码（至少6位）"
          autoComplete="new-password"
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="确认密码"
          autoComplete="new-password"
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
          {submitting ? '注册中...' : '注册'}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-text-secondary">
        已有账号？{' '}
        <Link to="/login" className="text-primary font-medium">
          返回登录
        </Link>
      </p>
    </div>
  );
};

export default Register;
