/**
 * Home — v3.0 安静记账首页
 * 白色导航栏 · 结余卡片(支出terra+收入sage) · 预算进度 · 近期流水
 */
import { useEffect, useState, useCallback } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
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
import type {
  StatisticsSummary,
  BudgetStatus,
  PaginatedResponse,
  Transaction,
} from "../../types";
import "./index.scss";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { year, month, setYear, setMonth, dateRange, monthKey } =
    useMonthSelector();
  const { getCategoryName, getCategoryIcon } = useCategoryLookup();

  // 手动管理数据状态，避免 React Query 在 Taro 中的兼容性问题
  const [summary, setSummary] = useState<StatisticsSummary | null>(null);
  const [bs, setBs] = useState<BudgetStatus | null>(null);
  const [tx, setTx] = useState<PaginatedResponse<Transaction> | null>(null);
  const [sLoad, setSLoad] = useState(true);

  const fetchAllData = useCallback(async () => {
    setSLoad(true);
    try {
      const [summaryRes, bsRes, txRes] = await Promise.all([
        fetchSummary({ startDate: dateRange.start, endDate: dateRange.end }),
        fetchBudgetStatus(monthKey),
        getTransactions({
          startDate: dateRange.start,
          endDate: dateRange.end,
          page: 1,
          pageSize: 5,
          sortBy: "date",
          sortOrder: "desc",
        }),
      ]);
      setSummary(summaryRes);
      setBs(bsRes);
      setTx(txRes);
    } catch (err) {
      console.error("首页数据加载失败:", err);
    } finally {
      setSLoad(false);
    }
  }, [dateRange.start, dateRange.end, monthKey]);

  // 认证完成后加载数据
  useEffect(() => {
    if (!authLoading && !user) {
      Taro.reLaunch({ url: "/pages/User/Login/index" });
      return;
    }
    if (user) {
      fetchAllData();
    }
  }, [authLoading, user, fetchAllData]);

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
        <View className="home-month-picker">
          <MonthPicker
            year={year}
            month={month}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />
        </View>

        {/* Balance Card */}
        <View className="home-balance-card">
          <Text className="home-balance-label">本月结余</Text>
          <Text
            className={`home-balance-value ${balance < 0 ? "negative" : ""}`}
          >
            ¥&nbsp;{fmtAmount(balance)}
          </Text>
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
            <View className="home-budget-header">
              <Text className="home-budget-title">月度预算</Text>
              <Text className="home-budget-pct">
                {Math.round((bs.totalSpent / bs.totalBudget) * 100)}%
              </Text>
            </View>
            <ProgressBar
              label=""
              current={bs.totalSpent}
              max={bs.totalBudget}
              danger={bs.totalSpent > bs.totalBudget}
              showLabel={false}
            />
            <Text className="home-budget-numbers">
              已花 ¥{bs.totalSpent.toLocaleString()} / ¥
              {bs.totalBudget.toLocaleString()}
            </Text>
          </View>
        )}

        {/* Budget Alerts — 预算预警 严格按设计稿 */}
        {bs && bs.alerts && bs.alerts.length > 0 && (
          <View className="home-alerts-card">
            <View className="home-alerts-header">
              <Text className="home-alerts-title">
                {bs.alerts.some((a: any) => a.progress >= 100)
                  ? "预算超支"
                  : "预算预警"}
              </Text>
              <Text
                className="home-alerts-link"
                onClick={(e: any) => {
                  e.stopPropagation();
                  Taro.navigateTo({ url: "/pages/Budgets/index" });
                }}
              >
                调整预算 →
              </Text>
            </View>
            {bs.alerts.slice(0, 3).map((a: any) => {
              const over = a.progress >= 100;
              const barColor = over
                ? "var(--color-expense)"
                : a.progress >= 80
                  ? "var(--color-warning)"
                  : "var(--color-primary)";
              return (
                <View
                  key={a.category_id}
                  className="home-alert-row"
                  onClick={() =>
                    Taro.navigateTo({
                      url: `/pages/Budgets/index?focus=${a.category_id}`,
                    })
                  }
                >
                  <View className="home-alert-icon">
                    <Text style={{ fontSize: "24rpx" }}>
                      {getCategoryIcon(a.category_id)}
                    </Text>
                  </View>
                  <Text className="home-alert-name">
                    {getCategoryName(a.category_id)}
                  </Text>
                  <View className="home-alert-mini-bar">
                    <View
                      className="home-alert-fill"
                      style={{
                        width: `${Math.min(a.progress, 100)}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </View>
                  <Text
                    className="home-alert-pct"
                    style={{ color: barColor }}
                  >
                    {Math.round(a.progress)}%
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Transactions */}
        <View className="section-header">
          <Text className="section-title">近期流水</Text>
          <Text
            className="section-link"
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
                  onClick={() => {
                    Taro.setStorageSync("edit_tx_id", t.id);
                    Taro.switchTab({ url: "/pages/AddTransaction/index" });
                  }}
                />
              );
            })}
          </View>
        )}
      </>
    </PageLayout>
  );
}
