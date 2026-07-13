/**
 * Register — 极简注册页
 */
import { useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { useNavBarTheme } from "../../../hooks/useNavBarTheme";
import { ApiError } from "../../../services/api";
import "./index.scss";

export default function Register() {
  const { isDark } = useTheme();
  useNavBarTheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async () => {
    if (!username.trim() || !email.trim() || !password) {
      setError("请填写所有必填项");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    if (password.length < 6) {
      setError("密码长度至少为6位");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await signUp(email.trim(), password, username.trim());
      Taro.reLaunch({ url: "/pages/Home/index" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "注册失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
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
          <Text className="register-field-label">用户名</Text>
          <Input
            className="register-input"
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
            placeholder="您的昵称"
            placeholderClass="text-hint"
            confirmType="next"
          />
        </View>

        <View className="register-field">
          <Text className="register-field-label">邮箱</Text>
          <Input
            className="register-input"
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
            placeholder="your@email.com"
            placeholderClass="text-hint"
            confirmType="next"
          />
        </View>

        <View className="register-field">
          <Text className="register-field-label">密码</Text>
          <Input
            className="register-input"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
            placeholder="至少6位"
            placeholderClass="text-hint"
            password
            confirmType="next"
          />
        </View>

        <View className="register-field">
          <Text className="register-field-label">确认密码</Text>
          <Input
            className="register-input"
            value={confirmPassword}
            onInput={(e) => setConfirmPassword(e.detail.value)}
            placeholder="再次输入"
            placeholderClass="text-hint"
            password
            confirmType="done"
            onConfirm={handleSubmit}
          />
        </View>

        {error ? <Text className="register-error">{error}</Text> : null}

        <View
          className={`register-submit ${submitting ? "opacity-60" : ""}`}
          onClick={() => !submitting && handleSubmit()}
        >
          <Text>{submitting ? "注册中..." : "注册"}</Text>
        </View>

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
