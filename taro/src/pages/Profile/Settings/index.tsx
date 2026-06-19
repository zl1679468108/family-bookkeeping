/**
 * Profile/Settings — 设置页面
 * 包含：清理缓存、隐私政策、用户协议、关于我们、版本说明
 */
import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageLayout from "../../../components/PageLayout";
import { MenuList, PageHero } from "../../../components/ui";
import "./index.scss";

export default function Settings() {
  const [cacheSize, setCacheSize] = useState<string>("计算中…");
  const [clearing, setClearing] = useState(false);

  // 计算缓存大小
  const computeCache = () => {
    try {
      const info = Taro.getStorageInfoSync();
      const kb = (info && info.currentSize) || 0;
      if (kb < 1024) {
        setCacheSize(`${kb} KB`);
      } else {
        setCacheSize(`${(kb / 1024).toFixed(1)} MB`);
      }
    } catch (e) {
      setCacheSize("— KB");
    }
  };

  useEffect(() => {
    const timer = setTimeout(computeCache, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleClearCache = () => {
    Taro.showModal({
      title: "清理缓存",
      content: `确定要清除本地缓存（${cacheSize}）吗？不会影响您的记账数据。`,
      confirmText: "清理",
      confirmColor: "#e03131",
      success: (res) => {
        if (res.confirm) {
          setClearing(true);
          try {
            Taro.clearStorageSync();
          } catch (e) {
            // ignore
          }
          setTimeout(() => {
            setClearing(false);
            computeCache();
            Taro.showToast({ title: "缓存已清理", icon: "success" });
          }, 400);
        }
      },
    });
  };

  const handlePrivacy = () => {
    Taro.showModal({
      title: "隐私政策",
      content:
        "静记重视您的隐私。我们仅在必要时收集用于登录和同步的数据，所有记账数据默认存储于您的账号下，不会向第三方泄露您的个人信息。",
      showCancel: false,
      confirmText: "我知道了",
    });
  };

  const handleTerms = () => {
    Taro.showModal({
      title: "用户协议",
      content:
        "欢迎使用静记。使用本应用即表示您同意合法、合理地使用我们提供的记账服务，不得利用本应用从事违反法律法规的活动。",
      showCancel: false,
      confirmText: "我知道了",
    });
  };

  const handleAbout = () => {
    Taro.showModal({
      title: "关于静记",
      content:
        "静记是一款清爽、简洁的家庭记账工具。支持多账本、成员协作、分类管理、数据统计与导出。",
      showCancel: false,
      confirmText: "好的",
    });
  };

  const handleVersion = () => {
    Taro.showToast({ title: "静记 v1.0.0", icon: "none" });
  };

  return (
    <PageLayout contentClassName="settings-content">
      <PageHero
        tone="surface"
        eyebrow="设置"
        title="应用偏好与说明"
        meta="管理本地缓存、协议政策和版本信息"
      />

      <MenuList
        items={[
          {
            label: "清理缓存",
            icon: "delete",
            right: (
              <View className="settings-right">
                <Text className="settings-value">{clearing ? "清理中..." : cacheSize}</Text>
                <Text className="settings-arrow">›</Text>
              </View>
            ),
            onClick: handleClearCache,
          },
        ]}
      />

      <MenuList
        items={[
          { label: "隐私政策", icon: "lock", onClick: handlePrivacy },
          { label: "用户协议", icon: "note", onClick: handleTerms },
          { label: "关于我们", icon: "profile", onClick: handleAbout },
        ]}
      />

      <MenuList
        items={[
          {
            label: "版本说明",
            icon: "settings",
            right: <Text className="settings-value">v1.0.0</Text>,
            onClick: handleVersion,
          },
        ]}
      />

      {/* 底部版本号 */}
      <View className="settings-footer">
        <Text className="settings-footer-text">静记 · 让记账简单一点</Text>
      </View>
    </PageLayout>
  );
}
