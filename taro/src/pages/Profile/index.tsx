/**
 * Profile — 我的
 * 菜单：切换主题 / 切换账号 / 关于财猫家庭记账 / 用户协议 / 隐私政策 / 注销账号 / 退出登录
 * （个人信息入口 = 顶部 Header 卡片点击）
 */
import { useRef, useState } from "react";
import { View, Text, Image, Input, Button as WxButton } from "@tarojs/components";
import { Button, FooterActions, MenuList, Spinner } from "../../components/ui";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useSubmit } from "../../hooks/useSubmit";
import Taro from "@tarojs/taro";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { deactivateAccount } from "../../services/authApi";
import PageContainer from "../../components/PageContainer";
import { TAB_BAR_BOTTOM_SPACE_RPX } from "../../utils/pageLayout";
import Icon, { ICON_COLOR } from "../../components/Icon";
import {
  getSavedAccounts,
  getAccountToken,
  getAccountRefreshToken,
  removeAccount,
  SavedAccount,
} from "../../utils/savedAccounts";
import "./index.scss";
import { toastSuccess, toastInfo } from "../../utils/toast";
import { userDisplayName, userInitial } from "../../utils/userDisplay";
import { SUCCESS_ACCOUNT_SWITCHED, SUCCESS_ACCOUNT_DEACTIVATED } from "../../utils/successCopy";
import { FORM_ALREADY_CURRENT_ACCOUNT, FORM_DEACTIVATE_PASSWORD, FORM_PASSWORD_LOGIN_PLACEHOLDER } from "../../utils/formCopy";
import { BADGE_CURRENT } from "../../utils/fieldCopy";
import {
  ACTION_LOGOUT,
  ACTION_DEACTIVATING,
  ACTION_CONFIRM_DEACTIVATE,
  ACTION_SWITCH_THEME,
  THEME_DARK_MODE,
  THEME_LIGHT_MODE,
  ACTION_SWITCH_ACCOUNT,
  ACTION_SWITCHING,
  ACTION_DEACTIVATE_ACCOUNT,
  ACTION_CONTACT_SUPPORT,
  ACTION_CLOSE,
  ACTION_CANCEL,
  ACTION_REMOVE_ACCOUNT,
} from "../../utils/actionCopy";
import { AUTH_LOGIN_EXPIRED, authLoginExpiredRelogin } from "../../utils/authCopy";
import { EMPTY_NO_SAVED_ACCOUNTS } from "../../utils/emptyCopy";
import { TITLE_ABOUT, TITLE_USER_AGREEMENT, TITLE_PRIVACY_POLICY } from "../../utils/sectionCopy";
import { ERROR_DEACTIVATE_FAILED } from "../../utils/errorCopy";
import { appCustomerServiceTitle } from "../../config/version";
import { CONFIRM_DEACTIVATE_WARNING } from "../../utils/confirmCopy";
import {
  buildThemeToggleLabelClassName,
  buildThemeToggleSwitchClassName,
  buildSwitchAccountItemClassName,
} from "../../utils/booksUi";

export default function Profile() {
  const { user, signOut, switchByToken } = useAuth();
  const { run } = useSubmit();
  const { isDark, toggleTheme } = useTheme();
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const logoutLockRef = useRef(false);
  const [switchModal, setSwitchModal] = useState(false);
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null);
  const [expiredEmail, setExpiredEmail] = useState<string | null>(null);
  // 注销账号相关
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivateError, setDeactivateError] = useState("");
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const deactivateLockRef = useRef(false);

  const initial = userInitial(user);
  const hasAvatar = user?.avatar_url && user.avatar_url.startsWith('data:') || user?.avatar_url?.startsWith('http');

  const handleLogout = async () => {
    // ref 锁：避免确认按钮连点在 setState 生效前重复调 signOut
    if (logoutLockRef.current) return;
    logoutLockRef.current = true;
    setLogoutLoading(true);
    try {
      await signOut();
      Taro.navigateTo({ url: "/pages/User/Login/index" });
    } catch {
      // ignore
    } finally {
      logoutLockRef.current = false;
      setLogoutLoading(false);
      setLogoutConfirm(false);
    }
  };

  // 注销账号：二次确认 + 密码校验 → 调接口 → 清理本地账号 → 跳登录
  const handleOpenDeactivate = () => {
    if (deactivateLoading || deactivateLockRef.current) return;
    setDeactivatePassword("");
    setDeactivateError("");
    setDeactivateModal(true);
  };

  const handleConfirmDeactivate = async () => {
    if (deactivateLockRef.current) return;
    if (!deactivatePassword) {
      setDeactivateError(FORM_DEACTIVATE_PASSWORD);
      return;
    }
    deactivateLockRef.current = true;
    setDeactivateError("");
    setDeactivateLoading(true);
    try {
      await deactivateAccount(deactivatePassword);
      // 清理本地保存的当前账号
      if (user?.email) removeAccount(user.email);
      toastSuccess(SUCCESS_ACCOUNT_DEACTIVATED);
      // 本地清理（不再走 apiLogout，后端 session 已被清）
      try { await signOut(); } catch {}
      setTimeout(() => {
        Taro.reLaunch({ url: "/pages/User/Login/index" });
      }, 800);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setDeactivateError(e?.message || ERROR_DEACTIVATE_FAILED);
      deactivateLockRef.current = false;
      setDeactivateLoading(false);
    }
  };

  // 打开切换账号弹窗（对齐 PC：仅展示已保存账号列表）
  const handleOpenSwitch = () => {
    setAccounts(getSavedAccounts());
    setSwitchModal(true);
    setSwitchingEmail(null);
    setExpiredEmail(null);
  };

  const handleCloseSwitch = () => {
    setSwitchModal(false);
    setSwitchingEmail(null);
    setExpiredEmail(null);
  };

  // 切换到已有账号：useSubmit 防连点；失效则弹出过期提示并引导去登录（对齐 PC）
  const handleSwitchAccount = (account: SavedAccount) => {
    if (account.email === user?.email) {
      toastInfo(FORM_ALREADY_CURRENT_ACCOUNT);
      return;
    }
    if (switchingEmail) return;
    run(async () => {
      setSwitchingEmail(account.email);
      try {
        const token = (getAccountToken(account.email) || "").trim();
        const refreshToken = (getAccountRefreshToken(account.email) || "").trim();
        // access 或 refresh 任一可用即可切换；都没有才算登录过期
        if (token || refreshToken) {
          await switchByToken(account.email, token, refreshToken || undefined);
          toastSuccess(SUCCESS_ACCOUNT_SWITCHED);
          setAccounts(getSavedAccounts());
          setSwitchModal(false);
          setExpiredEmail(null);
          // 对齐 PC navigate('/')：清空页面栈并回首页，确保账本/数据按新账号重载
          Taro.reLaunch({ url: "/pages/Home/index" });
          return;
        }
        setExpiredEmail(account.email);
      } catch {
        setExpiredEmail(account.email);
      } finally {
        setSwitchingEmail(null);
      }
    }, ACTION_SWITCHING).catch(() => {
      setSwitchingEmail(null);
      setExpiredEmail(account.email);
    });
  };

  const handleRemoveAccount = (email: string) => {
    removeAccount(email);
    setAccounts(getSavedAccounts());
  };

  // 过期账号 → 去登录页重新登录（对齐 PC）
  const goLogin = () => {
    setExpiredEmail(null);
    setSwitchModal(false);
    Taro.navigateTo({ url: "/pages/User/Login/index" });
  };

  return (
    <PageContainer
      bottomSpace={TAB_BAR_BOTTOM_SPACE_RPX} contentClassName="profile-content">
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
          <Text className="profile-header__name">{userDisplayName(user)}</Text>
          <Text className="profile-header__email">{user?.email || ""}</Text>
        </View>
        <Icon
          name="chevron-right"
          size={36}
          color={ICON_COLOR.onPrimary}
          className="profile-header__arrow"
        />
      </View>

      {/* ===== 菜单列表（与 PC 端对齐） ===== */}
      <MenuList
        items={[
          {
            label: ACTION_SWITCH_THEME,
            icon: isDark ? "moon" : "sun",
            right: (
              <View className="theme-toggle" onClick={(e) => { e.stopPropagation(); toggleTheme(); }}>
                <Text className={buildThemeToggleLabelClassName({ dark: isDark })}>
                  {isDark ? THEME_DARK_MODE : THEME_LIGHT_MODE}
                </Text>
                <View className={buildThemeToggleSwitchClassName({ on: isDark })}>
                  <View className="theme-toggle__knob" />
                </View>
              </View>
            ),
            onClick: toggleTheme,
          },
          {
            label: ACTION_SWITCH_ACCOUNT,
            icon: "switch-account",
            onClick: handleOpenSwitch,
          },
          {
            label: TITLE_ABOUT,
            icon: "info",
            onClick: () => Taro.navigateTo({ url: "/pages/About/index" }),
          },
          {
            label: TITLE_USER_AGREEMENT,
            icon: "note",
            onClick: () => Taro.navigateTo({ url: "/pages/Terms/index" }),
          },
          {
            label: TITLE_PRIVACY_POLICY,
            icon: "lock",
            onClick: () => Taro.navigateTo({ url: "/pages/Privacy/index" }),
          },
          {
            label: ACTION_DEACTIVATE_ACCOUNT,
            icon: "delete-red",
            danger: true,
            onClick: handleOpenDeactivate,
          },
          {
            label: ACTION_LOGOUT,
            icon: "logout",
            danger: true,
            onClick: () => setLogoutConfirm(true),
          },
        ]}
      />

      {/* ===== {ACTION_CONTACT_SUPPORT}（微信原生 Button openType=contact） ===== */}
      <WxButton
        className="contact-btn"
        openType="contact"
        sessionFrom="profile"
        sendMessageTitle={appCustomerServiceTitle()}
        sendMessagePath="/pages/Profile/index"
      >
        <View className="contact-btn__inner">
          <View className="contact-btn__icon">
            <Icon name="email" size={48} color="var(--pr)" />
          </View>
          <Text className="contact-btn__label">{ACTION_CONTACT_SUPPORT}</Text>
          <Icon name="chevron-right" size={28} color={ICON_COLOR.muted} />
        </View>
      </WxButton>

      {/* ===== 退出确认弹窗 ===== */}
      <ConfirmDialog
        visible={logoutConfirm}
        title="确认退出"
        message="确定要退出当前账号吗？"
        confirmText={ACTION_LOGOUT}
        confirmLoading={logoutLoading}
        danger
        onConfirm={handleLogout}
        onCancel={() => {
          if (logoutLoading) return;
          setLogoutConfirm(false);
        }}
      />

      {/* ===== 注销账号弹窗 ===== */}
      {deactivateModal && (
        <View className="deactivate-mask" onClick={() => !deactivateLoading && setDeactivateModal(false)}>
          <View className="deactivate-dialog" onClick={(e) => e.stopPropagation()}>
            <Text className="deactivate-title">{ACTION_DEACTIVATE_ACCOUNT}</Text>
            <Text className="deactivate-warning">
              {CONFIRM_DEACTIVATE_WARNING}
            </Text>
            <View className="deactivate-field">
              <Text className="deactivate-label">请输入密码以确认</Text>
              <Input
                className="deactivate-input"
                value={deactivatePassword}
                onInput={(e) => setDeactivatePassword(e.detail.value)}
                placeholder={FORM_PASSWORD_LOGIN_PLACEHOLDER}
                placeholderClass="text-hint"
                password
                confirmType="done"
                onConfirm={handleConfirmDeactivate}
              />
            </View>
            {deactivateError ? (
              <Text className="deactivate-error">{deactivateError}</Text>
            ) : null}
            <FooterActions align="stretch" className="deactivate-actions">
              <Button
                variant="default"
                size="lg"
                block
                disabled={deactivateLoading}
                onClick={() => !deactivateLoading && setDeactivateModal(false)}
              >
                取消
              </Button>
              <Button
                variant="danger"
                size="lg"
                block
                loading={deactivateLoading}
                onClick={() => !deactivateLoading && handleConfirmDeactivate()}
              >
                {deactivateLoading ? ACTION_DEACTIVATING : ACTION_CONFIRM_DEACTIVATE}
              </Button>
            </FooterActions>
          </View>
        </View>
      )}

      {/* ===== 切换账号弹窗（对齐 PC SwitchAccountModal） ===== */}
      {switchModal && (
        <View className="switch-mask" onClick={handleCloseSwitch}>
          <View className="switch-dialog" onClick={(e) => e.stopPropagation()}>
            <View className="switch-header">
              <Text className="switch-title">{ACTION_SWITCH_ACCOUNT}</Text>
              <View className="switch-close" onClick={handleCloseSwitch} aria-label={ACTION_CLOSE}>
                <Icon name="close" size={28} color={ICON_COLOR.muted} />
              </View>
            </View>

            <View className="switch-body">
              {accounts.length > 0 ? (
                <View className="switch-account-list">
                  {accounts.map((account) => {
                    const isCurrent = account.email === user?.email;
                    const accInitial = userInitial(account);
                    return (
                      <View
                        key={account.email}
                        className={buildSwitchAccountItemClassName({
                          current: isCurrent,
                          switching: switchingEmail === account.email,
                        })}
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
                          <View className="switch-account-name">
                            <Text className="switch-account-name-text">{userDisplayName(account)}</Text>
                            {isCurrent && <Text className="switch-current-badge">{BADGE_CURRENT}</Text>}
                          </View>
                          <Text className="switch-account-email">{account.email}</Text>
                        </View>
                        {!isCurrent && switchingEmail === account.email && (
                          <View className="switch-account-loading">
                            <Spinner size="sm" />
                          </View>
                        )}
                        {!isCurrent && switchingEmail !== account.email && (
                          <View
                            className="switch-account-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAccount(account.email);
                            }}
                            aria-label={ACTION_REMOVE_ACCOUNT}
                          >
                            <Icon name="close" size={28} color={ICON_COLOR.muted} />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text className="switch-empty-hint">{EMPTY_NO_SAVED_ACCOUNTS}</Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 登录过期提示（对齐 PC SwitchAccountModal） */}
      {expiredEmail && (
        <View className="expired-mask" onClick={() => setExpiredEmail(null)}>
          <View className="expired-dialog" onClick={(e) => e.stopPropagation()}>
            <View className="expired-icon">
              <Icon name="info" size={64} color={ICON_COLOR.warn} />
            </View>
            <Text className="expired-title">{AUTH_LOGIN_EXPIRED}</Text>
            <Text className="expired-desc">{authLoginExpiredRelogin(expiredEmail)}</Text>
            <FooterActions align="stretch" className="expired-actions">
              <Button
                variant="default"
                size="md"
                block
                className="expired-btn expired-btn-cancel"
                onClick={() => setExpiredEmail(null)}
              >
                {ACTION_CANCEL}
              </Button>
              <Button
                variant="primary"
                size="md"
                block
                className="expired-btn expired-btn-login"
                onClick={goLogin}
              >
                去登录
              </Button>
            </FooterActions>
          </View>
        </View>
      )}
    </PageContainer>
  );
}
