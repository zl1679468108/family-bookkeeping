/**
 * Card / CardHeader / CardContent — 卡片容器（对齐 PC Card）
 * padding: sm(24rpx)/md(40rpx)/lg(56rpx)/none
 */
import { ReactNode } from "react";
import {
  buildCardClassName,
  buildCardHeaderClassName,
  buildCardContentClassName,
  type CardPadding,
} from "../../../utils/card";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export type { CardPadding };

export interface CardProps {
  padding?: CardPadding;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ padding = "md", children, className = "", onClick }: CardProps) {
  return (
    <View
      className={buildCardClassName({ padding, className, mode: "bem" })}
      hoverClass={onClick ? "ui-card--pressed" : ""}
      hoverStayTime={100}
      onClick={onClick}
    >
      {children}
    </View>
  );
}

export interface CardHeaderProps {
  title?: ReactNode;
  subTitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subTitle, action, className = "" }: CardHeaderProps) {
  return (
    <View className={buildCardHeaderClassName({ className, mode: "bem" })}>
      <View className="ui-card__header-text">
        {title ? <Text className="ui-card__title">{title}</Text> : null}
        {subTitle ? <Text className="ui-card__subtitle">{subTitle}</Text> : null}
      </View>
      {action ? <View className="ui-card__action">{action}</View> : null}
    </View>
  );
}

export function CardContent({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <View className={buildCardContentClassName({ className, mode: "bem" })}>{children}</View>;
}
