/**
 * Profile/Settings — 设置页面（严格按设计稿）
 * 设计稿中"退出登录"已移至 Profile 页面底部
 */
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageLayout from "../../../components/PageLayout";
import "./index.scss";

export default function Settings() {
  const handleVersion = () => {
    Taro.showToast({ title: "静记 v1.0.0", icon: "none" });
  };

  return (
    <PageLayout>
      <View className="settings-card">
        <View className="settings-item" onClick={handleVersion}>
          <Text className="settings-label">版本说明</Text>
          <Text className="settings-arrow">›</Text>
        </View>
      </View>
    </PageLayout>
  );
}
