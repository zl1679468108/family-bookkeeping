/**
 * Calendar — v3.0 现金流日历
 * 对齐 PC：月度总览 · 日历网格（日期+收支）· 点击展开当日明细
 */
import { useState, useMemo } from "react";
import { View, Text, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import TransactionItem from "../../components/TransactionItem";
import EmptyState from "../../components/EmptyState";
import PageLayout from "../../components/PageLayout";
import { AppSection, MetricGrid, PageHero } from "../../components/ui";
import { getTransactions } from "../../services/transactionsApi";
import { fetchDailySummary } from "../../services/statisticsApi";
import { useCategories } from "../../hooks/useCategories";
import { useMonthSelector } from "../../hooks/useMonthSelector";
import { useManualQuery } from "../../hooks/useManualQuery";
import { getLunarInfo } from "../../utils/lunarUtils";
import "./index.scss";

export default function Calendar() {
  const now = new Date();
  const { year, month, setYear, setMonth } = useMonthSelector();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const pickerMonth = `${year}-${String(month).padStart(2, "0")}`;

  // 当月每日汇总（含 total_expense / total_income / transaction_count）
  const { data: dailyData, isLoading: dailyLoading } = useManualQuery({
    key: `cal-daily-${pickerMonth}`,
    queryFn: () => fetchDailySummary({ month: pickerMonth }),
  });

  // 选中日期的交易明细
  const { data: dayTx, isLoading: detailLoading } = useManualQuery({
    key: `cal-day-${selectedDate || "none"}`,
    queryFn: () =>
      getTransactions({
        startDate: selectedDate!,
        endDate: selectedDate!,
        pageSize: 200,
      }),
    enabled: !!selectedDate,
  });

  const { data: cats } = useCategories();
  const catMap = useMemo(() => {
    const m: Record<string, { icon: string; name: string }> = {};
    cats?.forEach((c: any) => {
      m[c.id] = { icon: c.icon, name: c.name };
    });
    return m;
  }, [cats]);

  // ===== 日历网格构建 =====
  const calendar = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
    const cells: Array<{ date: string | null; day: number | null }> = [];

    for (let i = 0; i < firstDay; i++) cells.push({ date: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date: ds, day: d });
    }
    // 补齐到6行（42格），让日历高度稳定
    while (cells.length < 42) cells.push({ date: null, day: null });
    return cells;
  }, [year, month]);

  // ===== 每日数据映射 =====
  const dayMap = useMemo(() => {
    const m: Record<
      string,
      { expense: number; income: number; count: number }
    > = {};
    dailyData?.forEach((d: any) => {
      m[d.date] = {
        expense: d.total_expense || 0,
        income: d.total_income || 0,
        count: d.transaction_count || 0,
      };
    });
    return m;
  }, [dailyData]);

  // ===== 本月统计总览 =====
  const monthStats = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    let maxExpenseDay: { date: string; amount: number } | null = null;
    let txDays = 0;

    for (const [date, data] of Object.entries(dayMap)) {
      totalExpense += data.expense;
      totalIncome += data.income;
      if (data.count > 0) txDays++;
      if (!maxExpenseDay || data.expense > maxExpenseDay.amount) {
        maxExpenseDay = { date, amount: data.expense };
      }
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const netFlow = totalIncome - totalExpense;

    return {
      totalExpense,
      totalIncome,
      netFlow,
      avgExpense: txDays > 0 ? totalExpense / txDays : 0,
      maxExpenseDay,
      txDays,
      daysInMonth,
    };
  }, [dayMap, year, month]);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <PageLayout contentClassName="cal-content">
      <PageHero
        eyebrow="现金流日历"
        title={`${year}年${month}月`}
        meta={`${monthStats.txDays} 个记账日 · ${Object.values(dayMap).reduce((sum, d) => sum + d.count, 0)} 笔记录`}
        tone="surface"
      />

      {/* ===== 顶部：月份切换 + 左右箭头 ===== */}
      <View className="cal-header">
        <View className="cal-nav-btn" onClick={() => {
          if (month === 1) { setYear(year - 1); setMonth(12); }
          else setMonth(month - 1);
          setSelectedDate(null);
        }}>
          <Text className="cal-nav-btn__text">‹</Text>
        </View>
        <Picker
          mode="date"
          fields="month"
          value={pickerMonth}
          onChange={(e: any) => {
            const [y, m] = e.detail.value.split("-").map(Number);
            setYear(y);
            setMonth(m);
            setSelectedDate(null);
          }}
        >
          <View className="cal-month-picker">
            <Text className="cal-month-picker__text">
              {year}年{month}月
            </Text>
            <Text className="cal-month-picker__caret">▾</Text>
          </View>
        </Picker>
        <View className="cal-nav-btn" onClick={() => {
          if (month === 12) { setYear(year + 1); setMonth(1); }
          else setMonth(month + 1);
          setSelectedDate(null);
        }}>
          <Text className="cal-nav-btn__text">›</Text>
        </View>
      </View>

      <MetricGrid
        columns={2}
        items={[
          { label: "本月收入", value: `¥${monthStats.totalIncome.toFixed(2)}`, tone: "income" },
          { label: "本月支出", value: `¥${monthStats.totalExpense.toFixed(2)}`, tone: "expense" },
          { label: "总笔数", value: `${monthStats.txDays}天/${Object.values(dayMap).reduce((sum, d) => sum + d.count, 0)}笔` },
          {
            label: "本月结余",
            value: `${monthStats.netFlow >= 0 ? "+" : "-"}¥${Math.abs(monthStats.netFlow).toFixed(2)}`,
            tone: monthStats.netFlow >= 0 ? "income" : "expense",
          },
        ]}
      />

      {/* ===== 周几标题 ===== */}
      <View className="cal-weekdays">
        {["日", "一", "二", "三", "四", "五", "六"].map((w, i) => (
          <Text
            key={w}
            className={`cal-weekday ${i === 0 || i === 6 ? "cal-weekday--weekend" : ""}`}
          >
            {w}
          </Text>
        ))}
      </View>

      <AppSection title="月度日历" compact>
      <View className="cal-grid">
        {calendar.map((cell, i) => {
          if (!cell.date) {
            return <View key={i} className="cal-cell cal-cell--empty" />;
          }
          const dayData = dayMap[cell.date];
          const hasExpense = dayData && dayData.expense > 0;
          const hasIncome = dayData && dayData.income > 0;
          const isToday = cell.date === todayStr;
          const isSelected = cell.date === selectedDate;

          return (
            <View
              key={i}
              className={`cal-cell ${isToday ? "cal-cell--today" : ""} ${
                isSelected ? "cal-cell--selected" : ""
              }`}
              onClick={() =>
                setSelectedDate(selectedDate === cell.date ? null : cell.date)
              }
            >
              <Text className="cal-day">{cell.day}</Text>
              {(() => {
                const info = getLunarInfo(cell.date);
                const isFestival = info.isLegalHoliday || info.subText !== info.lunarDayText;
                return (
                  <Text className={`cal-lunar ${isFestival ? "cal-lunar--festival" : ""}`}>
                    {info.subText}
                  </Text>
                );
              })()}
              {hasExpense && (
                <Text className="cal-amount cal-amount--expense">
                  -{dayData!.expense.toFixed(0)}
                </Text>
              )}
              {hasIncome && !hasExpense && (
                <Text className="cal-amount cal-amount--income">
                  +{dayData!.income.toFixed(0)}
                </Text>
              )}
              {hasExpense && hasIncome && (
                <Text className="cal-amount cal-amount--income cal-amount--small">
                  +{dayData!.income.toFixed(0)}
                </Text>
              )}
              {dayData && dayData.count > 0 && (
                <Text className="cal-count">{dayData.count}笔</Text>
              )}
            </View>
          );
        })}
      </View>
      </AppSection>

      {/* ===== 选中日期的明细卡片 ===== */}
      {selectedDate && (
        <View className="cal-detail">
          <View className="cal-detail__header">
            <View className="cal-detail__date-info">
              <Text className="cal-detail__date">{selectedDate}</Text>
              {dayMap[selectedDate] && (
                <View className="cal-detail__mini-stats">
                  {dayMap[selectedDate].income > 0 && (
                    <Text className="cal-detail__mini cal-detail__mini--income">
                      收入 ¥{dayMap[selectedDate].income.toFixed(2)}
                    </Text>
                  )}
                  {dayMap[selectedDate].expense > 0 && (
                    <Text className="cal-detail__mini cal-detail__mini--expense">
                      支出 ¥{dayMap[selectedDate].expense.toFixed(2)}
                    </Text>
                  )}
                </View>
              )}
            </View>
            <Text
              className="cal-detail__close"
              onClick={() => setSelectedDate(null)}
            >
              收起
            </Text>
          </View>

          {detailLoading ? (
            <View className="cal-detail__loading">
              <View className="cal-detail__spin" />
              <Text className="cal-detail__loading-text">加载中...</Text>
            </View>
          ) : !dayTx?.data || dayTx.data.length === 0 ? (
            <EmptyState icon="note" title="当日无记录" />
          ) : (
            <View className="cal-detail__body">
              {dayTx.data.map((t: any) => {
                const cat = catMap[t.category] || { icon: "📌", name: "其他" };
                return (
                  <TransactionItem
                    key={t.id}
                    icon={cat.icon}
                    categoryName={cat.name}
                    description={t.description || t.note || ""}
                    amount={t.amount}
                    type={t.type}
                    date={
                      t.created_at
                        ? new Date(t.created_at)
                            .toTimeString()
                            .slice(0, 5)
                        : ""
                    }
                    onClick={() => {
                      Taro.setStorageSync("edit_tx_id", t.id);
                      Taro.navigateTo({ url: "/pages/AddTransaction/index" });
                    }}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* 加载中占位（仅初次加载） */}
      {dailyLoading && !dailyData && (
        <View className="cal-loading">
          <View className="cal-loading__spin" />
          <Text className="cal-loading__text">加载中...</Text>
        </View>
      )}
    </PageLayout>
  );
}
