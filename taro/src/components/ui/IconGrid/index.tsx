/**
 * IconGrid — 图标网格选择器（对齐 PC IconGrid）
 * 适配：document.createElement('input') 选文件 → Taro.chooseImage；
 *       File → { tempFilePath, name, size }
 */
import { ReactNode } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";

export interface IconGridOption {
  value: string;
  icon: ReactNode;
  label?: string;
  isImage?: boolean;
}

export interface CustomIconItem {
  id: string;
  icon_url: string;
  icon_type: "category" | "book";
}

export interface IconGridProps {
  options: IconGridOption[];
  value?: string;
  onChange?: (value: string) => void;
  customIcons?: CustomIconItem[];
  onUpload?: (
    file: { tempFilePath: string; name?: string; size?: number },
    iconType: "category" | "book"
  ) => Promise<void>;
  onDelete?: (iconId: string) => Promise<void>;
  iconType?: "category" | "book";
  columns?: number;
  className?: string;
}

export function IconGrid({
  options, value, onChange,
  customIcons = [], onUpload, onDelete,
  iconType = "category", columns = 5, className = "",
}: IconGridProps) {
  const handleUpload = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1, sourceType: ["album", "camera"] });
      const file = res.tempFiles?.[0];
      if (!file) return;
      await onUpload?.(
        { tempFilePath: file.path, name: "icon", size: file.size },
        iconType
      );
    } catch (e) {
      Taro.showToast({ title: "选择失败", icon: "none" });
    }
  };

  const colStyle = { gridTemplateColumns: `repeat(${columns}, 1fr)` } as React.CSSProperties;

  return (
    <View className={`ui-icon-grid ${className}`}>
      <View className="ui-icon-grid__section" style={colStyle}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <View
              key={opt.value}
              className={`ui-icon-grid__item ${active ? "ui-icon-grid__item--active" : ""}`}
              onClick={() => onChange?.(opt.value)}
            >
              {opt.isImage ? (
                <Image className="ui-icon-grid__img" src={String(opt.icon)} mode="aspectFit" />
              ) : (
                <Text className="ui-icon-grid__emoji">{opt.icon}</Text>
              )}
            </View>
          );
        })}
      </View>

      {customIcons.length > 0 || onUpload ? (
        <View className="ui-icon-grid__section ui-icon-grid__custom" style={colStyle}>
          {customIcons.map((c) => {
            const active = c.id === value;
            return (
              <View
                key={c.id}
                className={`ui-icon-grid__item ${active ? "ui-icon-grid__item--active" : ""}`}
                onClick={() => onChange?.(c.id)}
              >
                <Image className="ui-icon-grid__img" src={c.icon_url} mode="aspectFit" />
                {onDelete ? (
                  /* catchMove 阻止滚动穿透；删除按钮独立 onClick，不再调 onChange */
                  <View
                    className="ui-icon-grid__del"
                    catchMove
                    onClick={() => onDelete?.(c.id)}
                  >
                    <Text className="ui-icon-grid__del-icon">×</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
          {onUpload ? (
            <View className="ui-icon-grid__item ui-icon-grid__upload" onClick={handleUpload}>
              <Text className="ui-icon-grid__upload-icon">+</Text>
              <Text className="ui-icon-grid__upload-text">上传</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default IconGrid;
