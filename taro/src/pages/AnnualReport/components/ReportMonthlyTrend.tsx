/**
 * ReportMonthlyTrend — 月度趋势
 */
import { View, Text } from "@tarojs/components";
import "./ReportMonthlyTrend.scss";

interface MonthlyData {
  month: number;
  income: number;
  expense: number;
}

interface TrendProps {
  monthlyData: MonthlyData[];
}

export default function ReportMonthlyTrend({ monthlyData }: TrendProps) {
  const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  const maxValue = Math.max(
    ...monthlyData.map((d) => Math.max(d.income, d.expense)),
    1
  );

  const getBarHeight = (value: number) => {
    return (value / maxValue) * 120 + 10;
  };

  return (
    <View className="report-section report-trend">
      <Text className="report-section__title">月度趋势</Text>
      <View className="trend-legend">
        <View className="trend-legend__item">
          <View className="trend-legend__dot trend-legend__dot--income" />
          <Text className="trend-legend__text">收入</Text>
        </View>
        <View className="trend-legend__item">
          <View className="trend-legend__dot trend-legend__dot--expense" />
          <Text className="trend-legend__text">支出</Text>
        </View>
      </View>
      <View className="trend-chart">
        <View className="trend-bars">
          {monthlyData.map((d, idx) => (
            <View key={d.month} className="trend-bar-group">
              <View className="trend-bars-inner">
                <View
                  className="trend-bar trend-bar--income"
                  style={{ height: `${getBarHeight(d.income)}rpx` }}
                />
                <View
                  className="trend-bar trend-bar--expense"
                  style={{ height: `${getBarHeight(d.expense)}rpx` }}
                />
              </View>
              <Text className="trend-month">{months[idx]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
