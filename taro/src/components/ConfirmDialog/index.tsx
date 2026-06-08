/**
 * ConfirmDialog — 通用确认弹窗
 * 固定全屏遮罩 + 居中白色卡片 + 标题/描述 + 取消/确认按钮
 */
import { View, Text } from "@tarojs/components";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
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
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!visible) return null;

  return (
    <View
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(44,36,22,0.35)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "fadeIn 0.25s ease",
      }}
      onClick={onCancel}
    >
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "28rpx",
          margin: "0 32rpx",
          padding: "40rpx",
          maxWidth: "600rpx",
          boxShadow:
            "0 16rpx 48rpx rgba(44,36,22,0.12), 0 4rpx 16rpx rgba(44,36,22,0.06)",
        }}
        onClick={(e: any) => e.stopPropagation()}
      >
        <Text
          style={{
            fontSize: "28rpx",
            fontWeight: 600,
            display: "block",
            marginBottom: "12rpx",
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: "24rpx",
            color: "var(--color-text-secondary)",
            display: "block",
            marginBottom: "32rpx",
          }}
        >
          {message}
        </Text>
        <View style={{ display: "flex", gap: "16rpx" }}>
          <View
            style={{
              flex: 1,
              padding: "16rpx 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "16rpx",
              border: "1px solid var(--color-border)",
            }}
            onClick={onCancel}
          >
            <Text
              style={{
                fontSize: "24rpx",
                color: "var(--color-text-secondary)",
              }}
            >
              {cancelText}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              padding: "16rpx 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "16rpx",
              backgroundColor: "var(--color-danger)",
              opacity: confirmLoading ? 0.6 : 1,
            }}
            onClick={confirmLoading ? undefined : onConfirm}
          >
            <Text
              style={{ color: "#FFFFFF", fontSize: "24rpx", fontWeight: 500 }}
            >
              {confirmLoading ? "处理中..." : confirmText}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
