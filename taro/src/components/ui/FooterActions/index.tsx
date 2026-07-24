/**
 * FooterActions — Sheet/弹窗底部按钮组（对齐 PC）
 */
import { ReactNode } from "react";
import { View } from "@tarojs/components";
import "./index.scss";

export interface FooterActionsProps {
  children: ReactNode;
  align?: "end" | "stretch" | "start";
  className?: string;
}

export function FooterActions({
  children,
  align = "stretch",
  className = "",
}: FooterActionsProps) {
  const cls = [
    "ui-footer-actions",
    `ui-footer-actions--${align}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <View className={cls}>{children}</View>;
}

export default FooterActions;
