/**
 * ConfirmDialog — 通用确认弹窗
 * 固定全屏遮罩 + 居中卡片 + 标题/描述 + 取消/确认（统一 ui/Button）
 */
import { View, Text } from "@tarojs/components";
import { Button } from "../ui/Button";
import { FooterActions } from "../ui/FooterActions";
import "./index.scss";
import { ACTION_PROCESSING, ACTION_CANCEL, ACTION_CONFIRM } from "../../utils/actionCopy"

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
  confirmText = ACTION_CONFIRM,
  cancelText = ACTION_CANCEL,
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
        <FooterActions align="stretch" className="cd-actions">
          <Button variant="default" size="lg" block onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="lg"
            block
            loading={confirmLoading}
            onClick={onConfirm}
          >
            {confirmLoading ? ACTION_PROCESSING : confirmText}
          </Button>
        </FooterActions>
      </View>
    </View>
  );
}
