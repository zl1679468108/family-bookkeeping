/**
 * SegControl — 分段控制器（对齐 PC SegControl，泛型 <T extends string>）
 * size: sm/md；variant: default/pill
 */
import { ReactNode } from "react";
import {
  buildSegControlClassName,
  type SegControlSize,
  type SegControlVariant,
} from "../../../utils/segControl";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export type { SegControlSize, SegControlVariant };

export interface SegOption<T extends string> {
  value: T;
  label?: ReactNode;
  icon?: ReactNode;
}

export interface SegControlProps<T extends string> {
  options: SegOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  size?: SegControlSize;
  variant?: SegControlVariant;
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
    <View
      className={buildSegControlClassName({
        size,
        variant,
        className,
        prefix: "ui-seg",
      })}
    >
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
