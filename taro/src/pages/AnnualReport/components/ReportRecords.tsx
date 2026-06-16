/**
 * ReportRecords — 记录之最
 */
import { View, Text } from "@tarojs/components";
import "./ReportRecords.scss";

interface RecordItem {
  label: string;
  value: string;
  icon: string;
  desc?: string;
}

interface RecordsProps {
  maxExpense: RecordItem;
  maxIncome: RecordItem;
  busiestMonth: RecordItem;
  mostUsedCategory: RecordItem;
}

export default function ReportRecords({
  maxExpense,
  maxIncome,
  busiestMonth,
  mostUsedCategory,
}: RecordsProps) {
  const records = [maxExpense, maxIncome, busiestMonth, mostUsedCategory];

  return (
    <View className="report-section report-records">
      <Text className="report-section__title">记录之最</Text>
      <View className="records-grid">
        {records.map((record, idx) => (
          <View key={idx} className="record-card">
            <View className="record-card__icon">{record.icon}</View>
            <Text className="record-card__label">{record.label}</Text>
            <Text className="record-card__value">{record.value}</Text>
            {record.desc && (
              <Text className="record-card__desc">{record.desc}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
