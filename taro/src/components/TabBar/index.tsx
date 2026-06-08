import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import Icon, { IconName } from "../Icon";
import "./index.scss";

interface TabItem {
  key: string;
  label: string;
  path: string;
  icon: IconName;
}

const tabs: TabItem[] = [
  { key: "home", label: "首页", path: "/pages/Home/index", icon: "home" },
  {
    key: "transactions",
    label: "流水",
    path: "/pages/Transactions/index",
    icon: "transactions",
  },
  {
    key: "statistics",
    label: "统计",
    path: "/pages/Statistics/index",
    icon: "statistics",
  },
  {
    key: "profile",
    label: "我的",
    path: "/pages/Profile/index",
    icon: "profile",
  },
];

export default function TabBar() {
  const router = Taro.useRouter();
  const currentPath = router.path;

  const isActive = (path: string) =>
    currentPath === path || currentPath.startsWith(path);

  const handleClick = (path: string) => {
    if (isActive(path)) return;
    Taro.switchTab({ url: path });
  };

  const handleFabClick = () => {
    Taro.switchTab({ url: "/pages/AddTransaction/index" });
  };

  // Split tabs into left group (before FAB) and right group (after FAB)
  const leftTabs = tabs.slice(0, 2); // Home, Transactions
  const rightTabs = tabs.slice(2); // Statistics, Profile

  return (
    <View
      className="tab-bar-container"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <View className="tab-bar-capsule">
        {/* Left tabs */}
        {leftTabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <View
              key={tab.key}
              className={`tab-bar-item ${active ? "tab-bar-item--active" : ""}`}
              onClick={() => handleClick(tab.path)}
            >
              <Icon
                name={tab.icon}
                size={44}
                color={active ? "#5B9A7A" : "#B0ADA6"}
              />
              <Text
                className={`tab-bar-label ${active ? "tab-bar-label--active" : ""}`}
              >
                {tab.label}
              </Text>
            </View>
          );
        })}

        {/* Center FAB */}
        <View className="tab-bar-fab-area">
          <View className="tab-bar-fab" onClick={handleFabClick}>
            <Text className="tab-bar-fab-icon">＋</Text>
          </View>
        </View>

        {/* Right tabs */}
        {rightTabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <View
              key={tab.key}
              className={`tab-bar-item ${active ? "tab-bar-item--active" : ""}`}
              onClick={() => handleClick(tab.path)}
            >
              <Icon
                name={tab.icon}
                size={44}
                color={active ? "#5B9A7A" : "#B0ADA6"}
              />
              <Text
                className={`tab-bar-label ${active ? "tab-bar-label--active" : ""}`}
              >
                {tab.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
