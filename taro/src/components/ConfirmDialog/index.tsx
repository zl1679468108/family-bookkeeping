/**
 * ConfirmDialog — 通用确认弹窗
 * 固定全屏遮罩 + 居中白色卡片 + 标题/描述 + 取消/确认按钮
 */
import { View, Text } from "@tarojs/components";
import "./index.scss";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  confirmLoading = false,
  danger = true,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!visible) return null;

  return (
    <View className="cd-mask" onClick={onCancel}>
      <View className="cd-dialog" onClick={(e: any) => e.stopPropagation()}>
        <Text className="cd-title">{title}</Text>
        <Text className="cd-message">{message}</Text>
        <View className="cd-actions">
          <View className="cd-btn cd-btn--cancel" onClick={onCancel}>
            <Text className="cd-btn-text cd-btn-text--cancel">{cancelText}</Text>
          </View>
          <View
            className={`cd-btn ${danger ? "cd-btn--danger" : "cd-btn--primary"} ${confirmLoading ? "cd-btn--loading" : ""}`}
            onClick={() => {
              if (confirmLoading) return;
              onConfirm();
            }}
          >
            <Text className="cd-btn-text cd-btn-text--confirm">
              {confirmLoading ? "处理中..." : confirmText}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
