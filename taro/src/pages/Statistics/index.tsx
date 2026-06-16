/**
 * Statistics — 报表页（1:1 严格按设计稿）
 * 结构:
 *   .section-card — 月度收支趋势（chart-bars / chart-col / chart-pair / chart-bar.out/.in）
 *   .stat-split — 总收入 / 总支出
 */
import { useState, useMemo, useEffect } from "react";
import { View, Text } from "@tarojs/components";
import PageLayout from "../../components/PageLayout";
import { fetchSummary, fetchMonthlyTrend } from "../../services/statisticsApi";
import { fmtAmount } from "../../utils/format";
import "./index.scss";

type BarData = { label: string; income: number; expense: number };

const MONTHS = 6;

function buildBars(incomes: any[], expenses: any[]): BarData[] {
  const now = new Date();
  const result: BarData[] = [];
  for (let i = MONTHS - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const inc = (incomes || []).find((r) => r.month === key);
    const exp = (expenses || []).find((r) => r.month === key);
    result.push({
      label: `${d.getMonth() + 1}月`,
      income: (inc?.total_income as number) || inc?.amount || 0,
      expense: (exp?.total_expense as number) || exp?.amount || 0,
    });
  }
  return result;
}

export default function Statistics() {
  const [summary, setSummary] = useState<any>(null);
  const [bars, setBars] = useState<BarData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const startDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const endDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    return Promise.all([
      fetchSummary({ startDate, endDate }).then((s: any) => setSummary(s)).catch(() => {}),
      fetchMonthlyTrend({ months: MONTHS, type: "income" })
        .then((res: any) => res)
        .catch(() => []),
      fetchMonthlyTrend({ months: MONTHS, type: "expense" })
        .then((res: any) => res)
        .catch(() => []),
    ])
      .then(([, inc, exp]) => setBars(buildBars(inc, exp)))
      .catch(() => setBars([]));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () =>
    new Promise<void>((resolve) => {
      setRefreshing(true);
      loadData()
        .catch(() => {})
        .finally(() => {
          setRefreshing(false);
          resolve();
        });
    });

  const income = summary?.totalIncome ?? 0;
  const expense = summary?.totalExpense ?? 0;

  const max = useMemo(() => {
    const m = Math.max(
      ...bars.map((b) => Math.max(b.income, b.expense)),
      1,
    );
    return m;
  }, [bars]);

  return (
    <PageLayout
      contentClassName="stats-content"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      {/* ===== 月度收支趋势 ===== */}
      <View className="section-card">
        <View className="section-header">
          <Text className="section-title">月度收支趋势</Text>
        </View>

        <View className="chart-area">
          <View className="chart-bars">
            {bars.map((b) => (
              <View key={b.label} className="chart-col">
                <View className="chart-pair">
                  <View
                    className="chart-bar out"
                    style={{ height: `${Math.max((b.expense / max) * 100, 2)}%` }}
                  />
                  <View
                    className="chart-bar in"
                    style={{ height: `${Math.max((b.income / max) * 100, 2)}%` }}
                  />
                </View>
                <Text className="chart-lbl">{b.label}</Text>
              </View>
            ))}
          </View>

          <View className="chart-legend">
            <Text className="legend-item">
              <Text className="dot out" />
              支出
            </Text>
            <Text className="legend-item">
              <Text className="dot in" />
              收入
            </Text>
          </View>
        </View>
      </View>

      {/* ===== 收入 / 支出 ===== */}
      <View className="stat-split">
        <View className="stat-card">
          <Text className="stat-label">总收入</Text>
          <Text className="stat-value income-value">¥{fmtAmount(income)}</Text>
        </View>
        <View className="stat-card">
          <Text className="stat-label">总支出</Text>
          <Text className="stat-value expense-value">¥{fmtAmount(expense)}</Text>
        </View>
      </View>
    </PageLayout>
  );
}
