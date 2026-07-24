/**
 * GlobalModal — 模态弹窗（对齐 PC GlobalModal，三型）
 * - confirm: 居中卡片 + scaleIn（删除/危险确认）
 * - detail:  底部 sheet + slideUp（详情展示）
 * - modal:   底部 sheet + slideUp（表单/编辑）
 * 适配：ESC 关闭 → 蒙层点击关闭 + 显式关闭按钮
 */
import { ReactNode } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { useModalZIndex } from "./useModalZIndex";
import SheetHeader from "../../SheetHeader";
import { Button } from "../Button";
import "./index.scss";
import { ACTION_CONFIRM, ACTION_CANCEL } from '../../../utils/actionCopy'

export type GlobalModalType = "confirm" | "detail" | "modal";

export interface GlobalModalProps {
  open: boolean;
  onClose: () => void;
  type?: GlobalModalType;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  closable?: boolean;
  closeOnMask?: boolean;
  className?: string;
  bodyClassName?: string;
  /* confirm 专用 */
  confirmText?: string;
  cancelText?: string;
  confirmDanger?: boolean;
  loading?: boolean;
  onConfirm?: () => void;
}

export function GlobalModal({
  open,
  onClose,
  type = "modal",
  title,
  description,
  children,
  footer,
  size = "md",
  closable = true,
  closeOnMask = true,
  className = "",
  bodyClassName = "",
  confirmText = ACTION_CONFIRM,
  cancelText = ACTION_CANCEL,
  confirmDanger = false,
  loading = false,
  onConfirm,
}: GlobalModalProps) {
  const zType = type === "confirm" ? "critical" : type;
  const z = useModalZIndex(open, zType);

  if (!open) return null;

  const isConfirm = type === "confirm";

  const handleMaskClick = () => {
    if (closeOnMask) onClose();
  };

  return (
    <View
      className={`ui-modal ui-modal--${type} ${className}`}
      style={{ zIndex: z }}
      catchMove
    >
      <View className="ui-modal__mask" onClick={handleMaskClick} />

      {isConfirm ? (
        /* confirm: 居中卡片 */
        <View className={`ui-modal__dialog ui-modal__dialog--center ui-modal__dialog--${size}`}>
          <View className="ui-modal__confirm">
            {title ? <Text className="ui-modal__confirm-title">{title}</Text> : null}
            {description ? <Text className="ui-modal__confirm-desc">{description}</Text> : null}
            {children}
            <View className="ui-modal__confirm-actions">
              <Button variant="default" size="lg" block onClick={onClose}>
                {cancelText}
              </Button>
              <Button
                variant={confirmDanger ? "danger" : "primary"}
                size="lg"
                block
                loading={loading}
                onClick={() => { if (!loading) onConfirm?.(); }}
              >
                {confirmText}
              </Button>
            </View>
          </View>
        </View>
      ) : (
        /* detail / modal: 底部 sheet */
          <View className={`ui-modal__dialog ui-modal__dialog--sheet ui-modal__dialog--${size}`}>
            <View className="ui-modal__sheet">
              {title || closable ? (
                <SheetHeader
                  title={typeof title === "string" ? title : ""}
                  onClose={onClose}
                />
              ) : null}
              {description ? <Text className="ui-modal__desc">{description}</Text> : null}
            <ScrollView scrollY className={`ui-modal__body ${bodyClassName}`}>
              {children}
            </ScrollView>
            {footer ? <View className="ui-modal__footer">{footer}</View> : null}
          </View>
        </View>
      )}
    </View>
  );
}

export default GlobalModal;
