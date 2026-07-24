import { View, Text } from "@tarojs/components";
import "./index.scss";
import { buildProgressBarFillClassName } from "../../utils/progressBar";

interface ProgressBarProps {
  label: string;
  current: number;
  max: number;
  danger?: boolean;
  showLabel?: boolean;
}

export default function ProgressBar({
  label,
  current,
  max,
  danger = false,
  showLabel = true,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;

  return (
    <View className="progress-bar-wrapper">
      {showLabel && (
        <View className="progress-bar-header flex justify-between">
          <Text className="text-sm font-semibold">{label}</Text>
          <Text className="text-sm text-hint">
            ¥{current.toLocaleString()} / ¥{max.toLocaleString()}
          </Text>
        </View>
      )}
      <View className="progress-bar">
        <View
          className={buildProgressBarFillClassName({ danger })}
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
