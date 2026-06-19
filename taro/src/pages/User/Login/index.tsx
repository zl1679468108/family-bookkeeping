/**
 * Login — V3.0 安静登录页
 */
import { useState, useEffect, useRef } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useAuth } from "../../../context/AuthContext";
import { getCaptcha } from "../../../services/authApi";
import { ApiError } from "../../../services/api";
import "./index.scss";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [captchaSrc, setCaptchaSrc] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const captchaLoaded = useRef(false);

  const refreshCaptcha = async () => {
    try {
      const { captchaId: id, svg } = await getCaptcha();
      setCaptchaId(id);
      // 小程序Image组件支持data URL，将SVG编码为URL-safe格式
      const encodedSvg = encodeURIComponent(svg);
      setCaptchaSrc(`data:image/svg+xml,${encodedSvg}`);
      setCaptchaCode("");
    } catch {
      setError("获取验证码失败");
    }
  };

  useEffect(() => {
    // 防止 React 18 严格模式或多次渲染时重复请求
    if (captchaLoaded.current) return;
    captchaLoaded.current = true;
    refreshCaptcha();
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("请输入邮箱和密码");
      return;
    }
    if (!captchaCode.trim()) {
      setError("请输入验证码");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await signIn(email.trim(), password, captchaId, captchaCode);
    } catch (err) {
      // 仅 API 层错误才显示登录失败提示
      console.error("[Login] signIn failed:", err);
      setError(err instanceof ApiError ? err.message : "登录失败，请稍后重试");
      refreshCaptcha();
      setSubmitting(false);
      return;
    }
    // 登录成功，执行导航（独立于登录 try-catch，避免导航异常被误判为登录失败）
    setSubmitting(false);
    try {
      const pages = Taro.getCurrentPages();
      if (pages.length > 1) {
        Taro.navigateBack();
      } else {
        Taro.reLaunch({ url: "/pages/Home/index" });
      }
    } catch (navErr) {
      console.warn("[Login] navigation failed, retrying reLaunch:", navErr);
      Taro.reLaunch({ url: "/pages/Home/index" });
    }
  };

  return (
    <View className="login-page min-h-screen bg-white flex flex-col">
      {/* Brand area */}
      <View className="brand-section flex flex-col items-center">
        <View className="app-icon flex items-center justify-center">
          <Text className="app-icon-text">静</Text>
        </View>
        <Text className="app-name text-2xl font-bold">静记</Text>
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
            confirmType="next"
          />
        </View>

        <View className="mb-3">
          <Text className="input-label">验证码</Text>
          <View className="captcha-row">
            <Input
              className="auth-input captcha-input"
              value={captchaCode}
              onInput={(e) => setCaptchaCode(e.detail.value)}
              placeholder="请输入验证码"
              placeholderClass="text-hint"
              confirmType="done"
              maxlength={4}
              onConfirm={handleSubmit}
            />
            <Image
              className="captcha-img"
              src={captchaSrc}
              mode="widthFix"
              onClick={refreshCaptcha}
            />
          </View>
        </View>

        {error ? (
          <Text className="login-error text-sm text-danger mt-2">{error}</Text>
        ) : null}

        <View className="login-form-submit">
          <View
            className={`login-btn ${submitting ? "opacity-60" : ""}`}
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