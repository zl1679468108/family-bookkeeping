/**
 * Drawer — 底部半屏面板（对齐 PC Drawer，PC 右侧抽屉 → 小程序底部 sheet）
 * 职责：可滚动长内容操作面板（筛选/批量/向导），区别于 GlobalModal 的模态内容展示。
 */
import { ReactNode } from "react";
import { buildDrawerSheetClassName } from "../../../utils/drawer";
import { View, ScrollView } from "@tarojs/components";
import { useModalZIndex } from "../GlobalModal/useModalZIndex";
import SheetHeader from "../../SheetHeader";
import "./index.scss";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  closable?: boolean;
  closeOnMask?: boolean;
  className?: string;
  height?: string | number | "auto";
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  closable = true,
  closeOnMask = true,
  className = "",
  height = "auto",
}: DrawerProps) {
  const z = useModalZIndex(open, "modal");
  if (!open) return null;

  return (
    <View className={buildDrawerSheetClassName({ className })} style={{ zIndex: z }} catchMove>
      <View className="ui-drawer__mask" onClick={() => closeOnMask && onClose()} />
      <View
        className="ui-drawer__panel"
        style={height !== "auto" ? { height: typeof height === "number" ? `${height}rpx` : height } : undefined}
      >
        <View className="ui-drawer__handle" />
        {title || closable ? (
          <SheetHeader
            title={typeof title === "string" ? title : ""}
            onClose={onClose}
          />
        ) : null}
        <ScrollView scrollY className="ui-drawer__body">{children}</ScrollView>
        {footer ? <View className="ui-drawer__footer">{footer}</View> : null}
      </View>
    </View>
  );
}

export default Drawer;
