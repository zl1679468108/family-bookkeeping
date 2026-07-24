/**
 * List / ListItem — 通用列表（小程序新增，PC 用表格/卡片行）
 * 用途：设置菜单、交易列表、成员列表
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";
import Icon, { ICON_COLOR } from "../../Icon";
import {
  buildListClassName,
  buildListItemClassName,
} from "../../../utils/list";

export interface ListItemProps {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  onClick?: () => void;
  showArrow?: boolean;
  divider?: boolean;
  className?: string;
}

export function ListItem({
  icon, title, description, extra, onClick,
  showArrow = false, divider = true, className = "",
}: ListItemProps) {
  const clickable = !!onClick;
  return (
    <View
      className={buildListItemClassName({ divider, clickable, className })}
      hoverClass={clickable ? "ui-list-item--pressed" : ""}
      hoverStayTime={80}
      onClick={onClick}
    >
      {icon ? <View className="ui-list-item__icon">{icon}</View> : null}
      <View className="ui-list-item__main">
        {title ? <Text className="ui-list-item__title">{title}</Text> : null}
        {description ? <Text className="ui-list-item__desc">{description}</Text> : null}
      </View>
      {extra ? <View className="ui-list-item__extra">{extra}</View> : null}
      {showArrow ? <Icon name="chevron-right" size={28} color={ICON_COLOR.muted} className="ui-list-item__arrow" /> : null}
    </View>
  );
}

export interface ListProps {
  children?: ReactNode;
  inset?: boolean;
  className?: string;
}

export function List({ children, inset = false, className = "" }: ListProps) {
  return (
    <View className={buildListClassName({ inset, className })}>
      {children}
    </View>
  );
}
