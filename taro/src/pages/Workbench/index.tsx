/**
 * Workbench — 工作台
 * 四大管理入口：账本 / 分类 / 模板 / 预算
 */
import { Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageLayout from "../../components/PageLayout";
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
    <PageLayout contentClassName="wb-content">
      <MenuList
        items={entries.map((item) => ({
          key: item.label,
          label: item.label,
          icon: item.icon,
          right: <Text className="wb-entry__desc">{item.desc}</Text>,
          onClick: () => Taro.navigateTo({ url: item.url }),
        }))}
      />
    </PageLayout>
  );
}
