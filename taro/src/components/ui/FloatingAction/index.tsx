import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import Icon, { IconName } from "../../Icon";
import "./index.scss";

interface FloatingActionProps {
  icon?: IconName;
  label?: string;
  children?: ReactNode;
  onClick: () => void;
}

export default function FloatingAction({
  icon = "add",
  label,
  children,
  onClick,
}: FloatingActionProps) {
  return (
    <View className="floating-action" onClick={onClick}>
      {children || <Icon name={icon} size={38} />}
      {label ? <Text className="floating-action__label">{label}</Text> : null}
    </View>
  );
}
