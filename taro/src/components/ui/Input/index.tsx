/**
 * Input / SearchInput / NumberInput — 输入框家族（对齐 PC Input）
 * 适配：原生 input → Taro Input；onChange(e) → onChange(value:string)；
 *       去掉 ref.focus()（小程序不支持命令式 focus）
 */
import { ReactNode, useState } from "react";
import { View, Text, Input as TaroInput } from "@tarojs/components";
import "./index.scss";

export interface BaseInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: ReactNode;
  error?: string;
  allowClear?: boolean;
  icon?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  wrapperClassName?: string;
}

export interface InputProps extends BaseInputProps {
  type?: "text" | "number" | "digit" | "password" | "nickname";
  password?: boolean;
  onFocus?: () => void;
  onBlur?: (value: string) => void;
}

export function Input({
  value,
  onChange,
  placeholder,
  label,
  error,
  allowClear = false,
  icon,
  required = false,
  disabled = false,
  maxLength,
  className = "",
  wrapperClassName = "",
  type = "text",
  password = false,
  onFocus,
  onBlur,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const showClear = allowClear && !!value && !disabled;

  return (
    <View className={`ui-input-wrap ${error ? "ui-input-wrap--error" : ""} ${wrapperClassName}`}>
      {label ? (
        <Text className="ui-input__label">
          {required ? <Text className="ui-input__required">*</Text> : null}
          {label}
        </Text>
      ) : null}
      <View className={`ui-input ${focused ? "ui-input--focus" : ""} ${disabled ? "ui-input--disabled" : ""} ${className}`}>
        {icon ? <View className="ui-input__icon">{icon}</View> : null}
        <TaroInput
          className="ui-input__field"
          type={type as any}
          password={password}
          value={value}
          placeholder={placeholder}
          placeholderClass="ui-input__placeholder"
          maxlength={maxLength}
          disabled={disabled}
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e.detail.value); }}
          onInput={(e) => onChange?.(e.detail.value)}
        />
        {showClear ? (
          <View className="ui-input__clear" onClick={() => onChange?.("")}>
            <Text className="ui-input__clear-icon">×</Text>
          </View>
        ) : null}
      </View>
      {error ? <Text className="ui-input__error">{error}</Text> : null}
    </View>
  );
}

export interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "搜索", className = "" }: SearchInputProps) {
  return (
    <Input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Text className="ui-input__search-icon">🔍</Text>}
      allowClear
      className={`ui-input--search ${className}`}
      wrapperClassName="ui-input-wrap--search"
    />
  );
}

export interface NumberInputProps extends BaseInputProps {
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export function NumberInput({
  prefix,
  suffix,
  wrapperClassName = "",
  ...rest
}: NumberInputProps) {
  /* 用 row 包装：Input 在左占主宽，suffix 在右侧（如"元"） */
  return (
    <View className={`ui-input-wrap ui-input-wrap--number ${wrapperClassName}`}>
      <Input
        {...rest}
        type="digit"
        icon={prefix ? <Text className="ui-input__prefix">{prefix}</Text> : rest.icon}
      />
      {suffix ? <Text className="ui-input__suffix">{suffix}</Text> : null}
    </View>
  );
}
