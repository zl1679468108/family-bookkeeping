/**
 * EmptyState — placeholder for empty lists / error screens.
 * Supports 'empty' and 'error' modes.
 */
import { View, Text } from "@tarojs/components";

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  mode?: "empty" | "error";
}

const DEFAULT_ICON_EMPTY = "\uD83D\uDCDD";
const DEFAULT_ICON_ERROR = "\u26A0\uFE0F";

export default function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  mode = "empty",
}: EmptyStateProps) {
  const isError = mode === "error";
  const displayIcon =
    icon ?? (isError ? DEFAULT_ICON_ERROR : DEFAULT_ICON_EMPTY);

  return (
    <View className="empty-state flex flex-col items-center justify-center py-6 px-4">
      <Text className="empty-state-icon text-3xl mb-4">{displayIcon}</Text>
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
