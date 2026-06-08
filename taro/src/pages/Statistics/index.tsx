/**
 * Statistics — v3.0 统计页
 * 白色导航 · 3段分段控件 · 趋势柱状图 · 分类占比 · 成员对比
 */
import { useState, useMemo } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useQuery } from "@tanstack/react-query";
import MonthPicker from "../../components/MonthPicker";
import SegmentedControl from "../../components/SegmentedControl";
import EmptyState from "../../components/EmptyState";
import PageLayout from "../../components/PageLayout";
import { useMonthSelector } from "../../hooks/useMonthSelector";
import {
  fetchCategoryBreakdown,
  fetchMonthlyTrend,
} from "../../services/statisticsApi";
import "./index.scss";

const PALETTE = [
  "#E07B4C",
  "#D4A34A",
  "#4CAF8D",
  "#E88B6E",
  "#6B9E7A",
  "#B88B5D",
  "#E89A67",
  "#C58A6A",
  "#D6875E",
  "#5B9A7A",
];

export default function Statistics() {
  const { year, month, setYear, setMonth, dateRange } = useMonthSelector();
  const [tabIndex, setTabIndex] = useState(0); // 0=支出, 1=收入, 2=成员对比
  const isMemberTab = tabIndex === 2;
  const tabType = (tabIndex === 0 ? "expense" : "income") as
    | "expense"
    | "income";

  const { data: breakdown = [], isLoading: bLoading } = useQuery({
    queryKey: ["statistics", "category-breakdown", dateRange, tabType],
    queryFn: () =>
      fetchCategoryBreakdown({
        startDate: dateRange.start,
        endDate: dateRange.end,
        type: tabType,
      }),
    staleTime: 60_000,
    enabled: !isMemberTab,
  });

  const { data: trend = [], isLoading: tLoading } = useQuery({
    queryKey: ["statistics", "monthly-trend", tabType, dateRange.end],
    queryFn: () =>
      fetchMonthlyTrend({ months: 6, endDate: dateRange.end, type: tabType }),
    staleTime: 60_000,
    enabled: !isMemberTab,
  });

  const total = useMemo(
    () => breakdown.reduce((s, i) => s + i.amount, 0),
    [breakdown],
  );
  const maxT = useMemo(
    () => Math.max(...trend.map((d) => d.amount), 1),
    [trend],
  );
  const isLoading = bLoading || tLoading;

  const handleCategoryClick = (catId: string) => {
    Taro.navigateTo({
      url: `/pages/Transactions/index?category=${catId}&startDate=${dateRange.start}&endDate=${dateRange.end}&type=${tabType}`,
    });
  };

  return (
    <PageLayout title="统计" tabBar>
      {/* Segmented Tabs */}
      <View className="stats-tabs-wrap">
        <SegmentedControl
          options={["支出分析", "收入分析", "成员对比"]}
          value={tabIndex}
          onChange={setTabIndex}
        />
      </View>

      <View className="stats-content">
        {/* Month Picker — moved from nav to content */}
        <View className="flex items-center mb-3">
          <MonthPicker
            year={year}
            month={month}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />
        </View>

        {isMemberTab ? (
          /* 成员对比 — placeholder */
          <View className="card">
            <EmptyState
              icon="\uD83D\uDC65"
              title="成员对比"
              description="此功能开发中，敬请期待"
            />
          </View>
        ) : isLoading ? (
          <View className="flex flex-col gap-2">
            <View
              className="skeleton rounded-lg"
              style={{ height: "280rpx" }}
            />
            <View
              className="skeleton rounded-lg"
              style={{ height: "220rpx" }}
            />
          </View>
        ) : (
          <>
            {/* Category Breakdown Card */}
            <View className="card-padded">
              <View className="flex justify-between items-baseline mb-3">
                <Text className="text-md font-semibold">分类占比</Text>
                <Text className="text-sm text-hint">
                  合计 ¥{total.toLocaleString()}
                </Text>
              </View>

              {breakdown.length === 0 ? (
                <EmptyState title="暂无数据" />
              ) : (
                <View className="flex flex-col" style={{ gap: "16rpx" }}>
                  {breakdown.map((item, idx) => {
                    const pct = total > 0 ? (item.amount / total) * 100 : 0;
                    const col = PALETTE[idx % PALETTE.length];
                    return (
                      <View
                        key={item.category_id}
                        className="stats-cat-item tappable"
                        onClick={() => handleCategoryClick(item.category_id)}
                      >
                        <Text style={{ fontSize: "32rpx", flexShrink: 0 }}>
                          {item.category_icon || "\uD83D\uDCCC"}
                        </Text>
                        <View className="flex-1 ml-2" style={{ minWidth: 0 }}>
                          <View className="flex justify-between items-center mb-1">
                            <Text className="text-sm truncate">
                              {item.category_name}
                            </Text>
                            <Text className="text-sm font-semibold ml-1">
                              ¥{item.amount.toLocaleString()}
                            </Text>
                          </View>
                          <View className="progress-bar">
                            <View
                              className="progress-bar-fill"
                              style={{
                                width: `${Math.max(pct, 2)}%`,
                                backgroundColor: col,
                              }}
                            />
                          </View>
                        </View>
                        <Text
                          className="text-xs text-hint ml-1"
                          style={{
                            flexShrink: 0,
                            width: "56rpx",
                            textAlign: "right",
                          }}
                        >
                          {pct.toFixed(0)}%
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Monthly Trend Card */}
            <View className="card-padded">
              <Text className="text-md font-semibold mb-3">月度趋势</Text>

              {trend.length === 0 ? (
                <EmptyState title="暂无数据" />
              ) : (
                <View className="stats-bar-chart">
                  {trend.map((item) => {
                    const bh = (item.amount / maxT) * 240;
                    const tint = tabIndex === 0 ? "212,120,92" : "91,154,122";
                    return (
                      <View key={item.month} className="stats-bar-col">
                        <Text className="stats-bar-amount">
                          ¥{(item.amount / 1000).toFixed(1)}k
                        </Text>
                        <View className="stats-bar-track">
                          <View
                            className="stats-bar-fill"
                            style={{
                              height: `${Math.max(bh, 4)}rpx`,
                              background: `linear-gradient(to top, rgba(${tint},1), rgba(${tint},0.25))`,
                            }}
                          />
                        </View>
                        <Text className="stats-bar-label">
                          {item.month.slice(5)}月
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </PageLayout>
  );
}
