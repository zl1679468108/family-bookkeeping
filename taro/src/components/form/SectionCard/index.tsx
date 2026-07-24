/**
 * SectionCard — 分组卡片容器
 * 白色圆角卡片 + 内边距，承载字段行
 */
import { ReactNode } from "react";
import { View } from "@tarojs/components";
import "./index.scss";
import { buildFormSectionClassName } from "../../../utils/formSection";

export interface SectionCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export default function SectionCard({
  children,
  title,
  className = "",
}: SectionCardProps) {
  return (
    <View className={buildFormSectionClassName({ className })}>
      {title ? <View className="ft-section-title">{title}</View> : null}
      {children}
    </View>
  );
}
