/**
 * Profile — 我的
 * 菜单顺序：年报 / 日历 / 地图 / 账本 / 分类 / 模版 / 预算 / 切换账号 / 退出登录
 */
import { useState } from "react";
import { View, Text, Image, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useAuth } from "../../context/AuthContext";
import PageLayout from "../../components/PageLayout";
import Icon from "../../components/Icon";
import {
  getSavedAccounts,
  removeAccount,
  decodePassword,
  SavedAccount,
} from "../../utils/savedAccounts";
import "./index.scss";

export default function Profile() {
  const { user, signOut, signIn, switchByToken } = useAuth();
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

  const initial = (user?.username || "U").charAt(0).toUpperCase();
  const hasAvatar = user?.avatar_url && user.avatar_url.startsWith('data:') || user?.avatar_url?.startsWith('http');

  const menuSection1 = [
    { icon: "annual" as const, label: "年报", url: "/pages/AnnualReport/index" },
    { icon: "calendar" as const, label: "日历", url: "/pages/Calendar/index" },
    { icon: "map" as const, label: "地图", url: "/pages/Map/index" },
  ];

  const menuSection2 = [
    { icon: "books" as const, label: "账本", url: "/pages/Books/index" },
    { icon: "categories" as const, label: "分类", url: "/pages/Categories/index" },
    { icon: "templates" as const, label: "模版", url: "/pages/TemplateManager/index" },
    { icon: "budgets" as const, label: "预算", url: "/pages/Budgets/index" },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      Taro.navigateTo({ url: "/pages/User/Login/index" });
    } catch {
      // ignore
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
    setTokenExpiredEmail(null);
  };

  // 切换到已有账号：优先用 token，失效则显示密码输入框
  const handleSwitchAccount = async (account: SavedAccount) => {
    if (account.email === user?.email) {
      Taro.showToast({ title: "当前已是该账号", icon: "none" });
      return;
    }
    // 有 token，先尝试 token 登录
    if (account.token) {
      setSwitchingEmail(account.email);
      try {
        await switchByToken(account.email, account.token);
        Taro.showToast({ title: "账号切换成功", icon: "success" });
        setAccounts(getSavedAccounts());
        setSwitchModal(false);
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg === 'token_invalid') {
          // token 失效，显示密码输入框
          setTokenExpiredEmail(account.email);
          setLoginEmail(account.email);
          setLoginPassword('');
          setShowLoginForm(true);
          setSwitchingEmail(null);
          return;
        }
        // 其他错误，继续走密码登录
      }
      setSwitchingEmail(null);
    }
    // 无 token 或 token 失效，显示密码输入框
    setTokenExpiredEmail(account.email);
    setLoginEmail(account.email);
    setLoginPassword(decodePassword(account.password));
    setShowLoginForm(true);
  };

  // 删除已保存账号
  const handleRemoveAccount = (email: string) => {
    removeAccount(email);
    setAccounts(getSavedAccounts());
  };

  // 使用邮箱密码登录
  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("请输入邮箱和密码");
      return;
    }
    setLoginError("");
    setLoginLoading(true);
    try {
      await signIn(loginEmail.trim(), loginPassword);
      Taro.showToast({ title: "切换成功", icon: "success" });
      setAccounts(getSavedAccounts());
      setSwitchModal(false);
      setShowLoginForm(false);
      setLoginEmail("");
      setLoginPassword("");
      setLoginError("");
      setTokenExpiredEmail(null);
    } catch (err) {
      setLoginError("登录失败，请检查账号密码");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <PageLayout contentClassName="profile-content">
      {/* ===== User Header — 点击进入编辑资料 ===== */}
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

      {/* ===== 第一分组：年报 / 日历 / 地图 ===== */}
      <View className="menu-section">
        {menuSection1.map((item) => {
          return (
            <View
              key={item.label}
              className="menu-item"
              onClick={() => Taro.navigateTo({ url: item.url })}
            >
              <View className="mi-icon-wrap">
                <Icon name={item.icon} size={44} color="#2D9D8A" />
              </View>
              <Text className="mi-text">{item.label}</Text>
              <Text className="mi-arrow">›</Text>
            </View>
          );
        })}
      </View>

      {/* ===== 第二分组：账本 / 分类 / 模版 / 预算 ===== */}
      <View className="menu-section">
        {menuSection2.map((item) => {
          return (
            <View
              key={item.label}
              className="menu-item"
              onClick={() => Taro.navigateTo({ url: item.url })}
            >
              <View className="mi-icon-wrap">
                <Icon name={item.icon} size={44} color="#2D9D8A" />
              </View>
              <Text className="mi-text">{item.label}</Text>
              <Text className="mi-arrow">›</Text>
            </View>
          );
        })}
      </View>

      {/* ===== 切换账号 ===== */}
      <View className="menu-section">
        <View className="menu-item" onClick={handleOpenSwitch}>
          <View className="mi-icon-wrap">
            <Icon name="profile" size={44} color="#2D9D8A" />
          </View>
          <Text className="mi-text">切换账号</Text>
          <Text className="mi-arrow">›</Text>
        </View>
      </View>

      {/* ===== 退出登录 ===== */}
      <View className="menu-section">
        <View
          className="menu-item danger"
          onClick={() => setLogoutConfirm(true)}
        >
          <View className="mi-icon-wrap">
            <Icon name="logout" size={44} color="#E06055" />
          </View>
          <Text className="mi-text">退出登录</Text>
          <Text className="mi-arrow">›</Text>
        </View>
      </View>

      {/* ===== 退出确认弹窗 ===== */}
      {logoutConfirm && (
        <View className="logout-mask" onClick={() => setLogoutConfirm(false)}>
          <View className="logout-dialog" onClick={(e) => e.stopPropagation()}>
            <Text className="logout-title">确认退出</Text>
            <Text className="logout-desc">确定要退出当前账号吗？</Text>
            <View className="logout-actions">
              <View
                className="logout-btn logout-cancel"
                onClick={() => setLogoutConfirm(false)}
              >
                <Text>取消</Text>
              </View>
              <View className="logout-btn logout-ok" onClick={handleLogout}>
                <Text>退出</Text>
              </View>
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
                {/* 已保存账号列表 */}
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

                {/* 添加账号按钮 */}
                <View
                  className="switch-add-btn"
                  onClick={() => { setShowLoginForm(true); setLoginEmail(""); setLoginPassword(""); setLoginError(""); }}
                >
                  <Text className="switch-add-btn-text">+ 添加账号</Text>
                </View>
              </>
            ) : (
              <>
                {/* 登录表单 */}
                <View className="switch-login-form">
                  <Text className="switch-login-hint">
                    {tokenExpiredEmail ? "登录已过期，请重新输入密码" : "添加新账号登录"}
                  </Text>
                  <View className="switch-form-group">
                    <Text className="switch-form-label">邮箱</Text>
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
                  {loginError ? (
                    <Text className="switch-login-error">{loginError}</Text>
                  ) : null}
                  <View className="switch-login-actions">
                    <View
                      className="switch-login-btn switch-login-cancel"
                      onClick={() => { setShowLoginForm(false); setLoginError(""); setTokenExpiredEmail(null); }}
                    >
                      <Text>返回</Text>
                    </View>
                    <View
                      className={`switch-login-btn switch-login-ok${loginLoading ? " loading" : ""}`}
                      onClick={() => !loginLoading && handleLogin()}
                    >
                      <Text>{loginLoading ? "登录中..." : "登录"}</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </PageLayout>
  );
}
