import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notify } from '../../../utils/notifications';
import { resetPasswordByCode, sendResetCode } from '../../../services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (!email) {
      notify({ type: 'error', message: '请输入邮箱地址' });
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await sendResetCode(email);
      setMessage('验证码已发送到您的邮箱，请注意查收');
      setStep(2);
      setCountdown(60);
    } catch {
      // 错误已由全局通知处理
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!code) {
      notify({ type: 'error', message: '请输入验证码' });
      setLoading(false);
      return;
    }

    if (!password) {
      notify({ type: 'error', message: '请输入新密码' });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      notify({ type: 'error', message: '两次输入的密码不一致' });
      setLoading(false);
      return;
    }

    try {
      await resetPasswordByCode(email, code, password, confirmPassword);
      setMessage('密码重置成功！即将跳转到登录页面...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch {
      // 错误已由全局通知处理
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {step === 1 ? '忘记密码' : '重置密码'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 1
              ? '输入您的邮箱地址，我们将发送验证码'
              : '输入验证码和新密码完成重置'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); }}>
          <div className="rounded-lg shadow-md">
            <div className="px-4 py-5 bg-white sm:p-6">
              {message && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {message}
                </div>
              )}
              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    邮箱地址
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="请输入邮箱地址"
                    disabled={step === 2 || loading}
                  />
                </div>

                {step === 1 ? (
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={loading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          发送中...
                        </span>
                      ) : (
                        '发送验证码'
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                        验证码
                      </label>
                      <div className="flex gap-3">
                        <input
                          id="code"
                          name="code"
                          type="text"
                          maxLength={6}
                          required
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                          className="mt-1 appearance-none flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="请输入6位验证码"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={handleSendCode}
                          disabled={countdown > 0 || loading}
                          className="mt-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {countdown > 0 ? `${countdown}秒` : '重新发送'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        新密码
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="请输入新密码"
                        disabled={loading}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        密码至少6位，必须包含字母和数字
                      </p>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        确认密码
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="请再次输入密码"
                        disabled={loading}
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            重置中...
                          </span>
                        ) : (
                          '重置密码'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              返回登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
