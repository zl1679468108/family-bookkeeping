/**
 * TabBar（1:1 严格按设计稿）
 * 使用 Image 组件渲染 SVG 图标（微信小程序不支持 inline SVG）
 * 选中态：彩色（home.svg / transactions.svg / statistics.svg / profile.svg）
 * 未选中态：灰色（*-gray.svg）
 */
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";

export default function TabBar() {
  const router = Taro.useRouter();
  const currentPath = router.path;

  const isActive = (path: string) =>
    currentPath === path || currentPath.startsWith(path);

  const handleClick = (path: string) => {
    if (isActive(path)) return;
    Taro.switchTab({ url: path });
  };

  const items = [
    {
      path: "/pages/Home/index",
      label: "首页",
      active: require("../../assets/icons/home.svg"),
      inactive: require("../../assets/icons/home-gray.svg"),
    },
    {
      path: "/pages/Transactions/index",
      label: "流水",
      active: require("../../assets/icons/transactions.svg"),
      inactive: require("../../assets/icons/transactions-gray.svg"),
    },
    {
      path: "/pages/Statistics/index",
      label: "报表",
      active: require("../../assets/icons/statistics.svg"),
      inactive: require("../../assets/icons/statistics-gray.svg"),
    },
    {
      path: "/pages/Profile/index",
      label: "我的",
      active: require("../../assets/icons/profile.svg"),
      inactive: require("../../assets/icons/profile-gray.svg"),
    },
  ];

  return (
    <View className="tab-bar-container">
      {items.map((it) => {
        const active = isActive(it.path);
        return (
          <View
            key={it.path}
            className={`tab-bar-item ${active ? "tab-bar-item--active" : ""}`}
            onClick={() => handleClick(it.path)}
          >
            <Image
              className="tab-bar-icon"
              src={active ? it.active : it.inactive}
              mode="aspectFit"
            />
            <Text className="tab-bar-label">{it.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
