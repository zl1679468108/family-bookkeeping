/**
 * MenuList — 设置/个人页菜单分组。
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import Icon, { IconName } from "../../Icon";
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
    <View className={`menu-list ${className}`}>
      {items.map((item) => (
        <View
          key={item.key || item.label}
          className={`menu-list__item ${item.danger ? "menu-list__item--danger" : ""}`}
          onClick={item.onClick}
        >
          {item.icon ? (
            <View className="menu-list__icon">
              <Icon name={item.icon} size={40} />
            </View>
          ) : null}
          <Text className="menu-list__label">{item.label}</Text>
          <View className="menu-list__right">
            {item.right || <Text className="menu-list__arrow">›</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}
