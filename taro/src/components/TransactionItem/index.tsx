/**
 * TransactionItem — 交易条目（v4.0 重设计）
 * 布局: [图标] 分类名        金额
 *       描述 · [品牌]标签   日期
 * 使用 CSS 变量，支持滑动删除
 */
import { useRef, useState, useCallback } from "react";
import { View, Text, Image } from "@tarojs/components";
import "./index.scss";
import { ACTION_DELETE } from "../../utils/actionCopy";
import { FIELD_ATTACHMENT } from "../../utils/fieldCopy";
import {
  buildTxiAmountClassName,
  buildTxiIconClassName,
  buildTxiMainClassName,
  buildTxiDeleteClassName,
} from "../../utils/transactionDisplay";

export interface TransactionItemProps {
  icon: string;
  categoryName: string;
  description?: string;
  brand?: string;
  amount: number;
  type: "income" | "expense";
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
      {/* 滑动删除按钮 */}
      {onDelete && (
        <View
          className={buildTxiDeleteClassName({ show: swiped })}
          onClick={handleDelete}
        >
          <Text className="txi-delete-text">{ACTION_DELETE}</Text>
        </View>
      )}

      {/* 主内容区 */}
      <View
        className={buildTxiMainClassName({ swiped })}
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
        {/* 左侧：分类图标 */}
        <View className="txi-left">
          <View className={buildTxiIconClassName({ isExpense })}>
            {icon && (icon.startsWith("http://") || icon.startsWith("https://")) ? (
              <Image className="txi-icon-img" src={icon} mode="aspectFit" />
            ) : (
              <Text className="txi-icon-text">{icon}</Text>
            )}
          </View>
        </View>

        {/* 中间：信息 */}
        <View className="txi-body">
          <View className="txi-top-line">
            <Text className="txi-name">{categoryName}</Text>
            {brand && (
              <Text className="txi-brand-tag">{brand}</Text>
            )}
          </View>
          <View className="txi-bottom-line">
            {(description) && (
              <Text className="txi-desc">{description}</Text>
            )}
            {hasImage && (
              <Text className="txi-img-dot">·</Text>
            )}
            {hasImage && (
              <Text className="txi-img-hint">{FIELD_ATTACHMENT}</Text>
            )}
          </View>
        </View>

        {/* 右侧：金额 */}
        <View className="txi-right">
          <Text className={buildTxiAmountClassName({ isExpense })}>
            {amountStr}
          </Text>
        </View>
      </View>
    </View>
  );
}

