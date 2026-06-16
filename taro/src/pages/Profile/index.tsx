/**
 * Profile — 我的
 * 菜单顺序：年报 / 日历 / 地图 / 账本 / 分类 / 模版 / 预算 / 退出登录
 */
import { useState } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useAuth } from "../../context/AuthContext";
import PageLayout from "../../components/PageLayout";
import Icon from "../../components/Icon";
import "./index.scss";

export default function Profile() {
  const { user, signOut } = useAuth();
  const [logoutConfirm, setLogoutConfirm] = useState(false);

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

  const renderItem = (
    icon: string,
    label: string,
    onClick: () => void,
  ) => (
    <View className="menu-item" onClick={onClick}>
      <View className="mi-icon-wrap">
        <Icon name={icon as any} size={44} color="#2D9D8A" />
      </View>
      <Text className="mi-text">{label}</Text>
      <Text className="mi-arrow">›</Text>
    </View>
  );

  const handleLogout = async () => {
    try {
      await signOut();
      Taro.navigateTo({ url: "/pages/User/Login/index" });
    } catch {
      // ignore
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
    </PageLayout>
  );
}
