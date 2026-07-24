/**
 * IconGrid — 图标网格选择器（对齐 PC IconGrid）
 * 适配：document.createElement('input') 选文件 → Taro.chooseMedia；
 *       File → { tempFilePath, name, size }
 */
import { ReactNode } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import {
  ensurePrivacyAuthorize,
  isPrivacyError,
  openPrivacySetting,
} from "../../../utils/privacy";
import "./index.scss";
import { toastInfo } from "../../../utils/toast";
import Icon, { ICON_COLOR } from "../../Icon";
import { FORM_PRIVACY_REQUIRED } from "../../../utils/formCopy";
import { IMAGE_SELECT_FAILED_SHORT, PRIVACY_ALBUM_FOR_ICON } from "../../../utils/uploadCopy";
import { ACTION_UPLOAD } from "../../../utils/actionCopy";
import { cx } from "../../../utils/cx";
import {
  isIconOptionActive,
  isCustomIconActive,
  hasCustomIconSection,
  iconGridTemplateColumns,
} from "../../../utils/iconGrid";

export interface IconGridOption {
  value: string;
  icon: ReactNode;
  label?: string;
  isImage?: boolean;
}

export interface CustomIconItem {
  id: string;
  icon_url: string;
  icon_type: "category" | "book" | "avatar";
}

export interface IconGridProps {
  options: IconGridOption[];
  value?: string;
  onChange?: (value: string) => void;
  customIcons?: CustomIconItem[];
  onUpload?: (
    file: { tempFilePath: string; name?: string; size?: number },
    iconType: "category" | "book" | "avatar"
  ) => Promise<void>;
  onDelete?: (iconId: string) => Promise<void>;
  iconType?: "category" | "book" | "avatar";
  columns?: number;
  className?: string;
}

export function IconGrid({
  options, value, onChange,
  customIcons = [], onUpload, onDelete,
  iconType = "category", columns = 5, className = "",
}: IconGridProps) {
  const handleUpload = async () => {
    // 先触发微信隐私授权
    const ok = await ensurePrivacyAuthorize(PRIVACY_ALBUM_FOR_ICON);
    if (!ok) return;
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
      });
      const file = res.tempFiles?.[0];
      if (!file) return;
      await onUpload?.(
        { tempFilePath: file.tempFilePath, name: "icon", size: file.size },
        iconType
      );
    } catch (e: any) {
      const msg = e?.errMsg || e?.message || "";
      // 用户主动取消不提示
      if (msg.indexOf("cancel") !== -1) return;
      if (isPrivacyError(e)) {
        toastInfo(FORM_PRIVACY_REQUIRED);
        openPrivacySetting();
        return;
      }
      toastInfo(msg || IMAGE_SELECT_FAILED_SHORT);
    }
  };

  const colStyle = { gridTemplateColumns: iconGridTemplateColumns(columns) } as React.CSSProperties;

  return (
    <View className={cx("ui-icon-grid", className)}>
      <View className="ui-icon-grid__section" style={colStyle}>
        {options.map((opt) => {
          const active = isIconOptionActive(value, opt.value);
          return (
            <View
              key={opt.value}
              className={cx("ui-icon-grid__item", active && "ui-icon-grid__item--active", opt.label && "ui-icon-grid__item--labeled")}
              onClick={() => onChange?.(opt.value)}
            >
              {opt.isImage ? (
                <Image className="ui-icon-grid__img" src={String(opt.icon)} mode="aspectFit" />
              ) : (
                <Text className="ui-icon-grid__emoji">{opt.icon}</Text>
              )}
              {opt.label ? (
                <Text className="ui-icon-grid__label">{opt.label}</Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {hasCustomIconSection(Boolean(onUpload), customIcons.length) ? (
        <View className="ui-icon-grid__section ui-icon-grid__custom" style={colStyle}>
          {customIcons.map((c) => {
            const active = isCustomIconActive(value, c.id, c.icon_url);
            return (
              <View
                key={c.id}
                className={cx("ui-icon-grid__item", active && "ui-icon-grid__item--active")}
                onClick={() => onChange?.(c.icon_url)}
              >
                <Image className="ui-icon-grid__img" src={c.icon_url} mode="aspectFit" />
                {onDelete ? (
                  /* catchMove 阻止滚动穿透；删除按钮独立 onClick，不再调 onChange */
                  <View
                    className="ui-icon-grid__del"
                    catchMove
                    onClick={() => onDelete?.(c.id)}
                  >
                    <Icon name="close" size={24} color={ICON_COLOR.onPrimary} className="ui-icon-grid__del-icon" />
                  </View>
                ) : null}
              </View>
            );
          })}
          {onUpload ? (
            <View className="ui-icon-grid__item ui-icon-grid__upload" onClick={handleUpload}>
              <Text className="ui-icon-grid__upload-icon">+</Text>
              <Text className="ui-icon-grid__upload-text">{ACTION_UPLOAD}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default IconGrid;