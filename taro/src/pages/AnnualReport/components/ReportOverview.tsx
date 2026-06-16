/**
 * ReportOverview — 年度总览
 */
import { View, Text } from "@tarojs/components";
import "./ReportOverview.scss";

interface OverviewProps {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  transactionCount: number;
}

export default function ReportOverview({
  totalIncome,
  totalExpense,
  netSavings,
  transactionCount,
}: OverviewProps) {
  const fmt = (n: number) => {
    if (n >= 10000) return (n / 10000).toFixed(1) + "万";
    return n.toFixed(2);
  };

  return (
    <View className="report-section report-overview">
      <Text className="report-section__title">年度总览</Text>
      <View className="overview-cards">
        <View className="overview-card overview-card--income">
          <Text className="overview-card__label">总收入</Text>
          <Text className="overview-card__value overview-card__value--income">
            ¥{fmt(totalIncome)}
          </Text>
          <View className="overview-card__icon">📈</View>
        </View>
        <View className="overview-card overview-card--expense">
          <Text className="overview-card__label">总支出</Text>
          <Text className="overview-card__value overview-card__value--expense">
            ¥{fmt(totalExpense)}
          </Text>
          <View className="overview-card__icon">📉</View>
        </View>
        <View className="overview-card overview-card--savings">
          <Text className="overview-card__label">结余</Text>
          <Text className={`overview-card__value overview-card__value--${netSavings >= 0 ? 'income' : 'expense'}`}>
            ¥{fmt(Math.abs(netSavings))}
          </Text>
          <View className="overview-card__icon">{netSavings >= 0 ? '💰' : '⚠️'}</View>
        </View>
        <View className="overview-card overview-card--count">
          <Text className="overview-card__label">记账笔数</Text>
          <Text className="overview-card__value">
            {transactionCount}
          </Text>
          <View className="overview-card__icon">📝</View>
        </View>
      </View>
    </View>
  );
}
