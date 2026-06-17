/**
 * TransactionItem — single transaction row with swipe-to-delete.
 * v3.0: updated colors (expense=terracotta, income=sage green), flat style.
 */
import { useRef, useState, useCallback } from "react";
import { View, Text, Image } from "@tarojs/components";
import "./index.scss";

export interface TransactionItemProps {
  icon: string;
  categoryName: string;
  description?: string;
  brand?: string;
  amount: number;
  type: "income" | "expense";
  date?: string;
  onClick?: () => void;
  onDelete?: () => void;
  onLongPress?: () => void;
  hasImage?: boolean;
}

const SWIPE_THRESHOLD = 60;

export default function TransactionItem({
  icon,
  categoryName,
  description,
  brand,
  amount,
  type,
  date,
  onClick,
  onDelete,
  onLongPress,
  hasImage,
}: TransactionItemProps) {
  const [swiped, setSwiped] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swiping = useRef(false);

  const handleTouchStart = useCallback((e: any) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    swiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: any) => {
    if (!swiping.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && dx < -SWIPE_THRESHOLD) {
      setSwiped(true);
    } else if (dx > SWIPE_THRESHOLD) {
      setSwiped(false);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    swiping.current = false;
  }, []);

  const handleDelete = useCallback(
    (e: any) => {
      e.stopPropagation();
      onDelete?.();
      setSwiped(false);
    },
    [onDelete],
  );

  const isExpense = type === "expense";
  const amountStr = `${isExpense ? "-" : "+"}¥${amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}`;

  return (
    <View className="txi-wrapper">
      {/* Delete action behind */}
      {onDelete && (
        <View
          className={`txi-delete ${swiped ? "txi-delete--show" : ""}`}
          onClick={handleDelete}
        >
          <Text className="txi-delete-text">删除</Text>
        </View>
      )}

      {/* Main content */}
      <View
        className={`txi-main ${swiped ? "txi-main--swiped" : ""}`}
        onClick={() => {
          if (swiped) {
            setSwiped(false);
          } else {
            onClick?.();
          }
        }}
        onLongPress={() => onLongPress?.()}
        onTouchStart={onDelete ? handleTouchStart : undefined}
        onTouchMove={onDelete ? handleTouchMove : undefined}
        onTouchEnd={onDelete ? handleTouchEnd : undefined}
      >
        <View
          className={`txi-icon ${isExpense ? "txi-icon--expense" : "txi-icon--income"}`}
        >
          {icon && (icon.startsWith("http://") || icon.startsWith("https://")) ? (
            <Image className="txi-icon-img" src={icon} mode="aspectFit" />
          ) : (
            <Text className="txi-icon-text">{icon}</Text>
          )}
        </View>

        <View className="txi-body">
          <Text className="txi-name">{categoryName}</Text>
          <Text className="txi-meta">
            {description || ""}
            {description && brand ? " · " : ""}
            {brand || ""}
            {(description || brand) && date ? " · " : ""}
            {date || ""}
          </Text>
        </View>

        <View className="txi-right">
          <Text
            className={`txi-amount ${isExpense ? "txi-amount--expense" : "txi-amount--income"}`}
          >
            {amountStr}
          </Text>
          {hasImage && <Text className="txi-image-badge">📎</Text>}
        </View>
      </View>
    </View>
  );
}
