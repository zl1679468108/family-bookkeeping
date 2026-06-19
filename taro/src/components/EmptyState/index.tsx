/**
 * EmptyState — placeholder for empty lists / error screens.
 * Supports 'empty' and 'error' modes.
 */
import { View, Text } from "@tarojs/components";
import Icon, { IconName } from "../Icon";

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  mode?: "empty" | "error";
}

export default function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  mode = "empty",
}: EmptyStateProps) {
  const isError = mode === "error";
  const displayIcon = icon ?? (isError ? "close" : "note");
  const isIconName = ["note", "close", "book", "budget", "calendar", "map", "transactions", "statistics", "profile", "home"].includes(displayIcon);

  return (
    <View className="empty-state flex flex-col items-center justify-center py-6 px-4">
      <View className="empty-state-icon mb-4">
        {isIconName ? (
          <Icon name={displayIcon as IconName} size={48} />
        ) : (
          <Text className="empty-state-icon-text">{displayIcon}</Text>
        )}
      </View>
      <Text
        className={`empty-state-title text-base font-semibold mb-2 text-center ${isError ? "text-danger" : "text-secondary"}`}
      >
        {title}
      </Text>
      {description ? (
        <Text className="empty-state-desc text-sm text-hint text-center mb-4 px-2">
          {description}
        </Text>
      ) : null}
      {actionText && onAction ? (
        <View
          className={`empty-state-action ${isError ? "btn-secondary" : "btn-primary"}`}
          onClick={onAction}
        >
          <Text>{actionText}</Text>
        </View>
      ) : null}
    </View>
  );
}
