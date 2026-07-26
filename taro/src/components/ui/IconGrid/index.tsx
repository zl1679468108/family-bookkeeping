/**
 * IconGrid — 图标网格选择器（对齐 PC IconGrid）
 * 适配：document.createElement('input') 选文件 → Taro.chooseMedia；
 *       File → { tempFilePath, name, size }
 */
import { ReactNode, useRef } from "react";
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
import {
  isIconOptionActive,
  isCustomIconActive,
  hasCustomIconSection,
  iconGridTemplateColumns,
  buildIconGridRootClassName,
  buildIconGridItemClassName,
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
  // 上传/删除共用锁，避免连点重复调接口
  const busyRef = useRef(false);

  const handleUpload = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      // 先触发微信隐私授权
      const ok = await ensurePrivacyAuthorize(PRIVACY_ALBUM_FOR_ICON);
      if (!ok) return;
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
    } finally {
      busyRef.current = false;
    }
  };

  const handleDelete = async (iconId: string) => {
    if (busyRef.current || !onDelete) return;
    busyRef.current = true;
    try {
      await onDelete(iconId);
    } finally {
      busyRef.current = false;
    }
  };

  const colStyle = { gridTemplateColumns: iconGridTemplateColumns(columns) } as React.CSSProperties;

  return (
    <View className={buildIconGridRootClassName({ className, mode: "bem" })}>
      <View className="ui-icon-grid__section" style={colStyle}>
        {options.map((opt) => {
          const active = isIconOptionActive(value, opt.value);
          return (
            <View
              key={opt.value}
              className={buildIconGridItemClassName({ active, labeled: !!opt.label, mode: "bem" })}
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
                className={buildIconGridItemClassName({ active, mode: "bem" })}
                onClick={() => onChange?.(c.icon_url)}
              >
                <Image className="ui-icon-grid__img" src={c.icon_url} mode="aspectFit" />
                {onDelete ? (
                  /* catchMove 阻止滚动穿透；删除按钮独立 onClick，不再调 onChange */
                  <View
                    className="ui-icon-grid__del"
                    catchMove
                    onClick={() => { void handleDelete(c.id); }}
                  >
                    <Icon name="close" size={24} color={ICON_COLOR.onPrimary} className="ui-icon-grid__del-icon" />
                  </View>
                ) : null}
              </View>
            );
          })}
          {onUpload ? (
            <View className={buildIconGridItemClassName({ upload: true, mode: "bem" })} onClick={handleUpload}>
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