/**
 * Profile — 我的
 * 菜单：切换主题 / 切换账号 / 关于静记 / 注销账号 / 退出登录
 * （个人信息入口 = 顶部 Header 卡片点击）
 */
import { useState, useEffect } from "react";
import { View, Text, Image, Input, Button as WxButton } from "@tarojs/components";
import { Button } from "../../components/ui";
import Taro from "@tarojs/taro";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getCaptcha, deactivateAccount } from "../../services/authApi";
import PageContainer from "../../components/PageContainer";
import Icon from "../../components/Icon";
import { MenuList } from "../../components/ui";
import {
  getSavedAccounts,
  getAccountToken,
  getAccountRefreshToken,
  removeAccount,
  SavedAccount,
} from "../../utils/savedAccounts";
import "./index.scss";

export default function Profile() {
  const { user, signOut, signIn, switchByToken } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [switchModal, setSwitchModal] = useState(false);
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null);
  const [tokenExpiredEmail, setTokenExpiredEmail] = useState<string | null>(null);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaSrc, setCaptchaSrc] = useState("");
  // 注销账号相关
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivateError, setDeactivateError] = useState("");
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const initial = (user?.username || "U").charAt(0).toUpperCase();
  const hasAvatar = user?.avatar_url && user.avatar_url.startsWith('data:') || user?.avatar_url?.startsWith('http');

  const handleLogout = async () => {
    try {
      await signOut();
      Taro.navigateTo({ url: "/pages/User/Login/index" });
    } catch {
      // ignore
    }
  };

  // 注销账号：二次确认 + 密码校验 → 调接口 → 清理本地账号 → 跳登录
  const handleOpenDeactivate = () => {
    setDeactivatePassword("");
    setDeactivateError("");
    setDeactivateModal(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatePassword) {
      setDeactivateError("请输入密码以确认注销");
      return;
    }
    setDeactivateError("");
    setDeactivateLoading(true);
    try {
      await deactivateAccount(deactivatePassword);
      // 清理本地保存的当前账号
      if (user?.email) removeAccount(user.email);
      Taro.showToast({ title: "账号已注销", icon: "success" });
      // 本地清理（不再走 apiLogout，后端 session 已被清）
      try { await signOut(); } catch {}
      setTimeout(() => {
        Taro.reLaunch({ url: "/pages/User/Login/index" });
      }, 800);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setDeactivateError(e?.message || "注销失败，请检查密码后重试");
    } finally {
      setDeactivateLoading(false);
    }
  };

  // 打开切换账号弹窗
  const handleOpenSwitch = () => {
    setAccounts(getSavedAccounts());
    setSwitchModal(true);
    setShowLoginForm(false);
    setLoginEmail("");
    setLoginPassword("");
    setLoginError("");
    setSwitchingEmail(null);
  };

  // 切换到已有账号
  const handleSwitchAccount = async (account: SavedAccount) => {
    if (account.email === user?.email) {
      Taro.showToast({ title: "当前已是该账号", icon: "none" });
      return;
    }
    const token = getAccountToken(account.email);
    const refreshToken = getAccountRefreshToken(account.email);
    if (token) {
      setSwitchingEmail(account.email);
      try {
        await switchByToken(account.email, token, refreshToken ?? undefined);
        Taro.showToast({ title: "账号切换成功", icon: "success" });
        setAccounts(getSavedAccounts());
        setSwitchModal(false);
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg === 'token_invalid') {
          setTokenExpiredEmail(account.email);
          setLoginEmail(account.email);
          setLoginPassword('');
          setShowLoginForm(true);
          setSwitchingEmail(null);
          return;
        }
      }
      setSwitchingEmail(null);
    }
    setTokenExpiredEmail(account.email);
    setShowLoginForm(true);
  };

  const handleRemoveAccount = (email: string) => {
    removeAccount(email);
    setAccounts(getSavedAccounts());
  };

  const refreshCaptcha = async () => {
    try {
      const { captchaId: id, svg } = await getCaptcha();
      setCaptchaId(id);
      const encodedSvg = encodeURIComponent(svg);
      setCaptchaSrc(`data:image/svg+xml,${encodedSvg}`);
      setCaptchaCode("");
    } catch {
      setLoginError("获取验证码失败");
    }
  };

  useEffect(() => {
    if (showLoginForm) refreshCaptcha();
  }, [showLoginForm]);

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("请输入邮箱和密码");
      return;
    }
    if (!captchaCode.trim()) {
      setLoginError("请输入验证码");
      return;
    }
    setLoginError("");
    setLoginLoading(true);
    try {
      await signIn(loginEmail.trim(), loginPassword, captchaId, captchaCode);
      Taro.showToast({ title: "切换成功", icon: "success" });
      setAccounts(getSavedAccounts());
      setSwitchModal(false);
      setShowLoginForm(false);
      setLoginEmail("");
      setLoginPassword("");
      setLoginError("");
      setTokenExpiredEmail(null);
      setCaptchaCode("");
    } catch (err) {
      setLoginError("登录失败，请检查账号密码和验证码");
      refreshCaptcha();
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <PageContainer contentClassName="profile-content">
      {/* ===== 用户 Header ===== */}
      <View
        className="profile-header"
        onClick={() => Taro.navigateTo({ url: "/pages/EditProfile/index" })}
      >
        <View className="profile-header__avatar">
          {hasAvatar ? (
            <Image className="profile-header__avatar-img" src={user!.avatar_url!} mode="aspectFill" />
          ) : (
            <Text className="profile-header__avatar-text">{initial}</Text>
          )}
        </View>
        <View className="profile-header__info">
          <Text className="profile-header__name">{user?.username || "用户"}</Text>
          <Text className="profile-header__email">{user?.email || ""}</Text>
        </View>
        <Text className="profile-header__arrow">›</Text>
      </View>

      {/* ===== 菜单列表（与 PC 端对齐） ===== */}
      <MenuList
        items={[
          {
            label: "切换主题",
            icon: isDark ? "moon" : "sun",
            right: (
              <View className="theme-toggle" onClick={(e) => { e.stopPropagation(); toggleTheme(); }}>
                <Text className={`theme-toggle__label ${isDark ? "theme-toggle__label--dark" : ""}`}>
                  {isDark ? "暗色模式" : "亮色模式"}
                </Text>
                <View className={`theme-toggle__switch ${isDark ? "theme-toggle__switch--on" : ""}`}>
                  <View className="theme-toggle__knob" />
                </View>
              </View>
            ),
            onClick: toggleTheme,
          },
          {
            label: "切换账号",
            icon: "switch-account",
            onClick: handleOpenSwitch,
          },
          {
            label: "关于静记",
            icon: "info",
            onClick: () => Taro.navigateTo({ url: "/pages/About/index" }),
          },
          {
            label: "注销账号",
            icon: "delete-red",
            danger: true,
            onClick: handleOpenDeactivate,
          },
          {
            label: "退出登录",
            icon: "logout",
            danger: true,
            onClick: () => setLogoutConfirm(true),
          },
        ]}
      />

      {/* ===== 联系客服（微信原生 Button openType=contact） ===== */}
      <WxButton
        className="contact-btn"
        openType="contact"
        sessionFrom="profile"
        sendMessageTitle="静记客服"
        sendMessagePath="/pages/Profile/index"
      >
        <View className="contact-btn__inner">
          <View className="contact-btn__icon">
            <Icon name="email" size={48} color="var(--pr)" />
          </View>
          <Text className="contact-btn__label">联系客服</Text>
          <Text className="contact-btn__arrow">›</Text>
        </View>
      </WxButton>

      {/* ===== 退出确认弹窗 ===== */}
      {logoutConfirm && (
        <View className="logout-mask" onClick={() => setLogoutConfirm(false)}>
          <View className="logout-dialog" onClick={(e) => e.stopPropagation()}>
            <Text className="logout-title">确认退出</Text>
            <Text className="logout-desc">确定要退出当前账号吗？</Text>
            <View className="logout-actions">
              <Button variant="ghost" size="md" onClick={() => setLogoutConfirm(false)}>
                取消
              </Button>
              <Button variant="danger" size="md" onClick={handleLogout}>
                退出
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* ===== 注销账号弹窗 ===== */}
      {deactivateModal && (
        <View className="deactivate-mask" onClick={() => !deactivateLoading && setDeactivateModal(false)}>
          <View className="deactivate-dialog" onClick={(e) => e.stopPropagation()}>
            <Text className="deactivate-title">注销账号</Text>
            <Text className="deactivate-warning">
              注销后账号将无法登录，且相关数据将无法恢复。请谨慎操作。
            </Text>
            <View className="deactivate-field">
              <Text className="deactivate-label">请输入密码以确认</Text>
              <Input
                className="deactivate-input"
                value={deactivatePassword}
                onInput={(e) => setDeactivatePassword(e.detail.value)}
                placeholder="输入登录密码"
                placeholderClass="text-hint"
                password
                confirmType="done"
                onConfirm={handleConfirmDeactivate}
              />
            </View>
            {deactivateError ? (
              <Text className="deactivate-error">{deactivateError}</Text>
            ) : null}
            <View className="deactivate-actions">
              <Button
                variant="ghost"
                size="md"
                disabled={deactivateLoading}
                onClick={() => !deactivateLoading && setDeactivateModal(false)}
              >
                取消
              </Button>
              <Button
                variant="danger"
                size="md"
                loading={deactivateLoading}
                onClick={() => !deactivateLoading && handleConfirmDeactivate()}
              >
                {deactivateLoading ? "注销中..." : "确认注销"}
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* ===== 切换账号弹窗 ===== */}
      {switchModal && (
        <View className="switch-mask" onClick={() => setSwitchModal(false)}>
          <View className="switch-dialog" onClick={(e) => e.stopPropagation()}>
            <Text className="switch-title">切换账号</Text>

            {!showLoginForm ? (
              <>
                {accounts.length > 0 && (
                  <View className="switch-account-list">
                    {accounts.map((account) => {
                      const isCurrent = account.email === user?.email;
                      const accInitial = (account.username || account.email).charAt(0).toUpperCase();
                      return (
                        <View
                          key={account.email}
                          className={`switch-account-item${isCurrent ? " current" : ""}${switchingEmail === account.email ? " switching" : ""}`}
                          onClick={() => !isCurrent && !switchingEmail && handleSwitchAccount(account)}
                        >
                          <View className="switch-account-avatar">
                            {account.avatar_url ? (
                              <Image className="switch-account-avatar-img" src={account.avatar_url} mode="aspectFill" />
                            ) : (
                              <Text className="switch-account-avatar-text">{accInitial}</Text>
                            )}
                          </View>
                          <View className="switch-account-info">
                            <Text className="switch-account-name">
                              {account.username || account.email}
                              {isCurrent && <Text className="switch-current-badge">当前</Text>}
                            </Text>
                            <Text className="switch-account-email">{account.email}</Text>
                          </View>
                          {!isCurrent && switchingEmail === account.email && (
                            <View className="switch-account-loading">
                              <Text className="switch-account-loading-text">切换中...</Text>
                            </View>
                          )}
                          {!isCurrent && switchingEmail !== account.email && (
                            <View
                              className="switch-account-remove"
                              onClick={(e) => { e.stopPropagation(); handleRemoveAccount(account.email); }}
                            >
                              <Text className="switch-account-remove-text">✕</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowLoginForm(true); setLoginEmail(""); setLoginPassword(""); setLoginError(""); }}
                >
                  + 添加账号
                </Button>
              </>
            ) : (
              <>
                <View className="switch-login-form">
                  <Text className="switch-login-hint">
                    {tokenExpiredEmail ? "登录已过期，请重新输入密码" : "添加新账号登录"}
                  </Text>
                  <View className="switch-form-group">
                    <Text className="switch-form-label">邮箱地址</Text>
                    <Input
                      className="switch-form-input"
                      value={loginEmail}
                      onInput={(e) => setLoginEmail(e.detail.value)}
                      placeholder="输入邮箱地址"
                    />
                  </View>
                  <View className="switch-form-group">
                    <Text className="switch-form-label">密码</Text>
                    <Input
                      className="switch-form-input"
                      value={loginPassword}
                      onInput={(e) => setLoginPassword(e.detail.value)}
                      placeholder="输入密码"
                      password
                    />
                  </View>
                  <View className="switch-form-group">
                    <Text className="switch-form-label">验证码</Text>
                    <View className="switch-captcha-row">
                      <Input
                        className="switch-form-input switch-captcha-input"
                        value={captchaCode}
                        onInput={(e) => setCaptchaCode(e.detail.value)}
                        placeholder="输入验证码"
                        maxlength={4}
                      />
                      <Image
                        className="switch-captcha-img"
                        src={captchaSrc}
                        mode="widthFix"
                        onClick={refreshCaptcha}
                      />
                    </View>
                  </View>
                  {loginError ? (
                    <Text className="switch-login-error">{loginError}</Text>
                  ) : null}
                  <View className="switch-login-actions">
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => { setShowLoginForm(false); setLoginError(""); setTokenExpiredEmail(null); }}
                    >
                      返回
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      loading={loginLoading}
                      onClick={() => !loginLoading && handleLogin()}
                    >
                      {loginLoading ? "登录中..." : "登录"}
                    </Button>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </PageContainer>
  );
}
