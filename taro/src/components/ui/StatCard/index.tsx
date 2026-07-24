/**
 * StatCard — 统计卡片（对齐 PC StatCard）
 * variant: default/income/expense/hero（hero 用主色渐变 + 白字）
 */
import { ReactNode } from "react";
import {
  buildStatCardClassName,
  type StatCardVariant,
} from "../../../utils/statCard";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export type { StatCardVariant };

export interface StatCardProps {
  label?: ReactNode;
  value?: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  variant?: StatCardVariant;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label, value, sub, icon,
  variant = "default", className = "", onClick,
}: StatCardProps) {
  return (
    <View
      className={buildStatCardClassName({ variant, className, mode: "bem" })}
      hoverClass={onClick ? "ui-stat--pressed" : ""}
      hoverStayTime={100}
      onClick={onClick}
    >
      {label ? <Text className="ui-stat__label">{label}</Text> : null}
      {value ? <Text className="ui-stat__value">{value}</Text> : null}
      {sub ? <Text className="ui-stat__sub">{sub}</Text> : null}
      {icon ? <View className="ui-stat__icon">{icon}</View> : null}
    </View>
  );
}

export default StatCard;
