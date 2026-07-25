/**
 * Input / SearchInput / NumberInput — 输入框家族（对齐 PC Input）
 * 适配：原生 input → Taro Input；onChange(e) → onChange(value:string)；
 *       去掉 ref.focus()（小程序不支持命令式 focus）
 */
import { ReactNode, useState } from "react";
import { View, Text, Input as TaroInput } from "@tarojs/components";
import "./index.scss";
import Icon, { ICON_COLOR } from "../../Icon";
import { ACTION_SEARCH } from "../../../utils/actionCopy"
import {
  shouldShowInputClear,
  buildInputWrapClassName,
  buildInputClassName,
  buildSearchInputClassName,
} from "../../../utils/inputHelpers";

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
  const showClear = shouldShowInputClear(allowClear, value, disabled);

  return (
    <View className={buildInputWrapClassName({ error: !!error, className: wrapperClassName, mode: "bem" })}>
      {label ? (
        <Text className="ui-input__label">
          {required ? <Text className="ui-input__required">*</Text> : null}
          {label}
        </Text>
      ) : null}
      <View className={buildInputClassName({ focused, disabled, className, mode: "bem" })}>
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
            <Icon name="close" size={28} color={ICON_COLOR.muted} className="ui-input__clear-icon" />
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

export function SearchInput({ value, onChange, placeholder = ACTION_SEARCH, className = "" }: SearchInputProps) {
  return (
    <Input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Text className="ui-input__search-icon">🔍</Text>}
      allowClear
      className={buildSearchInputClassName({ className })}
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
    <View className={buildInputWrapClassName({ number: true, className: wrapperClassName, mode: "bem" })}>
      <Input
        {...rest}
        type="digit"
        icon={prefix ? <Text className="ui-input__prefix">{prefix}</Text> : rest.icon}
      />
      {suffix ? <Text className="ui-input__suffix">{suffix}</Text> : null}
    </View>
  );
}
