import { NAV_HOME, NAV_TRANSACTIONS, NAV_WORKBENCH, NAV_PROFILE } from './utils/navCopy'
import { APP_NAME } from './config/version'
export default defineAppConfig({
  pages: [
    "pages/Home/index",
    "pages/Transactions/index",
    "pages/Workbench/index",
    "pages/AddTransaction/index",
    "pages/Profile/index",
    "pages/EditProfile/index",
    "pages/User/Login/index",
    "pages/User/Register/index",
    "pages/User/ForgotPassword/index",
    "pages/Budgets/index",
    "pages/Categories/index",
    "pages/CategoryEdit/index",
    "pages/Books/index",
    "pages/BookMembers/index",
    "pages/BookSettings/index",
    "pages/TemplateManager/index",
    "pages/TemplateEdit/index",
    "pages/About/index",
    "pages/Onboarding/index",
    "pages/Terms/index",
    "pages/Privacy/index",
  ],
  window: {
    backgroundTextStyle: "dark",
    navigationBarBackgroundColor: "#FFFFFF",
    navigationBarTitleText: APP_NAME,
    navigationBarTextStyle: "black",
    backgroundColor: "#F6F7F4",
    enablePullDownRefresh: false,
  },
  // 开启微信隐私合规检查：调用 getLocation/chooseMedia 等敏感接口前会弹授权弹窗
  __usePrivacyCheck__: true,
  // 小程序搜索索引配置：将所有页面排除在微信搜索结果之外
  sitemapLocation: "sitemap.json",
  // 位置权限声明（LocationPicker 的「我的位置」用到 Taro.getLocation）
  permission: {
    "scope.userLocation": {
      desc: "用于记录交易发生的地点",
    },
  },
  requiredPrivateInfos: ["getLocation", "onLocationChange"],
  tabBar: {
    custom: true,
    color: "#8B8E89",
    selectedColor: "#2D9D8A",
    backgroundColor: "#FFFFFF",
    borderStyle: "white",
    list: [
      { pagePath: "pages/Home/index", text: NAV_HOME },
      { pagePath: "pages/Transactions/index", text: NAV_TRANSACTIONS },
      { pagePath: "pages/Workbench/index", text: NAV_WORKBENCH },
      { pagePath: "pages/Profile/index", text: NAV_PROFILE },
    ],
  },
});
