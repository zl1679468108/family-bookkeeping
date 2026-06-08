/**
 * Profile/Settings — 设置页面
 * 版本说明 + 退出登录（各占一行，严格按设计稿）
 */
import { useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useAuth } from "../../../context/AuthContext";
import PageLayout from "../../../components/PageLayout";
import ConfirmDialog from "../../../components/ConfirmDialog";
import "./index.scss";

export default function Settings() {
  const { signOut } = useAuth();
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

  const handleVersion = () => {
    Taro.showToast({ title: "家庭记账 v1.0.0", icon: "none" });
  };

  return (
    <PageLayout title="设置">
      {/* 版本说明 — block 占据一行 */}
      <View className="settings-card">
        <View className="settings-item" onClick={handleVersion}>
          <Text className="settings-label">版本说明</Text>
          <Text className="settings-arrow">›</Text>
        </View>
      </View>

      {/* 退出登录 — block 占据一行 */}
      <View className="settings-card">
        <View className="settings-item settings-item--danger" onClick={() => setShowLogout(true)}>
          <Text className="settings-label settings-label--danger">退出登录</Text>
        </View>
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
