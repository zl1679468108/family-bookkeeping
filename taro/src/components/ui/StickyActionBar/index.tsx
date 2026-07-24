/**
 * StickyActionBar — 页面底部固定操作栏
 * 统一 BookSettings / TemplateEdit / 表单页底栏布局与安全区
 */
import { ReactNode } from "react";
import { cx } from "../../../utils/cx";
import { View } from "@tarojs/components";
import "./index.scss";

export interface StickyActionBarProps {
  children: ReactNode;
  /** blur: 毛玻璃；solid: 实色底（默认） */
  tone?: "solid" | "blur";
  /** 单行多按钮时自动 flex 均分 */
  row?: boolean;
  className?: string;
}

export function StickyActionBar({
  children,
  tone = "solid",
  row = false,
  className = "",
}: StickyActionBarProps) {
  const cls = cx(
    "ui-sticky-actions",
    `ui-sticky-actions--${tone}`,
    row && "ui-sticky-actions--row",
    className,
  );

  return <View className={cls}>{children}</View>;
}

export default StickyActionBar;
