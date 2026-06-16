/**
 * ActionButtons — 底部操作按钮组
 * 主按钮（保存 / 确认添加 / 保存修改） + 次按钮（取消）
 */
import { View, Text } from "@tarojs/components";
import "./index.scss";

export interface ActionButtonsProps {
  primaryText?: string;
  secondaryText?: string;
  primaryLoading?: boolean;
  onPrimary: () => void;
  onSecondary: () => void;
}

export default function ActionButtons({
  primaryText = "确认添加",
  secondaryText = "取消",
  primaryLoading = false,
  onPrimary,
  onSecondary,
}: ActionButtonsProps) {
  return (
    <View className="ft-actions">
      <View
        className={`ft-btn ft-btn--primary ${primaryLoading ? "ft-btn--disabled" : ""}`}
        onClick={() => {
          if (!primaryLoading) onPrimary();
        }}
      >
        <Text className="ft-btn-text">
          {primaryLoading ? "保存中..." : primaryText}
        </Text>
      </View>
      <View className="ft-btn ft-btn--ghost" onClick={onSecondary}>
        <Text className="ft-btn-text ft-btn-text--ghost">{secondaryText}</Text>
      </View>
    </View>
  );
}
