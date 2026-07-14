/**
 * Login — 极简登录页
 */
import { useState, useEffect, useRef } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { useNavBarTheme } from "../../../hooks/useNavBarTheme";
import { useSubmit } from "../../../hooks/useSubmit";
import { getCaptcha } from "../../../services/authApi";
import "./index.scss";

export default function Login() {
  const { isDark } = useTheme();
  useNavBarTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [captchaSrc, setCaptchaSrc] = useState("");
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const { run } = useSubmit();
  const captchaLoaded = useRef(false);

  const refreshCaptcha = async () => {
    try {
      const { captchaId: id, svg } = await getCaptcha();
      setCaptchaId(id);
      const encodedSvg = encodeURIComponent(svg);
      setCaptchaSrc(`data:image/svg+xml,${encodedSvg}`);
      setCaptchaCode("");
    } catch {
      setError("获取验证码失败");
    }
  };

  useEffect(() => {
    if (captchaLoaded.current) return;
    captchaLoaded.current = true;
    refreshCaptcha();
  }, []);

  const handleSubmit = () => {
    if (!email.trim() || !password.trim()) {
      setError("请输入邮箱和密码");
      return;
    }
    if (!captchaCode.trim()) {
      setError("请输入验证码");
      return;
    }
    setError("");
    run(async () => {
      await signIn(email.trim(), password, captchaId, captchaCode);
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
    }, "登录中…").catch((err: any) => {
      console.error("[Login] signIn failed:", err);
      Taro.showToast({ title: err?.message || "登录失败", icon: "none" });
      refreshCaptcha();
    });
  };

  return (
    <View className={`login-page min-h-screen bg-bg flex flex-col ${isDark ? "theme-dark" : ""}`}>
      {/* 品牌区 */}
      <View className="login-hero">
        <View className="login-brand-mark">
          <Text className="login-brand-text">静</Text>
        </View>
        <Text className="login-brand-name">静记</Text>
      </View>

      {/* 表单 */}
      <View className="login-form">
        <View className="login-field">
          <Text className="login-field-label">邮箱</Text>
          <Input
            className="login-input"
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
            placeholder="your@email.com"
            placeholderClass="text-hint"
            confirmType="next"
          />
        </View>

        <View className="login-field">
          <Text className="login-field-label">密码</Text>
          <Input
            className="login-input"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
            placeholder="输入密码"
            placeholderClass="text-hint"
            password
            confirmType="next"
          />
        </View>

        <View className="login-field">
          <Text className="login-field-label">验证码</Text>
          <View className="login-captcha-row">
            <Input
              className="login-input login-captcha-input"
              value={captchaCode}
              onInput={(e) => setCaptchaCode(e.detail.value)}
              placeholder="请输入验证码"
              placeholderClass="text-hint"
              confirmType="done"
              maxlength={4}
              onConfirm={handleSubmit}
            />
            <Image
              className="login-captcha-img"
              src={captchaSrc}
              mode="aspectFit"
              onClick={refreshCaptcha}
            />
          </View>
        </View>

        {error ? <Text className="login-error">{error}</Text> : null}

        <View className="login-submit" onClick={handleSubmit}>
          <Text>登录</Text>
        </View>

        <View className="login-links">
          <Text
            className="link-primary"
            onClick={() => Taro.navigateTo({ url: "/pages/User/Register/index" })}
          >
            注册新账户
          </Text>
          <Text
            className="link-muted"
            onClick={() => Taro.navigateTo({ url: "/pages/User/ForgotPassword/index" })}
          >
            忘记密码？
          </Text>
        </View>
      </View>
    </View>
  );
}
