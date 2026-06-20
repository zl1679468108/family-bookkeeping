/**
 * Switch — 开关（小程序新增，对齐视觉）
 */
import { View } from "@tarojs/components";
import "./index.scss";

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked = false, onChange, disabled = false, className = "" }: SwitchProps) {
  return (
    <View
      className={`ui-switch ${checked ? "ui-switch--on" : ""} ${disabled ? "ui-switch--disabled" : ""} ${className}`}
      onClick={() => {
        if (disabled) return;
        onChange?.(!checked);
      }}
    >
      <View className="ui-switch__thumb" />
    </View>
  );
}

export default Switch;
