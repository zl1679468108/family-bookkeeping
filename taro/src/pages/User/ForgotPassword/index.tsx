/**
 * ForgotPassword — V3.0 安静密码重置页
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { sendResetCode, resetPasswordByCode } from "../../../services/authApi";
import { ApiError } from "../../../services/api";
import "./index.scss";

type Step = "email" | "code";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendCode = useCallback(async () => {
    if (!email.trim()) {
      setError("请输入邮箱地址");
      return;
    }
    setError("");
    setSending(true);
    try {
      await sendResetCode(email.trim());
      setSuccess("验证码已发送至邮箱");
      setStep("code");
      startCountdown();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "发送失败，请稍后重试");
    } finally {
      setSending(false);
    }
  }, [email]);

  const handleReset = useCallback(async () => {
    if (!code.trim()) {
      setError("请输入验证码");
      return;
    }
    if (!password || password.length < 6) {
      setError("密码至少需要6位");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次密码输入不一致");
      return;
    }
    setError("");
    setResetting(true);
    try {
      await resetPasswordByCode(email.trim(), code.trim(), password);
      setSuccess("密码重置成功");
      setTimeout(() => Taro.navigateBack(), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "重置失败，请稍后重试");
    } finally {
      setResetting(false);
    }
  }, [email, code, password, confirmPassword]);

  return (
    <View className="forgot-password-page min-h-screen bg-white flex flex-col">
      {/* Brand area */}
      <View className="brand-section flex flex-col items-center">
        <View className="app-icon flex items-center justify-center">
          <Text className="app-icon-text">静</Text>
        </View>
        <Text className="app-name text-2xl font-bold mt-3">静记</Text>
        <Text className="app-slogan text-base text-secondary mt-2">
          {step === "email" ? "输入邮箱获取验证码" : "输入验证码设置新密码"}
        </Text>
      </View>

      {/* Form */}
      <View className="forgot-form flex flex-col px-4">
        {step === "email" ? (
          <View className="form-content">
            <View className="form-item">
              <Text className="input-label">邮箱</Text>
              <Input
                className="auth-input"
                value={email}
                onInput={(e) => setEmail(e.detail.value)}
                placeholder="输入注册邮箱"
                placeholderClass="text-hint"
                confirmType="done"
                onConfirm={handleSendCode}
              />
            </View>

            {error ? (
              <Text className="form-error text-sm text-danger">{error}</Text>
            ) : null}

            <View className="forgot-form-submit">
              <View
                className={`forgot-btn ${sending ? "opacity-60" : ""}`}
                onClick={() => !sending && handleSendCode()}
              >
                <Text>{sending ? "发送中..." : "获取验证码"}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="form-content">
            {success ? (
              <Text className="form-success text-sm text-primary text-center">
                {success}
              </Text>
            ) : null}

            <View className="form-item">
              <Text className="input-label">验证码</Text>
              <Input
                className="auth-input"
                value={code}
                onInput={(e) => setCode(e.detail.value)}
                placeholder="输入6位验证码"
                placeholderClass="text-hint"
                maxlength={6}
                type="number"
                focus
              />
            </View>
            <View className="form-item">
              <Text className="input-label">新密码</Text>
              <Input
                className="auth-input"
                value={password}
                onInput={(e) => setPassword(e.detail.value)}
                placeholder="新密码（至少6位）"
                placeholderClass="text-hint"
                password
              />
            </View>
            <View className="form-item">
              <Text className="input-label">确认新密码</Text>
              <Input
                className="auth-input"
                value={confirmPassword}
                onInput={(e) => setConfirmPassword(e.detail.value)}
                placeholder="确认新密码"
                placeholderClass="text-hint"
                password
              />
            </View>

            {error ? (
              <Text className="form-error text-sm text-danger">{error}</Text>
            ) : null}

            <View className="forgot-form-submit">
              <View
                className={`forgot-btn ${resetting ? "opacity-60" : ""}`}
                onClick={() => !resetting && handleReset()}
              >
                <Text>{resetting ? "重置中..." : "重置密码"}</Text>
              </View>
            </View>

            {countdown > 0 ? (
              <Text className="form-link text-secondary text-center">
                {countdown}s 后可重新发送
              </Text>
            ) : (
              <Text
                className="form-link text-primary text-center"
                onClick={handleSendCode}
              >
                重新发送验证码
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
