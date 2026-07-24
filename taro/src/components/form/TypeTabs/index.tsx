/**
 * TypeTabs — 支出 / 收入 类型切换
 * 选项文案同源 TRANSACTION_TYPE_OPTIONS，对齐 PC SegControl 数据
 */
import { View, Text } from "@tarojs/components";
import {
  TRANSACTION_TYPE_OPTIONS,
  type TransactionTypeCode,
} from "../../../utils/transactionType";
import { cx } from "../../../utils/cx";
import "./index.scss";

export type TxnType = TransactionTypeCode;

export interface TypeTabsProps {
  value: TxnType;
  onChange: (v: TxnType) => void;
}

export default function TypeTabs({ value, onChange }: TypeTabsProps) {
  return (
    <View className="ft-tabs">
      {TRANSACTION_TYPE_OPTIONS.map((opt) => {
        const active = value === opt.key;
        return (
          <View
            key={opt.key}
            className={cx(
              "ft-tab",
              active && "ft-tab--active",
              active && `ft-tab--${opt.key}`,
            )}
            onClick={() => onChange(opt.key)}
          >
            <Text className="ft-tab-text">{opt.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
