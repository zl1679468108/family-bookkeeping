/**
 * FieldRow — 通用字段行组件
 * 左侧：标签 + 可选 * 必填标记
 * 右侧：值 / 占位 / 输入框
 * 变体: row (展示值), input (输入框), picker (点击选择器)
 */
import { ReactNode } from "react";
import { View, Text, Input } from "@tarojs/components";
import "./index.scss";
import { FORM_SELECT_PLACEHOLDER } from "../../../utils/formCopy";
import { fieldDisplayText, hasFieldText } from "../../../utils/inputHelpers";
import { cx } from "../../../utils/cx";
import Icon, { ICON_COLOR } from "../../Icon";

export interface FieldRowProps {
  label: string;
  required?: boolean;
  variant?: "row" | "input" | "picker";
  /** row variant */
  value?: string;
  placeholder?: string;
  /** row variant 点击事件 */
  onClick?: () => void;
  /** input variant */
  inputValue?: string;
  inputPlaceholder?: string;
  onInput?: (v: string) => void;
  inputMaxlength?: number;
  /** picker variant 中嵌套内部 */
  children?: ReactNode;
}

export default function FieldRow({
  label,
  required = false,
  variant = "picker",
  value,
  placeholder = FORM_SELECT_PLACEHOLDER,
  onClick,
  inputValue,
  inputPlaceholder,
  onInput,
  inputMaxlength,
  children,
}: FieldRowProps) {
  const labelEl = (
    <View className="ft-field-left">
      <Text className="ft-field-label">
        {label}
        {required && <Text className="ft-field-required"> *</Text>}
      </Text>
    </View>
  );

  // variant: picker — 包装 children（外部 Picker）或简单行
  if (variant === "picker" && children) {
    return (
      <View className="ft-field">
        {labelEl}
        {children}
      </View>
    );
  }

  // variant: input — 输入框
  if (variant === "input") {
    return (
      <View className="ft-field">
        {labelEl}
        <Input
          className="ft-field-input"
          placeholder={inputPlaceholder || placeholder}
          value={inputValue}
          onInput={(e: any) => onInput?.(e.detail.value)}
          maxlength={inputMaxlength}
        />
      </View>
    );
  }

  // variant: row — 展示 + 点击
  return (
    <View className="ft-field" onClick={onClick}>
      {labelEl}
      <View className="ft-field-right">
        <Text className={cx(hasFieldText(value) ? "ft-field-value" : "ft-field-placeholder")}>
          {fieldDisplayText(value, placeholder)}
        </Text>
        <Icon name="chevron-right" size={28} color={ICON_COLOR.muted} className="ft-field-arrow" />
      </View>
    </View>
  );
}