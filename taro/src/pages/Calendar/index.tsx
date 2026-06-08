/**
 * Calendar — v3.0 现金流日历
 * 月份 Picker 导航 · 日期格子(支出/收入标记) · 点击展开交易明细 · 月度统计
 */
import { useState, useMemo } from "react";
import { View, Text, ScrollView, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import TransactionItem from "../../components/TransactionItem";
import EmptyState from "../../components/EmptyState";
import { getTransactions } from "../../services/transactionsApi";
import { fetchDailySummary } from "../../services/statisticsApi";
import { useCategories } from "../../hooks/useCategories";
import { useMonthSelector } from "../../hooks/useMonthSelector";
import { useManualQuery } from "../../hooks/useManualQuery";
import type { Category, Transaction } from "../../types";
import "./index.scss";

export default function Calendar() {
  const now = new Date();
  const { year, month, setYear, setMonth } = useMonthSelector();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const pickerMonth = `${year}-${String(month).padStart(2, "0")}`;

  const { data: dailyData } = useManualQuery({
    key: `cal-daily-${pickerMonth}`,
    queryFn: () => fetchDailySummary(pickerMonth),
  });

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
  const cmap = useMemo(() => {
    const m: Record<string, Category> = {};
    cats?.forEach((c: Category) => {
      m[c.id] = c;
    });
    return m;
  }, [cats]);

  // Build calendar grid
  const calendar = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
    const cells: Array<{ date: string | null; day: number | null }> = [];

    for (let i = 0; i < firstDay; i++) cells.push({ date: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date: ds, day: d });
    }
    return cells;
  }, [year, month]);

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

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Monthly stats
  const stats = useMemo(() => {
    const entries = Object.values(dayMap);
    const totalExpense = entries.reduce((s, d) => s + d.expense, 0);
    const expenseDays = entries.filter((d) => d.expense > 0).length;
    const daysInMonth = new Date(year, month, 0).getDate();
    const maxDay = entries.reduce(
      (max, d) => (d.expense > (max?.expense || 0) ? { ...d, date: "" } : max),
      { expense: 0, income: 0, count: 0 } as any,
    );
    const minDays = entries.filter((d) => d.expense > 0);
    const minDay = minDays.reduce(
      (min, d) =>
        d.expense < (min?.expense || Infinity) ? { ...d, date: "" } : min,
      { expense: Infinity, income: 0, count: 0 } as any,
    );
    return {
      avgExpense: daysInMonth > 0 ? totalExpense / daysInMonth : 0,
      maxExpenseDay: maxDay.expense > 0 ? maxDay : null,
      minExpenseDay: minDay.expense < Infinity ? minDay : null,
      expenseDayRatio: daysInMonth > 0 ? (expenseDays / daysInMonth) * 100 : 0,
    };
  }, [dayMap, year, month]);

  // Find which day has max/min by date
  const findDayNum = (targetDay: { expense: number } | null): number | null => {
    if (!targetDay) return null;
    for (const [date, data] of Object.entries(dayMap)) {
      if (data.expense === targetDay.expense) return parseInt(date.slice(-2));
    }
    return null;
  };

  return (
    <View className="min-h-screen bg-bg flex flex-col">
      <ScrollView className="flex-1" scrollY>
        <View className="cal-body">
          {/* Month Picker Toolbar */}
          <View className="cal-toolbar">
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
              <View className="cal-toolbar-picker">
                <Text className="text-md font-semibold">
                  {year}年{month}月
                </Text>
                <Text className="text-xs text-hint ml-1">▾</Text>
              </View>
            </Picker>
            <Text
              className="text-sm text-primary font-semibold"
              onClick={() => {
                setYear(now.getFullYear());
                setMonth(now.getMonth() + 1);
                setSelectedDate(null);
              }}
            >
              今天
            </Text>
          </View>

          {/* Weekday header */}
          <View className="cal-weekdays">
            {["日", "一", "二", "三", "四", "五", "六"].map((w) => (
              <Text key={w} className="cal-weekday">
                {w}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View className="cal-grid">
            {calendar.map((cell, i) => (
              <View
                key={i}
                className={`cal-cell ${!cell.date ? "cal-cell--empty" : ""} ${cell.date === selectedDate ? "cal-cell--active" : ""} ${cell.date === todayStr ? "cal-cell--today" : ""}`}
                onClick={() =>
                  cell.date &&
                  setSelectedDate(selectedDate === cell.date ? null : cell.date)
                }
              >
                {cell.day && (
                  <>
                    <Text className="cal-day">{cell.day}</Text>
                    {dayMap[cell.date!] && (
                      <View className="cal-amounts">
                        {dayMap[cell.date!].expense > 0 && (
                          <Text className="cal-expense">
                            -{dayMap[cell.date!].expense.toFixed(0)}
                          </Text>
                        )}
                        {dayMap[cell.date!].income > 0 && (
                          <Text className="cal-income">
                            +{dayMap[cell.date!].income.toFixed(0)}
                          </Text>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>
            ))}
          </View>

          {/* Monthly Stats */}
          <View className="cal-stats">
            <View className="card-padded">
              <Text className="text-xs text-hint">本月日均支出</Text>
              <Text className="text-md font-semibold mt-1">
                ¥{stats.avgExpense.toFixed(2)}
              </Text>
            </View>
            <View className="card-padded">
              <Text className="text-xs text-hint">最高消费日</Text>
              <Text className="text-md font-semibold text-expense mt-1">
                {findDayNum(stats.maxExpenseDay)
                  ? `${findDayNum(stats.maxExpenseDay)}日`
                  : "暂无"}
              </Text>
            </View>
            <View className="card-padded">
              <Text className="text-xs text-hint">最低消费日</Text>
              <Text className="text-md font-semibold text-income mt-1">
                {findDayNum(stats.minExpenseDay)
                  ? `${findDayNum(stats.minExpenseDay)}日`
                  : "暂无"}
              </Text>
            </View>
            <View className="card-padded">
              <Text className="text-xs text-hint">支出天数</Text>
              <Text className="text-md font-semibold mt-1">
                {stats.expenseDayRatio.toFixed(0)}%
              </Text>
            </View>
          </View>

          {/* Transaction Detail for selected date */}
          {selectedDate && (
            <View className="cal-detail">
              <View className="flex justify-between items-center mb-2">
                <Text className="text-md font-semibold">
                  {selectedDate} 交易明细
                </Text>
                <Text
                  className="text-sm text-hint"
                  onClick={() => setSelectedDate(null)}
                >
                  收起
                </Text>
              </View>
              {detailLoading ? (
                <View className="flex flex-col gap-1">
                  <View
                    className="skeleton"
                    style={{ height: "70rpx", borderRadius: "10rpx" }}
                  />
                  <View
                    className="skeleton"
                    style={{ height: "70rpx", borderRadius: "10rpx" }}
                  />
                </View>
              ) : !dayTx?.data?.length ? (
                <EmptyState icon="📋" title="暂无交易记录" />
              ) : (
                <View className="card">
                  {dayTx.data.map((t: Transaction) => {
                    const cat = cmap[t.category];
                    return (
                      <TransactionItem
                        key={t.id}
                        icon={cat?.icon || "📌"}
                        categoryName={cat?.name || "未知"}
                        description={t.description}
                        amount={t.amount}
                        type={t.type}
                        date={t.date?.split("T")[1]?.slice(0, 5)}
                        onClick={() => {
                          Taro.setStorageSync("edit_tx_id", t.id);
                          Taro.switchTab({ url: "/pages/AddTransaction/index" });
                        }}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
