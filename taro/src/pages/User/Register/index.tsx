/**
 * Register — 极简注册页
 */
import { useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import { Button } from "../../../components/ui";
import Taro from "@tarojs/taro";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { useNavBarTheme } from "../../../hooks/useNavBarTheme";
import { useSubmit, toastError } from "../../../hooks/useSubmit";
import "./index.scss";
import { toastSuccess } from "../../../utils/toast";
import { validatePasswordMatch, validatePasswordMinLength } from "../../../utils/validation";
import { SUCCESS_REGISTER } from "../../../utils/successCopy";
import { ERROR_REGISTER_FAILED } from "../../../utils/errorCopy";
import { FORM_NICKNAME_PLACEHOLDER, FORM_EMAIL_EXAMPLE, FORM_PASSWORD_MIN_SHORT, FORM_PASSWORD_CONFIRM_PLACEHOLDER, FORM_ALL_REQUIRED, FORM_AGREE_TERMS_PRIVACY } from "../../../utils/formCopy"
import { FIELD_USERNAME, FIELD_EMAIL, FIELD_PASSWORD, FIELD_CONFIRM_PASSWORD } from "../../../utils/fieldCopy";
import { ACTION_REGISTERING_ELLIPSIS } from "../../../utils/authCopy";

export default function Register() {
  const { isDark } = useTheme();
  useNavBarTheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const { signUp } = useAuth();
  const { run } = useSubmit();

  const handleSubmit = () => {
    if (!username.trim() || !email.trim() || !password) {
      setError(FORM_ALL_REQUIRED);
      return;
    }
    const pwdErr =
      validatePasswordMatch(password, confirmPassword) ||
      validatePasswordMinLength(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    if (!agreed) {
      setError(FORM_AGREE_TERMS_PRIVACY);
      return;
    }
    setError("");
    run(async () => {
      await signUp(email.trim(), password, username.trim());
      toastSuccess(SUCCESS_REGISTER);
      setTimeout(() => Taro.reLaunch({ url: "/pages/Home/index" }), 600);
    }, ACTION_REGISTERING_ELLIPSIS).catch((err: any) => {
      toastError(err, ERROR_REGISTER_FAILED);
    });
  };

  return (
    <View className={`register-page min-h-screen bg-bg flex flex-col ${isDark ? "theme-dark" : ""}`}>
      {/* 品牌区 */}
      <View className="register-hero">
        <View className="register-brand-mark">
          <Text className="register-brand-text">静</Text>
        </View>
        <Text className="register-brand-name">静记</Text>
      </View>

      {/* 表单 */}
      <View className="register-form">
        <View className="register-field">
          <Text className="register-field-label">{FIELD_USERNAME}</Text>
          <Input
            className="register-input"
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
            placeholder={FORM_NICKNAME_PLACEHOLDER}
            placeholderClass="text-hint"
            confirmType="next"
          />
        </View>

        <View className="register-field">
          <Text className="register-field-label">{FIELD_EMAIL}</Text>
          <Input
            className="register-input"
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
            placeholder={FORM_EMAIL_EXAMPLE}
            placeholderClass="text-hint"
            confirmType="next"
          />
        </View>

        <View className="register-field">
          <Text className="register-field-label">{FIELD_PASSWORD}</Text>
          <Input
            className="register-input"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
            placeholder={FORM_PASSWORD_MIN_SHORT}
            placeholderClass="text-hint"
            password
            confirmType="next"
          />
        </View>

        <View className="register-field">
          <Text className="register-field-label">{FIELD_CONFIRM_PASSWORD}</Text>
          <Input
            className="register-input"
            value={confirmPassword}
            onInput={(e) => setConfirmPassword(e.detail.value)}
            placeholder={FORM_PASSWORD_CONFIRM_PLACEHOLDER}
            placeholderClass="text-hint"
            password
            confirmType="done"
            onConfirm={handleSubmit}
          />
        </View>

        {error ? <Text className="register-error">{error}</Text> : null}

        <View className="register-agreement">
          <View
            className={`register-checkbox ${agreed ? "checked" : ""}`}
            onClick={() => setAgreed((v) => !v)}
          >
            <Text className="register-checkbox-mark">{agreed ? "✓" : ""}</Text>
          </View>
          <Text className="register-agreement-text">
            我已阅读并同意
            <Text
              className="register-agreement-link"
              onClick={(e) => {
                e.stopPropagation();
                Taro.navigateTo({ url: "/pages/Terms/index" });
              }}
            >
              《用户协议》
            </Text>
            和
            <Text
              className="register-agreement-link"
              onClick={(e) => {
                e.stopPropagation();
                Taro.navigateTo({ url: "/pages/Privacy/index" });
              }}
            >
              《隐私政策》
            </Text>
          </Text>
        </View>

        <Button variant="primary" block size="lg" className="register-submit" onClick={handleSubmit}>
          注册
        </Button>

        <View className="register-footer">
          <Text
            className="link-muted"
            onClick={() => Taro.redirectTo({ url: "/pages/User/Login/index" })}
          >
            已有账户？
            <Text className="link-primary">立即登录</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
