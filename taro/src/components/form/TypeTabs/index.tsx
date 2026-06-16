/**
 * TypeTabs — 支出 / 收入 类型切换
 * 参考 PC 端 form-tabs：双标签切换，激活态有背景色 + 阴影
 */
import { View, Text } from "@tarojs/components";
import "./index.scss";

export type TxnType = "expense" | "income";

export interface TypeTabsProps {
  value: TxnType;
  onChange: (v: TxnType) => void;
}

export default function TypeTabs({ value, onChange }: TypeTabsProps) {
  return (
    <View className="ft-tabs">
      <View
        className={`ft-tab ${value === "expense" ? "ft-tab--active ft-tab--expense" : ""}`}
        onClick={() => onChange("expense")}
      >
        <Text className="ft-tab-text">支出</Text>
      </View>
      <View
        className={`ft-tab ${value === "income" ? "ft-tab--active ft-tab--income" : ""}`}
        onClick={() => onChange("income")}
      >
        <Text className="ft-tab-text">收入</Text>
      </View>
    </View>
  );
}
