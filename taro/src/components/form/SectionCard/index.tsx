/**
 * SectionCard — 分组卡片容器
 * 白色圆角卡片 + 内边距，承载字段行
 */
import { ReactNode } from "react";
import { View } from "@tarojs/components";
import "./index.scss";

export interface SectionCardProps {
  children: ReactNode;
}

export default function SectionCard({ children }: SectionCardProps) {
  return <View className="ft-section">{children}</View>;
}
