/**
 * ForgotPassword — 极简密码重置页
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { sendResetCode, resetPasswordByCode } from "../../../services/authApi";
import { useTheme } from "../../../context/ThemeContext";
import { useNavBarTheme } from "../../../hooks/useNavBarTheme";
import { useSubmit } from "../../../hooks/useSubmit";
import { ApiError } from "../../../services/api";
import "./index.scss";

type Step = "email" | "code" | "success";

export default function ForgotPassword() {
  const { isDark } = useTheme();
  useNavBarTheme();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { run } = useSubmit();
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

  const handleSendCode = useCallback(() => {
    if (!email.trim()) {
      setError("请输入有效的邮箱地址");
      return;
    }
    setError("");
    run(async () => {
      await sendResetCode(email.trim());
      setSuccess(`验证码已发送至 ${email.trim()}`);
      setStep("code");
      startCountdown();
    }, "发送中…").catch((err: any) => {
      Taro.showToast({ title: err?.message || "发送失败", icon: "none" });
    });
  }, [email]);

  const handleReset = useCallback(() => {
    if (!code.trim()) {
      setError("请输入6位验证码");
      return;
    }
    if (!password || password.length < 6) {
      setError("密码至少6位");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次密码不一致");
      return;
    }
    setError("");
    run(async () => {
      await resetPasswordByCode(email.trim(), code.trim(), password, confirmPassword);
      setStep("success");
    }, "重置中…").catch((err: any) => {
      Taro.showToast({ title: err?.message || "重置失败", icon: "none" });
    });
  }, [email, code, password, confirmPassword]);

  const handleResendCode = useCallback(async () => {
    if (!email.trim()) {
      setError("请输入有效的邮箱地址");
      return;
    }
    setError("");
    try {
      await sendResetCode(email.trim());
      setSuccess("验证码已重新发送");
      startCountdown();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "发送失败，请检查邮箱地址");
    }
  }, [email]);

  const handleGoBack = () => {
    if (step === "email") {
      Taro.navigateBack();
    } else {
      setStep("email");
      setCode("");
      setPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess("");
    }
  };

  return (
    <View className={`forgot-page min-h-screen bg-bg flex flex-col ${isDark ? "theme-dark" : ""}`}>
      {/* 品牌区 */}
      <View className="forgot-hero">
        <View className="forgot-brand-mark">
          <Text className="forgot-brand-text">静</Text>
        </View>
        <Text className="forgot-brand-name">静记</Text>
      </View>

      {/* 步骤指示器 */}
      <View className="forgot-steps">
        <View className={`fstep-dot ${step === "email" ? "active" : "done"}`} />
        <View className={`fstep-line ${step >= "code" ? "done" : ""}`} />
        <View className={`fstep-dot ${step >= "code" ? (step === "success" ? "done" : "active") : ""}`} />
        <View className={`fstep-line ${step === "success" ? "done" : ""}`} />
        <View className={`fstep-dot ${step === "success" ? "active" : ""}`} />
      </View>

      {/* 表单 */}
      <View className="forgot-form">
        {step === "email" && (
          <View className="forgot-content">
            <View className="forgot-field">
              <Text className="forgot-field-label">邮箱</Text>
              <Input
                className="forgot-input"
                value={email}
                onInput={(e) => setEmail(e.detail.value)}
                placeholder="注册时使用的邮箱"
                placeholderClass="text-hint"
                confirmType="done"
                onConfirm={handleSendCode}
              />
            </View>

            {error ? <Text className="forgot-error">{error}</Text> : null}

            <View className="forgot-submit" onClick={handleSendCode}>
              <Text>发送验证码</Text>
            </View>

            <View className="forgot-back" onClick={handleGoBack}>
              <Text className="link-muted">← 返回登录</Text>
            </View>
          </View>
        )}

        {step === "code" && (
          <View className="forgot-content">
            {success ? <Text className="forgot-success">{success}</Text> : null}

            <View className="forgot-field">
              <Text className="forgot-field-label">邮箱</Text>
              <Input className="forgot-input" value={email} disabled placeholderClass="text-hint" />
            </View>

            <View className="forgot-field">
              <Text className="forgot-field-label">验证码</Text>
              <View className="forgot-captcha-row">
                <Input
                  className="forgot-input forgot-captcha-input"
                  value={code}
                  onInput={(e) => setCode(e.detail.value)}
                  placeholder="6位数字"
                  placeholderClass="text-hint"
                  maxlength={6}
                  type="number"
                />
                <View
                  className={`forgot-code-btn ${countdown > 0 ? "disabled" : ""}`}
                  onClick={() => countdown === 0 && handleResendCode()}
                >
                  <Text>{countdown > 0 ? `${countdown}s` : "重新发送"}</Text>
                </View>
              </View>
            </View>

            <View className="forgot-field">
              <Text className="forgot-field-label">新密码</Text>
              <Input
                className="forgot-input"
                value={password}
                onInput={(e) => setPassword(e.detail.value)}
                placeholder="至少6位"
                placeholderClass="text-hint"
                password
              />
            </View>

            <View className="forgot-field">
              <Text className="forgot-field-label">确认密码</Text>
              <Input
                className="forgot-input"
                value={confirmPassword}
                onInput={(e) => setConfirmPassword(e.detail.value)}
                placeholder="再次输入"
                placeholderClass="text-hint"
                password
                onConfirm={handleReset}
              />
            </View>

            {error ? <Text className="forgot-error">{error}</Text> : null}

            <View
              className="forgot-submit"
              onClick={handleReset}
            >
              <Text>重置密码</Text>
            </View>

            <View className="forgot-back" onClick={handleGoBack}>
              <Text className="link-muted">← 返回</Text>
            </View>
          </View>
        )}

        {step === "success" && (
          <View className="forgot-content forgot-success-content">
            <View className="forgot-success-card">
              <View className="forgot-success-icon">✓</View>
              <Text className="forgot-success-title">密码已重置</Text>
              <Text className="forgot-success-desc">请用新密码登录账户</Text>
            </View>
            <View
              className="forgot-submit"
              onClick={() => Taro.navigateTo({ url: "/pages/User/Login/index" })}
            >
              <Text>返回登录</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
