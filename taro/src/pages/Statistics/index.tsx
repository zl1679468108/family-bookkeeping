/**
 * Statistics — v4 严格按设计稿
 * 合并图表：收支趋势同图（颜色区分），分类占比分开显示
 */
import { useState, useMemo } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import SegmentedControl from "../../components/SegmentedControl";
import EmptyState from "../../components/EmptyState";
import PageLayout from "../../components/PageLayout";
import { useManualQuery } from "../../hooks/useManualQuery";
import {
  fetchCategoryBreakdown,
  fetchMonthlyTrend,
  fetchSummary,
} from "../../services/statisticsApi";
import "./index.scss";

/** 分类进度条颜色 — 严格按设计稿 */

/** 时间范围选项 */
const RANGES = [
  { label: "本月", months: 1 },
  { label: "近3月", months: 3 },
  { label: "近6月", months: 6 },
  { label: "近1年", months: 12 },
];

/** 根据 rangeIdx 计算 start/end 日期字符串 */
function calcRange(rangeIdx: number): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(now.getFullYear(), now.getMonth() - RANGES[rangeIdx].months + 1, 1);
  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Statistics() {
  const [rangeIdx, setRangeIdx] = useState(0);
  const { start, end } = useMemo(() => calcRange(rangeIdx), [rangeIdx]);

  /* ---- 汇总 ---- */
  const summaryKey = `stats-sum-${start}-${end}`;
  const { data: summary } = useManualQuery({
    key: summaryKey,
    queryFn: () => fetchSummary({ startDate: start, endDate: end }),
  });

  /* ---- 趋势数据（支出+收入） ---- */
  const trendKey = `stats-mt-${start}-${end}`;
  const { data: trendExpense = [], isLoading: eTrendLoading } = useManualQuery({
    key: `${trendKey}-expense`,
    queryFn: () =>
      fetchMonthlyTrend({
        months: RANGES[rangeIdx].months,
        endDate: end,
        type: "expense",
      }),
  });
  const { data: trendIncome = [], isLoading: iTrendLoading } = useManualQuery({
    key: `${trendKey}-income`,
    queryFn: () =>
      fetchMonthlyTrend({
        months: RANGES[rangeIdx].months,
        endDate: end,
        type: "income",
      }),
  });

  /* ---- 分类占比（支出+收入） ---- */
  const breakdownKey = `stats-cb-${start}-${end}`;
  const { data: expenseBreakdown = [], isLoading: eBreakLoading } = useManualQuery({
    key: `${breakdownKey}-expense`,
    queryFn: () =>
      fetchCategoryBreakdown({ startDate: start, endDate: end, type: "expense" }),
  });
  const { data: incomeBreakdown = [], isLoading: iBreakLoading } = useManualQuery({
    key: `${breakdownKey}-income`,
    queryFn: () =>
      fetchCategoryBreakdown({ startDate: start, endDate: end, type: "income" }),
  });

  const expenseTotal = useMemo(
    () => expenseBreakdown.reduce((s, i) => s + i.amount, 0),
    [expenseBreakdown],
  );
  const incomeTotal = useMemo(
    () => incomeBreakdown.reduce((s, i) => s + i.amount, 0),
    [incomeBreakdown],
  );

  const maxT = useMemo(
    () => Math.max(
      ...trendExpense.map((d) => d.amount),
      ...trendIncome.map((d) => d.amount),
      1
    ),
    [trendExpense, trendIncome],
  );

  const isLoading = eTrendLoading || iTrendLoading || eBreakLoading || iBreakLoading;

  /* ---- 分类点击跳转流水页 ---- */
  const handleCategoryClick = (catId: string, type: "expense" | "income") => {
    Taro.navigateTo({
      url: `/pages/Transactions/index?category=${catId}&startDate=${start}&endDate=${end}&type=${type}`,
    });
  };

  return (
    <PageLayout title="统计" tabBar>
      {/* 时间范围分段 */}
      <View className="stats-range-wrap">
        <SegmentedControl
          options={RANGES.map((r) => r.label)}
          value={rangeIdx}
          onChange={setRangeIdx}
        />
      </View>

      <View className="stats-body">
        {/* ===== 统计概览 ===== */}
        <View className="stats-overview">
          <View className="stat-box">
            <Text className="stat-label">收入</Text>
            <Text className="stat-value income">
              ¥{((summary as any)?.totalIncome || 0).toLocaleString()}
            </Text>
            <View className="stat-change up">
              <Text className="stat-arrow">↑</Text>
              <Text className="stat-pct">12.3%</Text>
            </View>
          </View>
          <View className="stat-box">
            <Text className="stat-label">支出</Text>
            <Text className="stat-value expense">
              ¥{((summary as any)?.totalExpense || 0).toLocaleString()}
            </Text>
            <View className="stat-change down">
              <Text className="stat-arrow">↓</Text>
              <Text className="stat-pct">5.6%</Text>
            </View>
          </View>
          <View className="stat-box">
            <Text className="stat-label">结余</Text>
            <Text className="stat-value">
              ¥{(((summary as any)?.totalIncome || 0) - ((summary as any)?.totalExpense || 0)).toLocaleString()}
            </Text>
            <View className="stat-change neutral">
              <Text className="stat-pct">—</Text>
            </View>
          </View>
        </View>

        {/* ===== 收支趋势图：支出+收入同图，颜色区分 ===== */}
        <View className="chart-placeholder">
          {/* 图例 */}
          <View className="chart-legend">
            <Text className="chart-title">收支趋势</Text>
            <View className="legend-items">
              <View className="legend-item">
                <View className="legend-dot expense-dot" />
                <Text className="legend-text">支出</Text>
              </View>
              <View className="legend-item">
                <View className="legend-dot income-dot" />
                <Text className="legend-text">收入</Text>
              </View>
            </View>
          </View>

          {isLoading ? (
            <View className="skeleton" style={{ height: "200rpx" }} />
          ) : (trendExpense.length === 0 && trendIncome.length === 0) ? (
            <EmptyState title="暂无数据" />
          ) : (
            <>
              <View className="chart-area">
                {trendExpense.map((item, index) => {
                  const eBh = Math.max((item.amount / maxT) * 100, 2);
                  const iBh = trendIncome[index]
                    ? Math.max((trendIncome[index].amount / maxT) * 100, 2)
                    : 0;
                  return (
                    <View key={item.month} className="chart-bar-group">
                      <View
                        className="chart-bar expense-bar"
                        style={{ height: `${eBh}%` }}
                      />
                      <View
                        className="chart-bar income-bar"
                        style={{ height: `${iBh}%` }}
                      />
                    </View>
                  );
                })}
              </View>
              <View className="chart-labels">
                {trendExpense.map((item) => (
                  <Text key={item.month} className="chart-label">
                    {String(item.month).slice(5)}月
                  </Text>
                ))}
              </View>
            </>
          )}
        </View>

        {/* ===== 收支分类占比（合并为一个列表，颜色区分）===== */}
        <View className="card-padded">
          <View className="flex justify-between items-baseline mb-3">
            <Text className="text-md font-semibold">收支占比</Text>
            <Text className="text-sm text-hint">
              支出 ¥{expenseTotal.toLocaleString()} · 收入 ¥{incomeTotal.toLocaleString()}
            </Text>
          </View>

          {eBreakLoading || iBreakLoading ? (
            <View className="skeleton" style={{ height: "200rpx" }} />
          ) : (expenseBreakdown.length === 0 && incomeBreakdown.length === 0) ? (
            <EmptyState title="暂无数据" />
          ) : (
            /* 合并支出和收入分类，按金额排序 */
            [...expenseBreakdown.map(item => ({ ...item, sortType: 'expense' as const })),
             ...incomeBreakdown.map(item => ({ ...item, sortType: 'income' as const }))]
              .sort((a, b) => b.amount - a.amount)
              .map((item) => {
                const isExpense = item.sortType === 'expense';
                const total = isExpense ? expenseTotal : incomeTotal;
                const pct = total > 0 ? (item.amount / total) * 100 : 0;
                const col = isExpense ? 'var(--color-expense)' : 'var(--color-income)';
                return (
                  <View
                    key={`${item.sortType}-${item.category_id}`}
                    className="rank-item"
                    onClick={() => handleCategoryClick(item.category_id, item.sortType)}
                  >
                    <View className="rank-icon">
                      <Text style={{ fontSize: "28rpx" }}>
                        {item.category_icon || "📦"}
                      </Text>
                    </View>
                    <View className="rank-info">
                      <Text className="rank-name">
                        {item.category_name}
                      </Text>
                      <View className="rank-mini-bar">
                        <View
                          className="rank-fill"
                          style={{
                            width: `${Math.max(pct, 2)}%`,
                            backgroundColor: col,
                          }}
                        />
                      </View>
                    </View>
                    <View className="rank-amount">
                      <Text className={`rank-value ${isExpense ? 'expense-value' : 'income-value'}`}>
                        ¥{item.amount.toLocaleString()}
                      </Text>
                      <Text className="rank-pct">{pct.toFixed(0)}%</Text>
                    </View>
                  </View>
                );
              })
          )}
        </View>
      </View>
    </PageLayout>
  );
}
