import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import Icon from "../Icon";
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

  const homeActive = isActive("/pages/Home/index");
  const txActive = isActive("/pages/Transactions/index");
  const statsActive = isActive("/pages/Statistics/index");
  const profileActive = isActive("/pages/Profile/index");

  return (
    <View className="tab-bar-container">
      <View
        className="tab-bar-item"
        onClick={() => handleClick("/pages/Home/index")}
      >
        <Icon name={homeActive ? "home" : "home-gray"} size={44} />
        <Text
          className={`tab-bar-label ${homeActive ? "tab-bar-label--active" : ""}`}
        >
          首页
        </Text>
      </View>

      <View
        className="tab-bar-item"
        onClick={() => handleClick("/pages/Transactions/index")}
      >
        <Icon name={txActive ? "transactions" : "transactions-gray"} size={44} />
        <Text
          className={`tab-bar-label ${txActive ? "tab-bar-label--active" : ""}`}
        >
          流水
        </Text>
      </View>

      <View
        className="tab-bar-item"
        onClick={() => handleClick("/pages/Statistics/index")}
      >
        <Icon name={statsActive ? "statistics" : "statistics-gray"} size={44} />
        <Text
          className={`tab-bar-label ${statsActive ? "tab-bar-label--active" : ""}`}
        >
          报表
        </Text>
      </View>

      <View
        className="tab-bar-item"
        onClick={() => handleClick("/pages/Profile/index")}
      >
        <Icon name={profileActive ? "profile" : "profile-gray"} size={44} />
        <Text
          className={`tab-bar-label ${profileActive ? "tab-bar-label--active" : ""}`}
        >
          我的
        </Text>
      </View>
    </View>
  );
}
