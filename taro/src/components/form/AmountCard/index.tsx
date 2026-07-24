/**
 * AmountCard — 大号金额输入卡片
 * 参考 PC 端 amt input：大号数字 + 货币符号
 */
import { View, Text, Input } from "@tarojs/components";
import { sanitizeAmountInput } from "../../../utils/budget";
import { FIELD_AMOUNT } from "../../../utils/fieldCopy";
import { FORM_AMOUNT_PLACEHOLDER } from "../../../utils/formCopy";
import { buildAmountCardClassName } from "../../../utils/formSection";
import "./index.scss";

export interface AmountCardProps {
  value: string;
  onChange: (v: string) => void;
}

export default function AmountCard({ value, onChange }: AmountCardProps) {
  return (
    <View className={buildAmountCardClassName()}>
      <Text className="ft-amt-label">{FIELD_AMOUNT}</Text>
      <View className="ft-amt-row">
        <Text className="ft-amt-symbol">¥</Text>
        <Input
          className="ft-amt-input"
          type="digit"
          placeholder={FORM_AMOUNT_PLACEHOLDER}
          value={value}
          onInput={(e: any) => {
            onChange(sanitizeAmountInput(e.detail.value as string));
          }}
        />
      </View>
    </View>
  );
}
