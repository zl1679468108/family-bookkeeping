/**
 * Workbench — 工作台
 * 五大入口与 PC 端保持一致：
 *   1. 记一笔 —— 对应 PC 侧边栏主菜单「记一笔」
 *   2. 账本    —— 对应 PC 侧边栏「更多」组「账本」
 *   3. 分类    —— 对应 PC 侧边栏「更多」组「分类」
 *   4. 模板    —— 对应 PC 侧边栏「更多」组「模板」
 *   5. 预算    —— 对应 PC 侧边栏「更多」组「预算」
 */
import { Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageContainer from "../../components/PageContainer";
import { MenuList } from "../../components/ui";
import "./index.scss";

export default function Workbench() {
  const entries = [
    {
      icon: "add" as const,
      label: "记一笔",
      desc: "快速记录一笔收支",
      url: "/pages/AddTransaction/index",
    },
    {
      icon: "books" as const,
      label: "账本",
      desc: "管理家庭账本与成员",
      url: "/pages/Books/index",
    },
    {
      icon: "categories" as const,
      label: "分类",
      desc: "自定义收支分类与图标",
      url: "/pages/Categories/index",
    },
    {
      icon: "templates" as const,
      label: "模板",
      desc: "快捷记账模板",
      url: "/pages/TemplateManager/index",
    },
    {
      icon: "budgets" as const,
      label: "预算",
      desc: "设置月度分类预算",
      url: "/pages/Budgets/index",
    },
  ];

  return (
    <PageContainer>
      <MenuList
        items={entries.map((item) => ({
          key: item.label,
          label: item.label,
          icon: item.icon,
          right: <Text className="wb-entry__desc">{item.desc}</Text>,
          onClick: () => Taro.navigateTo({ url: item.url }),
        }))}
      />
    </PageContainer>
  );
}
