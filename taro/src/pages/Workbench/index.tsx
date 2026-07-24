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
import { MenuList, PageHero } from "../../components/ui";
import "./index.scss";
import { TITLE_WORKBENCH } from "../../utils/sectionCopy";
import { NAV_ADD, NAV_ADD_DESC, NAV_BOOKS, NAV_CATEGORIES, NAV_TEMPLATES, NAV_BUDGETS, NAV_BOOKS_DESC, NAV_CATEGORIES_DESC, NAV_TEMPLATES_DESC, NAV_BUDGETS_DESC, NAV_WORKBENCH_META } from "../../utils/navCopy";

export default function Workbench() {
  const entries = [
    {
      icon: "add" as const,
      label: NAV_ADD,
      desc: NAV_ADD_DESC,
      url: "/pages/AddTransaction/index",
    },
    {
      icon: "books" as const,
      label: NAV_BOOKS,
      desc: NAV_BOOKS_DESC,
      url: "/pages/Books/index",
    },
    {
      icon: "categories" as const,
      label: NAV_CATEGORIES,
      desc: NAV_CATEGORIES_DESC,
      url: "/pages/Categories/index",
    },
    {
      icon: "templates" as const,
      label: NAV_TEMPLATES,
      desc: NAV_TEMPLATES_DESC,
      url: "/pages/TemplateManager/index",
    },
    {
      icon: "budgets" as const,
      label: NAV_BUDGETS,
      desc: NAV_BUDGETS_DESC,
      url: "/pages/Budgets/index",
    },
  ];

  return (
    <PageContainer>
      <PageHero
        title={TITLE_WORKBENCH}
        meta={NAV_WORKBENCH_META}
        tone="surface"
      />
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
