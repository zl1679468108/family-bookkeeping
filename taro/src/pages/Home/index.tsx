/**
 * Home — v3.0 安静记账首页
 * 白色导航栏 · 结余卡片(支出terra+收入sage) · 预算进度 · 近期流水
 */
import { useEffect } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useQuery } from "@tanstack/react-query";
import MonthPicker from "../../components/MonthPicker";
import TransactionItem from "../../components/TransactionItem";
import EmptyState from "../../components/EmptyState";
import ProgressBar from "../../components/ProgressBar";
import PageLayout from "../../components/PageLayout";
import { getTransactions } from "../../services/transactionsApi";
import { fetchBudgetStatus } from "../../services/budgetsApi";
import { fetchSummary } from "../../services/statisticsApi";
import { useCategoryLookup } from "../../hooks/useCategories";
import { useMonthSelector } from "../../hooks/useMonthSelector";
import { useAuth } from "../../context/AuthContext";
import { fmtAmount } from "../../utils/format";
import "./index.scss";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { year, month, setYear, setMonth, dateRange, monthKey } =
    useMonthSelector();
  const { getCategoryName, getCategoryIcon } = useCategoryLookup();

  useEffect(() => {
    if (!authLoading && !user) {
      Taro.reLaunch({ url: "/pages/User/Login/index" });
    }
  }, [authLoading, user]);

  const { data: summary, isLoading: sLoad } = useQuery({
    queryKey: ["statistics", "summary", dateRange],
    queryFn: () =>
      fetchSummary({ startDate: dateRange.start, endDate: dateRange.end }),
    staleTime: 60_000,
  });

  const { data: bs } = useQuery({
    queryKey: ["budgets", "status", monthKey],
    queryFn: () => fetchBudgetStatus(monthKey),
    staleTime: 60_000,
  });

  const { data: tx } = useQuery({
    queryKey: ["transactions", "home", dateRange],
    queryFn: () =>
      getTransactions({
        startDate: dateRange.start,
        endDate: dateRange.end,
        page: 1,
        pageSize: 5,
        sortBy: "date",
        sortOrder: "desc",
      }),
    staleTime: 30_000,
  });

  const expense = summary?.totalExpense ?? 0;
  const income = summary?.totalIncome ?? 0;
  const balance = income - expense;
  const loading = sLoad || authLoading;

  const loadingSkeleton = (
    <View className="flex flex-col gap-2 home-content">
      <View
        className="skeleton"
        style={{ height: "200rpx", borderRadius: "var(--radius-lg)" }}
      />
      <View
        className="skeleton"
        style={{ height: "120rpx", borderRadius: "var(--radius-lg)" }}
      />
      <View
        className="skeleton"
        style={{ height: "80rpx", borderRadius: "var(--radius-lg)" }}
      />
    </View>
  );

  return (
    <PageLayout
      title="家庭记账"
      tabBar
      loading={loading}
      loadingText="拉取账本数据…"
      loadingFallback={loadingSkeleton}
      contentClassName="home-content"
    >
      <>
        {/* Month Picker — below nav, compact */}
        <View className="flex items-center">
          <MonthPicker
            year={year}
            month={month}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
            light={false}
          />
        </View>

        {/* Balance Card */}
        <View className="home-balance-card">
          <Text className="home-balance-label">本月结余</Text>
          <Text className="home-balance-value">¥{fmtAmount(balance)}</Text>
          <View className="home-balance-row">
            <View className="home-balance-item">
              <Text className="home-balance-item-label">
                <View className="home-dot home-dot--expense" /> 支出
              </Text>
              <Text className="home-balance-item-value text-expense">
                ¥{fmtAmount(expense)}
              </Text>
            </View>
            <View className="home-balance-item">
              <Text className="home-balance-item-label">
                <View className="home-dot home-dot--income" /> 收入
              </Text>
              <Text className="home-balance-item-value text-income">
                ¥{fmtAmount(income)}
              </Text>
            </View>
          </View>
        </View>

        {/* Budget Progress */}
        {bs && bs.totalBudget > 0 && (
          <View
            className="home-budget-card"
            onClick={() => Taro.navigateTo({ url: "/pages/Budgets/index" })}
          >
            <ProgressBar
              label="月度预算"
              current={bs.totalSpent}
              max={bs.totalBudget}
              danger={bs.totalSpent > bs.totalBudget}
            />
          </View>
        )}

        {/* Budget Alerts */}
        {bs && bs.totalBudget > 0 && bs.alerts?.length > 0 && (
          <View className="home-alerts-card">
            <View className="flex justify-between items-center mb-2">
              <Text className="text-md font-semibold">
                {bs.alerts.some((a: any) => a.progress >= 100)
                  ? "预算超支"
                  : "预算预警"}
              </Text>
              <Text
                className="text-sm text-primary font-semibold"
                onClick={() => Taro.navigateTo({ url: "/pages/Budgets/index" })}
              >
                调整预算
              </Text>
            </View>
            {bs.alerts.slice(0, 3).map((a: any) => {
              const over = a.progress >= 100;
              return (
                <View
                  key={a.category_id}
                  className="home-alert-item"
                  onClick={() =>
                    Taro.navigateTo({
                      url: `/pages/Budgets/index?focus=${a.category_id}`,
                    })
                  }
                >
                  <View
                    className={`home-alert-dot ${over ? "home-alert-dot--danger" : "home-alert-dot--warn"}`}
                  />
                  <Text style={{ fontSize: "32rpx" }}>
                    {getCategoryIcon(a.category_id)}
                  </Text>
                  <View className="flex-1 ml-2">
                    <View className="flex justify-between">
                      <Text className="text-sm font-semibold">
                        {getCategoryName(a.category_id)}
                      </Text>
                      <Text
                        className="text-sm font-semibold"
                        style={{
                          color: over
                            ? "var(--color-danger)"
                            : "var(--color-warning)",
                        }}
                      >
                        {a.progress}%
                      </Text>
                    </View>
                    <View className="progress-bar mt-1">
                      <View
                        className={`progress-bar-fill ${over ? "progress-bar-fill--danger" : ""}`}
                        style={{
                          width: `${Math.min(a.progress, 100)}%`,
                          backgroundColor: over
                            ? "var(--color-danger)"
                            : "var(--color-warning)",
                        }}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Transactions */}
        <View className="flex justify-between items-center mt-3 mb-2">
          <Text className="text-md font-semibold">近期流水</Text>
          <Text
            className="text-sm text-primary font-semibold"
            onClick={() => Taro.switchTab({ url: "/pages/Transactions/index" })}
          >
            查看全部 →
          </Text>
        </View>

        {!tx?.data?.length ? (
          <View className="card">
            <EmptyState
              title="暂无交易记录"
              description="点击下方 + 开始记账"
              actionText="记一笔"
              onAction={() =>
                Taro.switchTab({ url: "/pages/AddTransaction/index" })
              }
            />
          </View>
        ) : (
          <View className="card">
            {tx.data.map((t) => {
              const catIcon = getCategoryIcon(t.category);
              const catName = getCategoryName(t.category);
              return (
                <TransactionItem
                  key={t.id}
                  icon={catIcon}
                  categoryName={catName}
                  description={t.description}
                  amount={t.amount}
                  type={t.type}
                  date={t.date?.slice(5)}
                  categoryType={catName}
                  onClick={() =>
                    Taro.navigateTo({
                      url: `/pages/AddTransaction/index?edit=${t.id}`,
                    })
                  }
                />
              );
            })}
          </View>
        )}
      </>
    </PageLayout>
  );
}
