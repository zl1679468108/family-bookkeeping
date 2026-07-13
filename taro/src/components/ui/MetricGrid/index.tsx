/**
 * MetricGrid — 统计指标栅格。
 */
import { View, Text } from "@tarojs/components";
import "./index.scss";

export interface MetricItem {
  label: string;
  value: string;
  tone?: "default" | "income" | "expense" | "accent";
  meta?: string;
}

interface MetricGridProps {
  items: MetricItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export default function MetricGrid({
  items,
  columns = 2,
  className = "",
}: MetricGridProps) {
  return (
    <View className={`metric-grid metric-grid--${columns} ${className}`}>
      {items.map((item) => (
        <View key={item.label} className={`metric-card metric-card--${item.tone || "default"}`}>
          <Text className="metric-card__label">{item.label}</Text>
          <Text className="metric-card__value">{item.value}</Text>
          {item.meta ? <Text className="metric-card__meta">{item.meta}</Text> : null}
        </View>
      ))}
    </View>
  );
}
