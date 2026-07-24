/**
 * SheetHeader — 抽屉/半屏标题栏
 */
import { View, Text } from "@tarojs/components";
import Icon, { ICON_COLOR } from "../Icon";
import "./index.scss";
import { ACTION_CLOSE } from "../../utils/actionCopy";
import { FORM_BACK } from "../../utils/formCopy";
import {
  buildSheetHeaderClassName,
  buildSheetHeaderSideClassName,
} from "../../utils/sheetHeader";

interface SheetHeaderProps {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  /** @deprecated 使用内置 Icon，保留以兼容旧调用 */
  backIcon?: string;
  /** @deprecated 使用内置 Icon，保留以兼容旧调用 */
  closeIcon?: string;
  className?: string;
}

export function SheetHeader({
  title,
  onClose,
  onBack,
  className = "",
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
    <View className={buildSheetHeaderClassName({ className })}>
      <View className={buildSheetHeaderSideClassName({ side: "left" })}>
        {onBack ? (
          <View className="sheet-header__icon" onClick={handleBack} aria-label={FORM_BACK}>
            <Icon name="back" size={36} color={ICON_COLOR.muted} />
          </View>
        ) : null}
      </View>

      <Text className="sheet-header__title" numberOfLines={1}>
        {title}
      </Text>

      <View className={buildSheetHeaderSideClassName({ side: "right" })}>
        <View className="sheet-header__icon" onClick={handleClose} aria-label={ACTION_CLOSE}>
          <Icon name="close" size={36} color={ICON_COLOR.muted} />
        </View>
      </View>
    </View>
  );
}

export default SheetHeader;
