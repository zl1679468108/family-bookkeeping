/**
 * FooterActions — Sheet/弹窗底部按钮组（对齐 PC）
 */
import { ReactNode } from "react";
import {
  buildFooterActionsClassName,
  type FooterActionsAlign,
} from "../../../utils/footerActions";
import { View } from "@tarojs/components";
import "./index.scss";

export type { FooterActionsAlign };

export interface FooterActionsProps {
  children: ReactNode;
  align?: FooterActionsAlign;
  className?: string;
}

export function FooterActions({
  children,
  align = "stretch",
  className = "",
}: FooterActionsProps) {
  const cls = buildFooterActionsClassName({ align, className });
  return <View className={cls}>{children}</View>;
}

export default FooterActions;
