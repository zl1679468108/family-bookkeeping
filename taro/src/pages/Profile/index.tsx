/**
 * Profile — V3.0 安静我的页面
 */
import { useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useAuth } from "../../context/AuthContext";
import Icon from "../../components/Icon";
import PageLayout from "../../components/PageLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import type { IconName } from "../../components/Icon";
import "./index.scss";

interface MenuItem {
  label: string;
  icon: IconName;
  path: string;
}

const menu: MenuItem[] = [
  { label: "账本管理", icon: "book", path: "/pages/Books/index" },
  { label: "预算管理", icon: "budget", path: "/pages/Budgets/index" },
  { label: "分类管理", icon: "category", path: "/pages/Categories/index" },
  { label: "模板管理", icon: "template", path: "/pages/TemplateManager/index" },
  { label: "现金流日历", icon: "calendar", path: "/pages/Calendar/index" },
];

export default function Profile() {
  const { user, signOut } = useAuth();
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
    <PageLayout title="我的" tabBar className="profile-page">
      {/* User info card */}
      <View className="user-card mx-4 mt-3">
        <View className="user-card-inner">
          <View className="user-avatar flex items-center justify-center">
            <Text className="user-avatar-text">{initial}</Text>
          </View>
          <View className="user-info">
            <Text className="user-name">{user?.username || "用户"}</Text>
            <Text className="user-email">{user?.email || ""}</Text>
          </View>
        </View>
      </View>

      {/* Menu list */}
      <View className="menu-card mx-4 mt-4">
        {menu.map((item, idx) => (
          <View
            key={item.label}
            className={`menu-item flex items-center p-3 ${idx < menu.length - 1 ? "border-b" : ""}`}
            onClick={() => Taro.navigateTo({ url: item.path })}
            hoverClass="tappable-card"
          >
            <Icon name={item.icon} size={40} color="var(--color-text)" />
            <Text className="menu-label flex-1 text-md">{item.label}</Text>
            <Text className="menu-arrow text-hint text-lg">▸</Text>
          </View>
        ))}
      </View>

      {/* Logout button */}
      <View className="px-4 mt-5">
        <View className="btn-danger-text" onClick={() => setShowLogout(true)}>
          <Text>退出登录</Text>
        </View>
      </View>

      {/* Version */}
      <View className="version-wrap">
        <Text className="version-text">家庭记账 v1.0.0</Text>
      </View>

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
