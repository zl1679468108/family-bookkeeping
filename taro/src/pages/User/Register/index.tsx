/**
 * Register — V3.0 安静注册页
 */
import { useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../services/api";
import "./index.scss";

export default function Register() {
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
      setError("两次密码输入不一致");
      return;
    }
    if (password.length < 6) {
      setError("密码长度至少6位");
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
    <View className="register-page min-h-screen bg-white flex flex-col">
      {/* Brand area */}
      <View className="brand-section flex flex-col items-center">
        <View className="app-icon flex items-center justify-center">
          <Text className="app-icon-text">静</Text>
        </View>
        <Text className="app-name text-2xl font-bold mt-3">静记</Text>
        <Text className="app-slogan text-base text-secondary mt-2">
          开始你的记账之旅
        </Text>
      </View>

      {/* Form */}
      <View className="register-form flex flex-col px-4">
        <View className="form-item">
          <Text className="input-label">用户名</Text>
          <Input
            className="auth-input"
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
            placeholder="输入用户名"
            placeholderClass="text-hint"
            confirmType="next"
          />
        </View>
        <View className="form-item">
          <Text className="input-label">邮箱</Text>
          <Input
            className="auth-input"
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
            placeholder="输入邮箱地址"
            placeholderClass="text-hint"
            confirmType="next"
          />
        </View>
        <View className="form-item">
          <Text className="input-label">密码</Text>
          <Input
            className="auth-input"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
            placeholder="密码（至少6位）"
            placeholderClass="text-hint"
            password
            confirmType="next"
          />
        </View>
        <View className="form-item">
          <Text className="input-label">确认密码</Text>
          <Input
            className="auth-input"
            value={confirmPassword}
            onInput={(e) => setConfirmPassword(e.detail.value)}
            placeholder="再次输入密码"
            placeholderClass="text-hint"
            password
            confirmType="done"
            onConfirm={handleSubmit}
          />
        </View>

        {error ? (
          <Text className="form-error text-sm text-danger">{error}</Text>
        ) : null}

        <View className="register-form-submit">
          <View
            className={`register-btn ${submitting ? "opacity-60" : ""}`}
            onClick={() => !submitting && handleSubmit()}
          >
            <Text>{submitting ? "注册中..." : "注册"}</Text>
          </View>
        </View>

        <View className="form-footer text-center mt-4">
          <Text className="text-secondary text-md">
            已有账号？
            <Text
              className="text-primary font-semibold"
              onClick={() => Taro.redirectTo({ url: "/pages/User/Login/index" })}
            >
              去登录
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
