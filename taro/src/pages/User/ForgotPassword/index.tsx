/**
 * ForgotPassword — 极简密码重置页
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Input } from "@tarojs/components";
import { Button } from "../../../components/ui";
import Taro from "@tarojs/taro";
import { sendResetCode, resetPasswordByCode } from "../../../services/authApi";
import { useTheme } from "../../../context/ThemeContext";
import { useNavBarTheme } from "../../../hooks/useNavBarTheme";
import { useSubmit, toastError } from "../../../hooks/useSubmit";
import { ApiError } from "../../../services/api";
import "./index.scss";
import { toastSuccess, toastInfo } from "../../../utils/toast";
import { validatePasswordMatch, validatePasswordMinLength } from "../../../utils/validation";
import { ERROR_SEND_FAILED, ERROR_RESET_FAILED } from "../../../utils/errorCopy";
import { SUCCESS_CODE_SENT, SUCCESS_PASSWORD_RESET, SUCCESS_CODE_RESENT } from "../../../utils/successCopy";
import { FORM_BACK, FORM_BACK_LOGIN, FORM_REGISTERED_EMAIL_PLACEHOLDER, FORM_CAPTCHA_DIGITS_PLACEHOLDER, FORM_PASSWORD_MIN_SHORT, FORM_PASSWORD_CONFIRM_PLACEHOLDER, FORM_EMAIL_VALID_REQUIRED, FORM_CAPTCHA_DIGITS_REQUIRED } from "../../../utils/formCopy"
import { FIELD_EMAIL, FIELD_CAPTCHA, FIELD_NEW_PASSWORD, FIELD_CONFIRM_PASSWORD } from "../../../utils/fieldCopy";
import { ACTION_SEND_CODE, ACTION_RESEND_CODE, ACTION_RESET_PASSWORD, AUTH_TITLE_PASSWORD_RESET_DONE, AUTH_DESC_PASSWORD_RESET_DONE } from "../../../utils/authCopy";

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
      setError(FORM_EMAIL_VALID_REQUIRED);
      return;
    }
    setError("");
    run(async () => {
      await sendResetCode(email.trim());
      toastSuccess(SUCCESS_CODE_SENT);
      setSuccess(`验证码已发送至 ${email.trim()}`);
      setStep("code");
      startCountdown();
    }, "发送中…").catch((err: any) => {
      toastError(err, ERROR_SEND_FAILED);
    });
  }, [email]);

  const handleReset = useCallback(() => {
    if (!code.trim()) {
      setError(FORM_CAPTCHA_DIGITS_REQUIRED);
      return;
    }
    const pwdErr =
      validatePasswordMinLength(password) ||
      validatePasswordMatch(password, confirmPassword);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    setError("");
    run(async () => {
      await resetPasswordByCode(email.trim(), code.trim(), password, confirmPassword);
      toastSuccess(SUCCESS_PASSWORD_RESET);
      setStep("success");
    }, "重置中…").catch((err: any) => {
      toastError(err, ERROR_RESET_FAILED);
    });
  }, [email, code, password, confirmPassword]);

  const handleResendCode = useCallback(async () => {
    if (!email.trim()) {
      setError(FORM_EMAIL_VALID_REQUIRED);
      return;
    }
    setError("");
    try {
      await sendResetCode(email.trim());
      setSuccess(SUCCESS_CODE_RESENT);
      toastSuccess(SUCCESS_CODE_RESENT);
      startCountdown();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "发送失败，请检查邮箱地址";
      setError(msg);
      toastInfo(msg);
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
              <Text className="forgot-field-label">{FIELD_EMAIL}</Text>
              <Input
                className="forgot-input"
                value={email}
                onInput={(e) => setEmail(e.detail.value)}
                placeholder={FORM_REGISTERED_EMAIL_PLACEHOLDER}
                placeholderClass="text-hint"
                confirmType="done"
                onConfirm={handleSendCode}
              />
            </View>

            {error ? <Text className="forgot-error">{error}</Text> : null}

            <Button variant="primary" block size="lg" className="forgot-submit" onClick={handleSendCode}>
              {ACTION_SEND_CODE}
            </Button>

            <View className="forgot-back" onClick={handleGoBack}>
              <Text className="link-muted">{FORM_BACK_LOGIN}</Text>
            </View>
          </View>
        )}

        {step === "code" && (
          <View className="forgot-content">
            {success ? <Text className="forgot-success">{success}</Text> : null}

            <View className="forgot-field">
              <Text className="forgot-field-label">{FIELD_EMAIL}</Text>
              <Input className="forgot-input" value={email} disabled placeholderClass="text-hint" />
            </View>

            <View className="forgot-field">
              <Text className="forgot-field-label">{FIELD_CAPTCHA}</Text>
              <View className="forgot-captcha-row">
                <Input
                  className="forgot-input forgot-captcha-input"
                  value={code}
                  onInput={(e) => setCode(e.detail.value)}
                  placeholder={FORM_CAPTCHA_DIGITS_PLACEHOLDER}
                  placeholderClass="text-hint"
                  maxlength={6}
                  type="number"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={countdown > 0}
                  onClick={() => countdown === 0 && handleResendCode()}
                >
                  {countdown > 0 ? `${countdown}s` : ACTION_RESEND_CODE}
                </Button>
              </View>
            </View>

            <View className="forgot-field">
              <Text className="forgot-field-label">{FIELD_NEW_PASSWORD}</Text>
              <Input
                className="forgot-input"
                value={password}
                onInput={(e) => setPassword(e.detail.value)}
                placeholder={FORM_PASSWORD_MIN_SHORT}
                placeholderClass="text-hint"
                password
              />
            </View>

            <View className="forgot-field">
              <Text className="forgot-field-label">{FIELD_CONFIRM_PASSWORD}</Text>
              <Input
                className="forgot-input"
                value={confirmPassword}
                onInput={(e) => setConfirmPassword(e.detail.value)}
                placeholder={FORM_PASSWORD_CONFIRM_PLACEHOLDER}
                placeholderClass="text-hint"
                password
                onConfirm={handleReset}
              />
            </View>

            {error ? <Text className="forgot-error">{error}</Text> : null}

            <Button variant="primary" block size="lg" className="forgot-submit" onClick={handleReset}>
              {ACTION_RESET_PASSWORD}
            </Button>

            <View className="forgot-back" onClick={handleGoBack}>
              <Text className="link-muted">{FORM_BACK}</Text>
            </View>
          </View>
        )}

        {step === "success" && (
          <View className="forgot-content forgot-success-content">
            <View className="forgot-success-card">
              <View className="forgot-success-icon">✓</View>
              <Text className="forgot-success-title">{AUTH_TITLE_PASSWORD_RESET_DONE}</Text>
              <Text className="forgot-success-desc">{AUTH_DESC_PASSWORD_RESET_DONE}</Text>
            </View>
            <Button
              variant="primary"
              block
              size="lg"
              className="forgot-submit"
              onClick={() => Taro.navigateTo({ url: "/pages/User/Login/index" })}
            >{FORM_BACK_LOGIN}</Button>
          </View>
        )}
      </View>
    </View>
  );
}
