/**
 * SegControl — 分段控制器（对齐 PC SegControl，泛型 <T extends string>）
 * size: sm/md；variant: default/pill
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export interface SegOption<T extends string> {
  value: T;
  label?: ReactNode;
  icon?: ReactNode;
}

export interface SegControlProps<T extends string> {
  options: SegOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  size?: "sm" | "md";
  variant?: "default" | "pill";
  className?: string;
}

export function SegControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  variant = "default",
  className = "",
}: SegControlProps<T>) {
  return (
    <View className={`ui-seg ui-seg--${size} ui-seg--${variant} ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <View
            key={opt.value}
            className={`ui-seg__item ${active ? "ui-seg__item--active" : ""}`}
            hoverClass={active ? "" : "ui-seg__item--pressed"}
            hoverStayTime={80}
            onClick={() => onChange?.(opt.value)}
          >
            {opt.icon ? <View className="ui-seg__icon">{opt.icon}</View> : null}
            {opt.label != null ? <Text className="ui-seg__label">{opt.label}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

export default SegControl;
