/**
 * SheetHeader — 统一底部 Sheet / Picker 标题栏
 *
 * 规范：左返回 icon（无中文）/ 中标题 / 右关闭 icon
 * 左侧返回按钮仅在存在 onBack 时显示，否则占位保持标题居中。
 */
import { View, Text } from "@tarojs/components";
import Icon, { ICON_COLOR } from "../Icon";
import "./index.scss";

interface SheetHeaderProps {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  /** @deprecated 使用内置 Icon，保留以兼容旧调用 */
  backIcon?: string;
  /** @deprecated 使用内置 Icon，保留以兼容旧调用 */
  closeIcon?: string;
}

export function SheetHeader({
  title,
  onClose,
  onBack,
}: SheetHeaderProps) {
  const handleBack = (e: any) => {
    e.stopPropagation();
    onBack?.();
  };
  const handleClose = (e: any) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <View className="sheet-header">
      <View className="sheet-header__side sheet-header__side--left">
        {onBack ? (
          <View className="sheet-header__icon" onClick={handleBack} aria-label="返回">
            <Icon name="back" size={36} color={ICON_COLOR.muted} />
          </View>
        ) : null}
      </View>

      <Text className="sheet-header__title" numberOfLines={1}>
        {title}
      </Text>

      <View className="sheet-header__side sheet-header__side--right">
        <View className="sheet-header__icon" onClick={handleClose} aria-label={ACTION_CLOSE}>
          <Icon name="close" size={36} color={ICON_COLOR.muted} />
        </View>
      </View>
    </View>
  );
}

export default SheetHeader;
import { ACTION_CLOSE } from "../../utils/actionCopy";
