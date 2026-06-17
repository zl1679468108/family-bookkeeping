/**
 * ReportCategoryRank — 分类排行
 */
import { View, Text } from "@tarojs/components";
import { renderCategoryIcon } from "../../../utils/renderCategoryIcon";
import "./ReportCategoryRank.scss";

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  amount: number;
  count: number;
  percentage: number;
}

interface CategoryRankProps {
  expenseCategories: CategoryData[];
  incomeCategories: CategoryData[];
}

export default function ReportCategoryRank({
  expenseCategories,
  incomeCategories,
}: CategoryRankProps) {
  const fmtAmount = (n: number) => {
    if (n >= 10000) return (n / 10000).toFixed(1) + "万";
    return n.toFixed(2);
  };

  const renderCategoryList = (categories: CategoryData[], type: "expense" | "income") => (
    <View className="cat-rank">
      {categories.length === 0 ? (
        <View className="cat-rank__empty">
          <Text className="cat-rank__empty-text">暂无数据</Text>
        </View>
      ) : (
        categories.slice(0, 5).map((cat, idx) => (
          <View key={cat.id} className="cat-rank__item">
            <View className="cat-rank__rank cat-rank__rank--top">
              {idx + 1}
            </View>
            <View className="cat-rank__icon-wrap">{renderCategoryIcon(cat.icon, { size: 40, className: "cat-rank__icon" })}</View>
            <View className="cat-rank__info">
              <Text className="cat-rank__name">{cat.name}</Text>
              <View className="cat-rank__bar">
                <View
                  className={`cat-rank__bar-fill ${type === 'income' ? 'cat-rank__bar-fill--income' : ''}`}
                  style={{ width: `${cat.percentage}%` }}
                />
              </View>
            </View>
            <View className="cat-rank__stats">
              <Text className={`cat-rank__amount ${type === 'income' ? 'cat-rank__amount--income' : ''}`}>
                ¥{fmtAmount(cat.amount)}
              </Text>
              <Text className="cat-rank__count">{cat.count}笔</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View className="report-section report-cat-rank">
      <Text className="report-section__title">支出分类排行</Text>
      {renderCategoryList(expenseCategories, "expense")}

      <Text className="report-section__title" style={{ marginTop: "40rpx" }}>
        收入分类排行
      </Text>
      {renderCategoryList(incomeCategories, "income")}
    </View>
  );
}
