/**
 * MetricGrid — 统计指标栅格。
 */
import { View, Text } from "@tarojs/components";
import {
  buildMetricGridClassName,
  buildMetricItemClassName,
  type MetricTone,
} from "../../../utils/metric";
import "./index.scss";

export type { MetricTone };

export interface MetricItem {
  label: string;
  value: string;
  tone?: MetricTone;
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
    <View className={buildMetricGridClassName({ columns, className })}>
      {items.map((item) => (
        <View
          key={item.label}
          className={buildMetricItemClassName({
            tone: item.tone,
            prefix: "metric-card",
          })}
        >
          <Text className="metric-card__label">{item.label}</Text>
          <Text className="metric-card__value">{item.value}</Text>
          {item.meta ? <Text className="metric-card__meta">{item.meta}</Text> : null}
        </View>
      ))}
    </View>
  );
}
