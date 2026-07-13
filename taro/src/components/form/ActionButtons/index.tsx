/**
 * ActionButtons — 底部操作按钮组
 * 主按钮（保存 / 确认添加 / 保存修改） + 次按钮（取消） + 危险按钮（删除，仅编辑模式）
 */
import { View, Text } from "@tarojs/components";
import "./index.scss";

export interface ActionButtonsProps {
  primaryText?: string;
  secondaryText?: string;
  primaryLoading?: boolean;
  onPrimary: () => void;
  onSecondary: () => void;
  /** 危险操作按钮文字，如 "删除此笔"。不传则不渲染。 */
  dangerText?: string;
  /** 危险按钮点击回调 */
  onDanger?: () => void;
}

export default function ActionButtons({
  primaryText = "确认添加",
  secondaryText = "取消",
  primaryLoading = false,
  onPrimary,
  onSecondary,
  dangerText,
  onDanger,
}: ActionButtonsProps) {
  return (
    <View className="ft-actions">
      {dangerText && onDanger && (
        <View className="ft-btn ft-btn--danger" onClick={onDanger}>
          <Text className="ft-btn-text ft-btn-text--danger">{dangerText}</Text>
        </View>
      )}
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
