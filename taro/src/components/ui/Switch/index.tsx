/**
 * Switch — 开关（小程序新增，对齐视觉）
 */
import { View } from "@tarojs/components";
import { buildSwitchClassName } from "../../../utils/switchControl";
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
      className={buildSwitchClassName({ checked, disabled, className })}
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
