/**
 * MenuList — 设置/个人页菜单分组。
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import Icon, { IconName, ICON_COLOR } from "../../Icon";
import {
  buildMenuListClassName,
  buildMenuListItemClassName,
} from "../../../utils/menuList";
import "./index.scss";

export interface MenuListItem {
  key?: string;
  label: string;
  icon?: IconName;
  right?: ReactNode;
  danger?: boolean;
  onClick?: () => void;
}

interface MenuListProps {
  items: MenuListItem[];
  className?: string;
}

export default function MenuList({ items, className = "" }: MenuListProps) {
  return (
    <View className={buildMenuListClassName({ className })}>
      {items.map((item) => (
        <View
          key={item.key || item.label}
          className={buildMenuListItemClassName({ danger: item.danger, className: "" })}
          onClick={item.onClick}
        >
          {item.icon ? (
            <View className="menu-list__icon">
              <Icon name={item.icon} size={48} color={item.danger ? ICON_COLOR.danger : ICON_COLOR.primary} />
            </View>
          ) : null}
          <Text className="menu-list__label">{item.label}</Text>
          <View className="menu-list__right">
            {item.right || <Icon name="chevron-right" size={28} color={ICON_COLOR.muted} className="menu-list__arrow" />}
          </View>
        </View>
      ))}
    </View>
  );
}
