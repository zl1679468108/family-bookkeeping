/**
 * Textarea — 文本域（对齐 PC Textarea）
 * 适配：onInput 取 e.detail.value；autoResize 用 Taro autoHeight
 */
import { ReactNode } from "react";
import { View, Text, Textarea as TaroTextarea } from "@tarojs/components";
import "./index.scss";

export interface TextareaProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: ReactNode;
  error?: string;
  allowClear?: boolean;
  showCount?: boolean;
  maxLength?: number;
  autoResize?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Textarea({
  value = "",
  onChange,
  placeholder,
  label,
  error,
  allowClear = false,
  showCount = false,
  maxLength,
  autoResize = true,
  required = false,
  disabled = false,
  className = "",
}: TextareaProps) {
  const showClear = allowClear && !!value && !disabled;
  return (
    <View className={`ui-textarea-wrap ${error ? "ui-textarea-wrap--error" : ""} ${className}`}>
      {label ? (
        <Text className="ui-textarea__label">
          {required ? <Text className="ui-textarea__required">*</Text> : null}
          {label}
        </Text>
      ) : null}
      <View className="ui-textarea">
        <TaroTextarea
          className="ui-textarea__field"
          value={value}
          placeholder={placeholder}
          placeholderClass="ui-textarea__placeholder"
          maxlength={maxLength || -1}
          disabled={disabled}
          autoHeight={autoResize}
          onInput={(e) => onChange?.(e.detail.value)}
        />
        {(showClear || (showCount && maxLength)) ? (
          <View className="ui-textarea__footer">
            {showCount && maxLength ? (
              <Text className="ui-textarea__count">{value.length}/{maxLength}</Text>
            ) : <Text />}
            {showClear ? (
              <Text className="ui-textarea__clear" onClick={() => onChange?.("")}>清空</Text>
            ) : null}
          </View>
        ) : null}
      </View>
      {error ? <Text className="ui-textarea__error">{error}</Text> : null}
    </View>
  );
}

export default Textarea;
