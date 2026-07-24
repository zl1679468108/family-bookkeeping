import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import Icon, { IconName } from "../../Icon";
import { buildFloatingActionClassName } from "../../../utils/floatingAction";
import "./index.scss";

interface FloatingActionProps {
  icon?: IconName;
  label?: string;
  children?: ReactNode;
  onClick: () => void;
  className?: string;
}

export default function FloatingAction({
  icon = "add",
  label,
  children,
  onClick,
  className = "",
}: FloatingActionProps) {
  return (
    <View className={buildFloatingActionClassName({ className })} onClick={onClick}>
      {children || <Icon name={icon} size={48} />}
      {label ? <Text className="floating-action__label">{label}</Text> : null}
    </View>
  );
}
