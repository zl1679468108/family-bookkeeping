/**
 * ReportFunFact — 趣味彩蛋
 */
import { View, Text } from "@tarojs/components";
import "./ReportFunFact.scss";

interface FunFactProps {
  dailyAvg: number;
  topCategory: string;
  topCategoryIcon: string;
  totalDays: number;
  recordDays: number;
  savingsRate: number;
}

export default function ReportFunFact({
  dailyAvg,
  topCategory,
  topCategoryIcon,
  totalDays,
  recordDays,
  savingsRate,
}: FunFactProps) {
  const getFunFact = () => {
    if (recordDays === 0) {
      return "今年还没有开始记账哦，快来记录第一笔吧！";
    }
    if (savingsRate >= 50) {
      return "太厉害了！你的储蓄率超过50%，理财小能手实锤！💪";
    }
    if (savingsRate >= 30) {
      return "不错的理财表现！继续保持，财务自由离你越来越近！🌟";
    }
    if (savingsRate >= 0) {
      return "略有盈余，继续努力提升储蓄率吧！💪";
    }
    if (dailyAvg > 200) {
      return `每天平均花费 ${dailyAvg.toFixed(0)} 元，花钱小能手是你吗？🤔`;
    }
    return "收支平衡，继续保持良好的记账习惯！📝";
  };

  return (
    <View className="report-section report-funfact">
      <Text className="report-section__title">趣味数据</Text>
      <View className="funfact-card">
        <View className="funfact-emoji">🎉</View>
        <Text className="funfact-text">{getFunFact()}</Text>
      </View>
      <View className="funfact-stats">
        <View className="funfact-stat">
          <Text className="funfact-stat__value">{totalDays}</Text>
          <Text className="funfact-stat__label">年度总天数</Text>
        </View>
        <View className="funfact-stat">
          <Text className="funfact-stat__value">{recordDays}</Text>
          <Text className="funfact-stat__label">记账天数</Text>
        </View>
        <View className="funfact-stat">
          <Text className="funfact-stat__value">{savingsRate.toFixed(0)}%</Text>
          <Text className="funfact-stat__label">储蓄率</Text>
        </View>
      </View>
      <View className="funfact-top-cat">
        <Text className="funfact-top-cat__label">年度消费冠军</Text>
        <View className="funfact-top-cat__content">
          <Text className="funfact-top-cat__icon">{topCategoryIcon}</Text>
          <Text className="funfact-top-cat__name">{topCategory}</Text>
        </View>
      </View>
    </View>
  );
}
