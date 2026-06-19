/**
 * Statistics — 报表页（增强版）
 * 结构:
 *   - 时间范围切换（本月/近3月/近6月/近1年/月对比/年对比）
 *   - 月度收支趋势图表
 *   - 分类占比饼图（支出/收入切换）
 *   - 成员对比 Tab（多成员账本）
 *   - 导出 Excel
 */
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageLayout from "../../components/PageLayout";
import { AppSection, MetricGrid, PageHero } from "../../components/ui";
import { fetchSummary, fetchMonthlyTrend, fetchCategoryBreakdown, fetchYearOverYear, fetchDailySummary, fetchMemberComparison } from "../../services/statisticsApi";
import { API_BASE_URL } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useBookContext } from "../../context/BookContext";
import { fmtAmount } from "../../utils/format";
import "./index.scss";

type BarData = { label: string; income: number; expense: number };
type PieData = { name: string; value: number; percentage: number; color: string };

enum PeriodType {
  Month = "month",
  ThreeMonth = "3month",
  SixMonth = "6month",
  Year = "year",
  MonthCompare = "monthCompare",
  YearCompare = "yearCompare",
}

const PERIOD_TABS = [
  { key: PeriodType.Month, label: "本月" },
  { key: PeriodType.ThreeMonth, label: "近3月" },
  { key: PeriodType.SixMonth, label: "近6月" },
  { key: PeriodType.Year, label: "近1年" },
  { key: PeriodType.MonthCompare, label: "月对比" },
  { key: PeriodType.YearCompare, label: "年对比" },
];

const CATEGORY_COLORS = [
  "#2d9d8a", "#45b7a7", "#6bc9bf", "#98d9ce", "#c7ebe6",
  "#e06055", "#f08079", "#f8a39c", "#fcc5bf", "#ffe5e2",
  "#f5a623", "#f8c057", "#fad88a", "#fce9b8", "#fff3dc",
];

export default function Statistics() {
  const { user, loading: authLoading } = useAuth();
  const { currentBook } = useBookContext();
  const [period, setPeriod] = useState<PeriodType>(PeriodType.Month);
  const [summary, setSummary] = useState<any>(null);
  const [bars, setBars] = useState<BarData[]>([]);
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [incomePieData, setIncomePieData] = useState<PieData[]>([]);
  const [memberData, setMemberData] = useState<any[]>([]);
  const [yoyData, setYoyData] = useState<any>(null);
  const [compareMonth, setCompareMonth] = useState("");
  const [compareYear, setCompareYear] = useState(new Date().getFullYear() - 1);
  const [refreshing, setRefreshing] = useState(false);
  const [viewTab, setViewTab] = useState(0);
  const [pieType, setPieType] = useState(0);

  // 关键：缓存 now 避免每次渲染都生成新 Date 对象导致 getDateRange 不稳定
  const now = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, [now]);
  const currentYear = useMemo(() => now.getFullYear(), [now]);

  const getDateRange = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    switch (period) {
      case PeriodType.Month:
        return { startDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, endDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, months: 1 };
      case PeriodType.ThreeMonth:
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        return { startDate: `${threeMonthsAgo.getFullYear()}-${pad(threeMonthsAgo.getMonth() + 1)}-01`, endDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, months: 3 };
      case PeriodType.SixMonth:
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        return { startDate: `${sixMonthsAgo.getFullYear()}-${pad(sixMonthsAgo.getMonth() + 1)}-01`, endDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, months: 6 };
      case PeriodType.Year:
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        return { startDate: `${yearAgo.getFullYear()}-${pad(yearAgo.getMonth() + 1)}-01`, endDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, months: 12 };
      case PeriodType.MonthCompare:
        const compareM = compareMonth || `${now.getFullYear()}-${pad(now.getMonth())}`;
        return { startDate: `${compareM}-01`, endDate: `${currentMonth}-${pad(now.getDate())}`, months: 2, compareMonth: compareM };
      case PeriodType.YearCompare:
        return { startDate: `${compareYear}-01-01`, endDate: `${currentYear}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, months: 12, compareYear };
      default:
        return { startDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, endDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, months: 1 };
    }
  }, [period, now, compareMonth, compareYear]);

  const loadData = useCallback(async (p: PeriodType, dr: { startDate: string; endDate: string; months: number; compareMonth?: string; compareYear?: number }) => {
    const { startDate, endDate, months, compareMonth: cm, compareYear: cy } = dr;
    
    try {
      if (p === PeriodType.YearCompare && cy) {
        const [expense, income] = await Promise.all([
          fetchYearOverYear({ year: currentYear, compareYear: cy, type: "expense" }),
          fetchYearOverYear({ year: currentYear, compareYear: cy, type: "income" }),
        ]);
        setYoyData({ expense, income });
        setBars([]);
      } else if (p === PeriodType.MonthCompare && cm) {
        const [current, compare] = await Promise.all([
          fetchDailySummary({ month: currentMonth }),
          fetchDailySummary({ month: cm }),
        ]);
        const currentTotal = current.reduce((sum, d) => sum + (d.total_expense || 0), 0);
        const compareTotal = compare.reduce((sum, d) => sum + (d.total_expense || 0), 0);
        setBars([
          { label: cm.split("-")[1] + "月", income: 0, expense: compareTotal },
          { label: currentMonth.split("-")[1] + "月", income: 0, expense: currentTotal },
        ]);
        setYoyData(null);
      } else {
        const [summaryRes, incomeTrend, expenseTrend] = await Promise.all([
          fetchSummary({ startDate, endDate }).catch(() => null),
          fetchMonthlyTrend({ months, type: "income", endDate }).catch(() => []),
          fetchMonthlyTrend({ months, type: "expense", endDate }).catch(() => []),
        ]);
        setSummary(summaryRes);
        setBars(buildBars(incomeTrend, expenseTrend, months));
        setYoyData(null);
      }
      
      const expensePieRes = await fetchCategoryBreakdown({ startDate, endDate, type: "expense" }).catch(() => []);
      setPieData(expensePieRes.map((item: any, i: number) => ({
        name: item.category_name,
        value: item.amount,
        percentage: item.percentage,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      })));
      
      const incomePieRes = await fetchCategoryBreakdown({ startDate, endDate, type: "income" }).catch(() => []);
      setIncomePieData(incomePieRes.map((item: any, i: number) => ({
        name: item.category_name,
        value: item.amount,
        percentage: item.percentage,
        color: CATEGORY_COLORS[(i + 5) % CATEGORY_COLORS.length],
      })));
      
      const month_from = startDate.substring(0, 7);
      const month_to = endDate.substring(0, 7);
      const memberRes = await fetchMemberComparison({ book_id: currentBook?.id || '', month_from, month_to }).catch(() => []);
      setMemberData(memberRes);
    } catch {
      setBars([]);
      setPieData([]);
      setIncomePieData([]);
      setMemberData([]);
    }
  }, [currentYear, currentMonth, currentBook]);

  // 滚动同步：period 变化时自动重新加载
  const prevPeriod = useRef(period);
  useEffect(() => {
    if (authLoading || !user) return;
    // 仅 period 变化或首次加载时触发
    if (prevPeriod.current === period && bars.length > 0) return;
    prevPeriod.current = period;
    loadData(period, getDateRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, period, getDateRange]);

  const handleRefresh = useCallback(() =>
    new Promise<void>((resolve) => {
      setRefreshing(true);
      loadData(period, getDateRange)
        .catch(() => {})
        .finally(() => {
          setRefreshing(false);
          resolve();
        });
    }),
  [loadData, period, getDateRange]);

  const buildBars = (incomes: any[], expenses: any[], months: number): BarData[] => {
    const result: BarData[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const inc = incomes.find((r: any) => r.month === key);
      const exp = expenses.find((r: any) => r.month === key);
      result.push({
        label: `${d.getMonth() + 1}月`,
        income: (inc?.total_income as number) || inc?.amount || 0,
        expense: (exp?.total_expense as number) || exp?.amount || 0,
      });
    }
    return result;
  };

  const income = summary?.totalIncome ?? 0;
  const expense = summary?.totalExpense ?? 0;

  const maxBarValue = useMemo(() => {
    const values = bars.flatMap((b) => [b.income, b.expense]);
    return Math.max(...values, 1);
  }, [bars]);

  const handleExport = () => {
    Taro.showLoading({ title: "导出中..." });
    const { startDate, endDate } = getDateRange;
    Taro.downloadFile({
      url: `${API_BASE_URL}/export/excel?startDate=${startDate}&endDate=${endDate}`,
      success: (res) => {
        Taro.hideLoading();
        if (res.statusCode === 200) {
          Taro.showToast({ title: "导出成功", icon: "success" });
        }
      },
      fail: () => {
        Taro.hideLoading();
        Taro.showToast({ title: "导出失败", icon: "none" });
      },
    });
  };

  const renderPeriodSelector = () => (
    <View className="period-selector">
      <ScrollView scrollX className="period-scroll">
        <View className="period-tabs">
          {PERIOD_TABS.map((tab) => (
            <View
              key={tab.key}
              className={`period-tab ${period === tab.key ? "active" : ""}`}
              onClick={() => setPeriod(tab.key as PeriodType)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderCompareSelector = () => {
    if (period === PeriodType.MonthCompare) {
      const months: string[] = [];
      for (let i = 12; i >= 1; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
      return (
        <View className="compare-selector">
          <Text className="compare-label">对比月份</Text>
          <Picker mode="selector" range={months} value={Math.max(0, months.indexOf(compareMonth))} onChange={(e: any) => setCompareMonth(months[e.detail.value])}>
            <View className="compare-picker">
              <Text>{compareMonth || months[0]}</Text>
              <Text className="picker-arrow">▼</Text>
            </View>
          </Picker>
        </View>
      );
    }
    if (period === PeriodType.YearCompare) {
      const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
      return (
        <View className="compare-selector">
          <Text className="compare-label">对比年份</Text>
          <Picker mode="selector" range={years.map((y) => `${y}年`)} value={years.indexOf(compareYear)} onChange={(e: any) => setCompareYear(years[e.detail.value])}>
            <View className="compare-picker">
              <Text>{compareYear}年</Text>
              <Text className="picker-arrow">▼</Text>
            </View>
          </Picker>
        </View>
      );
    }
    return null;
  };

  const renderYoyChart = () => {
    if (!yoyData) return null;
    const current = yoyData.expense.map((item: any) => item.currentYear);
    const compare = yoyData.expense.map((item: any) => item.lastYear);
    const labels = yoyData.expense.map((item: any) => item.monthLabel);
    const max = Math.max(...current, ...compare, 1);
    
    return (
      <View className="yoy-chart">
        <View className="section-header">
          <Text className="section-title">年度对比趋势</Text>
        </View>
        <View className="chart-area">
          <View className="chart-bars">
            {current.map((value: number, i: number) => (
              <View key={i} className="chart-col">
                <View className="chart-pair">
                  <View className="chart-bar out" style={{ height: `${Math.max((compare[i] / max) * 100, 2)}%` }} />
                  <View className="chart-bar in" style={{ height: `${Math.max((value / max) * 100, 2)}%` }} />
                </View>
                <Text className="chart-lbl">{labels[i]}</Text>
              </View>
            ))}
          </View>
          <View className="chart-legend">
            <Text className="legend-item">
              <Text className="dot out" />
              {compareYear}年
            </Text>
            <Text className="legend-item">
              <Text className="dot in" />
              {currentYear}年
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPieChart = (data: PieData[], title: string) => {
    if (data.length === 0) return null;
    const total = data.reduce((sum: number, item: PieData) => sum + item.value, 0);
    
    return (
      <View className="section-card">
        <View className="section-header">
          <Text className="section-title">{title}</Text>
          <Text className="section-total">¥{fmtAmount(total)}</Text>
        </View>
        <View className="pie-chart-area">
          <View className="pie-chart">
            <View className="pie-circle">
              {data.map((item, i) => {
                let startAngle = 0;
                for (let j = 0; j < i; j++) {
                  startAngle += (data[j].percentage / 100) * 360;
                }
                return (
                  <View
                    key={i}
                    className="pie-slice"
                    style={{
                      backgroundColor: item.color,
                      transform: `rotate(${startAngle}deg)`,
                    }}
                  />
                );
              })}
              <View className="pie-center" />
            </View>
          </View>
          <View className="pie-legend">
            {data.map((item, i) => (
              <View key={i} className="pie-legend-item">
                <View className="pie-dot" style={{ backgroundColor: item.color }} />
                <Text className="pie-name">{item.name}</Text>
                <Text className="pie-value">¥{fmtAmount(item.value)}</Text>
                <Text className="pie-percentage">{item.percentage.toFixed(1)}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderMemberComparison = () => {
    if (memberData.length === 0) return null;
    
    return (
      <View className="section-card">
        <View className="section-header">
          <Text className="section-title">成员支出对比</Text>
        </View>
        <View className="member-list">
          {memberData.map((member: any, i: number) => (
            <View key={member.user_id || i} className="member-item">
              <View className="member-info">
                <Text className="member-name">{member.user_name || `成员${i + 1}`}</Text>
              </View>
              <View className="member-amounts">
                <View className="member-expense">
                  <Text className="amount-label">支出</Text>
                  <Text className="amount-value expense">¥{fmtAmount(member.total_expense || 0)}</Text>
                </View>
              </View>
              {member.categories && member.categories.length > 0 && (
                <View className="member-categories">
                  {member.categories.slice(0, 3).map((cat: any, j: number) => (
                    <View key={j} className="category-item">
                      <Text className="category-name">{cat.category_name}</Text>
                      <Text className="category-amount">¥{fmtAmount(cat.amount || 0)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderViewTab = () => (
    <View className="view-tab">
      <View
        className={`view-tab-item ${viewTab === 0 ? "active" : ""}`}
        onClick={() => setViewTab(0)}
      >
        <Text>分类占比</Text>
      </View>
      <View
        className={`view-tab-item ${viewTab === 1 ? "active" : ""}`}
        onClick={() => setViewTab(1)}
      >
        <Text>成员对比</Text>
      </View>
    </View>
  );

  const renderPieTypeTab = () => (
    <View className="pie-type-tab">
      <View
        className={`pie-type-item ${pieType === 0 ? "active" : ""}`}
        onClick={() => setPieType(0)}
      >
        <Text>支出</Text>
      </View>
      <View
        className={`pie-type-item ${pieType === 1 ? "active" : ""}`}
        onClick={() => setPieType(1)}
      >
        <Text>收入</Text>
      </View>
    </View>
  );

  return (
    <PageLayout
      contentClassName="stats-content"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <PageHero
        eyebrow="数据报表"
        title={currentBook?.name || "当前账本"}
        value={`¥${fmtAmount(income - expense)}`}
        meta={`${PERIOD_TABS.find((tab) => tab.key === period)?.label || "本月"}结余 · 收入 ¥${fmtAmount(income)} / 支出 ¥${fmtAmount(expense)}`}
        tone="surface"
      />
      {renderPeriodSelector()}
      <View className="export-row">
        <View className="export-btn" onClick={handleExport}>
          <Text>导出 Excel</Text>
        </View>
      </View>
      {renderCompareSelector()}

      {yoyData ? (
        renderYoyChart()
      ) : (
        <>
          <AppSection title="月度收支趋势">
            <View className="chart-area">
              <View className="chart-bars">
                {bars.map((b) => (
                  <View key={b.label} className="chart-col">
                    <View className="chart-pair">
                      <View
                        className="chart-bar out"
                        style={{ height: `${Math.max((b.expense / maxBarValue) * 100, 2)}%` }}
                      />
                      <View
                        className="chart-bar in"
                        style={{ height: `${Math.max((b.income / maxBarValue) * 100, 2)}%` }}
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
          </AppSection>

          <MetricGrid
            items={[
              { label: "总收入", value: `¥${fmtAmount(income)}`, tone: "income" },
              { label: "总支出", value: `¥${fmtAmount(expense)}`, tone: "expense" },
            ]}
          />

          {renderViewTab()}
          {viewTab === 0 ? (
            <>
              {renderPieTypeTab()}
              {pieType === 0 ? renderPieChart(pieData, "支出分类占比") : renderPieChart(incomePieData, "收入分类占比")}
            </>
          ) : (
            renderMemberComparison()
          )}
        </>
      )}
    </PageLayout>
  );
}
