/**
 * Profile — v4 严格按设计稿
 */
import { useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useAuth } from "../../context/AuthContext";
import { useBookContext } from "../../context/BookContext";
import Icon from "../../components/Icon";
import PageLayout from "../../components/PageLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import type { IconName } from "../../components/Icon";
import "./index.scss";

const menu: { label: string; icon: IconName; path: string }[] = [
  { label: "账本管理", icon: "book", path: "/pages/Books/index" },
  { label: "预算管理", icon: "budget", path: "/pages/Budgets/index" },
  { label: "分类管理", icon: "category", path: "/pages/Categories/index" },
  { label: "模板管理", icon: "template", path: "/pages/TemplateManager/index" },
];

const tools: { label: string; icon: IconName; path: string }[] = [
  { label: "现金流日历", icon: "calendar", path: "/pages/Calendar/index" },
  { label: "设置", icon: "settings", path: "/pages/Profile/Settings/index" },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const { books } = useBookContext();
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      setShowLogout(false);
      Taro.reLaunch({ url: "/pages/User/Login/index" });
    } catch {
      setLoggingOut(false);
    }
  };

  const initial = user?.username?.charAt(0)?.toUpperCase() || "U";

  return (
    <PageLayout title="我的" tabBar className="profile-page" contentClassName="profile-content">
      {/* ===== 头像区 — 严格对齐设计稿 ===== */}
      <View className="profile-header">
        <View className="profile-avatar">
          <Text className="profile-avatar-text">{initial}</Text>
        </View>
        <Text className="profile-nickname">
          {user?.username || "用户"}
        </Text>
        <Text className="profile-subtitle">
          家庭记账 · 已坚持 186 天
        </Text>
      </View>

      {/* ===== 统计卡片 — 设计稿 .card ===== */}
      <View className="profile-stats-card">
        <View className="profile-stat-item" onClick={() => {}}>
          <Text className="profile-stat-num">{books.length}</Text>
          <Text className="profile-stat-label">账本</Text>
        </View>
        <View className="profile-stat-item" onClick={() => Taro.navigateTo({ url: "/pages/Calendar/index" })}>
          <Text className="profile-stat-num">186</Text>
          <Text className="profile-stat-label">记账天数</Text>
        </View>
        <View className="profile-stat-item">
          <Text className="profile-stat-num">452</Text>
          <Text className="profile-stat-label">总笔数</Text>
        </View>
      </View>

      {/* ===== 菜单 — 账本管理 ===== */}
      <View className="menu-section">
        <Text className="menu-section-title">账本管理</Text>
        <View className="menu-card">
          {menu.map((item, idx) => (
            <View
              key={item.label}
              className={`menu-item ${idx === menu.length - 1 ? "menu-item--last" : ""}`}
              onClick={() => Taro.navigateTo({ url: item.path })}
            >
              <View className="menu-icon">
                <Icon name={item.icon} size={36} className="icon" />
              </View>
              <View className="menu-info">
                <Text className="menu-name">{item.label}</Text>
                <Text className="menu-arrow">›</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ===== 菜单 — 工具 ===== */}
      <View className="menu-section">
        <Text className="menu-section-title">工具</Text>
        <View className="menu-card">
          {tools.map((item) => (
            <View
              key={item.label}
              className="menu-item menu-item--last"
              onClick={() => Taro.navigateTo({ url: item.path })}
            >
              <View className="menu-icon">
                <Icon name={item.icon} size={36} className="icon" />
              </View>
              <View className="menu-info">
                <Text className="menu-name">{item.label}</Text>
                <Text className="menu-arrow">›</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ===== 退出登录（已移到设置页）===== */}

      <ConfirmDialog
        visible={showLogout}
        title="退出登录"
        message="确定要退出当前账号吗？"
        confirmText="退出"
        cancelText="取消"
        confirmLoading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </PageLayout>
  );
}
