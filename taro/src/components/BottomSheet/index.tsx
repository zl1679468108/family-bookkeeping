import { View, Text } from "@tarojs/components";
import { ReactNode } from "react";
import SheetHeader from "../SheetHeader";
import Spinner from "../ui/Spinner";
import "./index.scss";
import { ACTION_LOADING } from "../../utils/actionCopy";
import { buildBottomSheetBodyClassName } from "../../utils/bottomSheet";

export interface BottomSheetProps {
  /** 是否显示（可选：父组件通常用 {cond && <BottomSheet/>} 控制挂载，传 false 也可强制隐藏） */
  visible?: boolean;
  /** 标题（随模式同步切换） */
  title: string;
  /** 点击遮罩 / 关闭 icon 时触发 */
  onClose: () => void;
  /** 传入则返回 icon 显示，点击回到上一步 */
  onBack?: () => void;
  /** 整屏加载态：替换 body 为 Spinner */
  loading?: boolean;
  /** 加载态文案 */
  loadingText?: string;
  /** 底部操作区（带顶边 + 安全区），传 null 表示无操作区 */
  footer?: ReactNode | null;
  /** 内容区 */
  children?: ReactNode;
  /** 内容区额外类名（控制内边距等） */
  bodyClassName?: string;
  /** 自定义最高高度，默认 92vh */
  maxHeight?: string;
}

/**
 * 统一底部弹窗（Bottom Sheet）。
 * 封装：遮罩 + 滑入动画 + SheetHeader（左返回 icon / 中标题 / 右关闭 icon）+ 内容区 + 底部操作区 + 安全区。
 * 工作台各模块（账本 / 分类 / 模板 / 预算）的详情与表单弹窗统一复用，确保交互一致。
 */
export default function BottomSheet({
  visible,
  title,
  onClose,
  onBack,
  loading = false,
  loadingText = ACTION_LOADING,
  footer,
  children,
  bodyClassName,
  maxHeight = "92vh",
}: BottomSheetProps) {
  if (visible === false) return null;
  return (
    <View className="bs-mask" onClick={onClose}>
      <View
        className="bs-sheet"
        style={{ maxHeight }}
        onClick={(e: any) => e.stopPropagation()}
      >
        <SheetHeader title={title} onClose={onClose} onBack={onBack} />
        {loading ? (
          <View className="bs-sheet__loading">
            <Spinner />
            <Text className="bs-sheet__loading-text">{loadingText}</Text>
          </View>
        ) : (
          <View className={buildBottomSheetBodyClassName({ className: bodyClassName || "" })}>{children}</View>
        )}
        {footer !== null && footer !== undefined && (
          <View className="bs-sheet__footer">{footer}</View>
        )}
        <View className="bs-sheet__safe" />
      </View>
    </View>
  );
}
