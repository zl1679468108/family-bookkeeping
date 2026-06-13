/**
 * Login — V3.0 安静登录页
 */
import { useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../services/api";
import "./index.scss";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("请输入邮箱和密码");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      Taro.reLaunch({ url: "/pages/Home/index" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "登录失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="login-page min-h-screen bg-white flex flex-col">
      {/* Brand area */}
      <View className="brand-section flex flex-col items-center">
        <View className="app-icon flex items-center justify-center">
          <Text className="app-icon-text">静</Text>
        </View>
        <Text className="app-name text-2xl font-bold mt-3">静记</Text>
        <Text className="app-slogan text-base text-secondary mt-2">
          记录每一笔，管好每一分
        </Text>
      </View>

      {/* Form */}
      <View className="login-form flex flex-col px-4">
        <View className="mb-3">
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
        <View>
          <Text className="input-label">密码</Text>
          <Input
            className="auth-input"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
            placeholder="输入密码"
            placeholderClass="text-hint"
            password
            confirmType="done"
            onConfirm={handleSubmit}
          />
        </View>

        {error ? (
          <Text className="login-error text-sm text-danger mt-2">{error}</Text>
        ) : null}

        <View className="mt-4">
          <View
            className={`btn-primary ${submitting ? "opacity-60" : ""}`}
            onClick={() => !submitting && handleSubmit()}
          >
            <Text>{submitting ? "登录中..." : "登录"}</Text>
          </View>
        </View>

        <View className="login-links flex justify-between mt-3">
          <Text
            className="text-primary text-md font-semibold"
            onClick={() =>
              Taro.navigateTo({ url: "/pages/User/Register/index" })
            }
          >
            注册账号
          </Text>
          <Text
            className="text-hint text-md"
            onClick={() =>
              Taro.navigateTo({ url: "/pages/User/ForgotPassword/index" })
            }
          >
            忘记密码？
          </Text>
        </View>
      </View>
    </View>
  );
}
