/**
 * Home — 首页（v5）
 *
 * 结构（从上到下）:
 *   .metric-grid--3  — 本月结余 / 本月收入 / 本月支出（三列统计）
 *   .budget-card     — 本月预算（大卡片 + 分类进度条）
 *   .txn-list        — 最近交易（精美列表）
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageLayout from "../../components/PageLayout";
import { AppSection, MetricGrid, EmptyState } from "../../components/ui";
import { getTransactions } from "../../services/transactionsApi";
import { fetchSummary } from "../../services/statisticsApi";
import { fetchBudgetStatus } from "../../services/budgetsApi";
import { useCategoryLookup } from "../../hooks/useCategories";
import { useAuth } from "../../context/AuthContext";
import { useBookContext } from "../../context/BookContext";
import { fmtAmount } from "../../utils/format";
import { renderCategoryIcon } from "../../utils/renderCategoryIcon";
import "./index.scss";

interface BudgetStatus {
  category_id: string;
  category_name: string;
  category_icon?: string;
  budget_amount: number;
  spent_amount: number;
  percentage: number;
  is_over_budget: boolean;
}

export default function Home() {
  const { getCategoryName, getCategoryIcon } = useCategoryLookup();
  const { user, loading } = useAuth();
  const { currentBook } = useBookContext();
  const [txn, setTxn] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const startDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const endDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const monthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;

    const [summaryRes, txnRes, budgetRes] = await Promise.allSettled([
      fetchSummary({ startDate, endDate }),
      getTransactions({ page: 1, pageSize: 5, startDate, endDate }),
      fetchBudgetStatus(monthStr),
    ]);

    if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
    if (txnRes.status === "fulfilled") setTxn(txnRes.value?.data || []);
    if (budgetRes.status === "fulfilled") {
      const b = budgetRes.value;
      const cats = (b?.categories || []).map((c: any) => ({
        category_id: c.category_id,
        category_name: c.category_name,
        category_icon: c.category_icon,
        budget_amount: c.budget,
        spent_amount: c.spent,
        percentage: c.progress ?? 0,
        is_over_budget: c.status === "over",
      }));
      setBudgets(cats);
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    setInitialLoading(true);
    loadData()
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, [loading, user, loadData, currentBook]);

  const handleRefresh = useCallback(() => {
    return new Promise<void>((resolve) => {
      setRefreshing(true);
      loadData()
        .catch(() => {})
        .finally(() => {
          setRefreshing(false);
          resolve();
        });
    });
  }, [loadData]);

  const expense = summary?.totalExpense ?? 0;
  const income = summary?.totalIncome ?? 0;
  const balance = income - expense;

  // 预算汇总
  const totalBudget = useMemo(
    () => budgets.reduce((sum, b) => sum + (b.budget_amount || 0), 0),
    [budgets],
  );
  const totalSpent = useMemo(
    () => budgets.reduce((sum, b) => sum + (b.spent_amount || 0), 0),
    [budgets],
  );
  const budgetPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // 三列指标：本月结余 / 本月收入 / 本月支出
  const totalCount = (summary?.incomeCount ?? 0) + (summary?.expenseCount ?? 0);
  const metricItems = [
    {
      label: "本月结余",
      value: `¥ ${fmtAmount(balance)}`,
      tone: (balance >= 0 ? "default" as const : "expense" as const),
      meta: `共 ${totalCount} 笔`,
    },
    {
      label: "本月收入",
      value: `¥${fmtAmount(income)}`,
      tone: "income" as const,
      meta: summary?.incomeCount != null ? `${summary.incomeCount} 笔` : "0 笔",
    },
    {
      label: "本月支出",
      value: `¥${fmtAmount(expense)}`,
      tone: "expense" as const,
      meta: summary?.expenseCount != null ? `${summary.expenseCount} 笔` : "0 笔",
    },
  ];

  return (
    <PageLayout
      contentClassName="home-content"
      loading={initialLoading}
      loadingText="加载中…"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      {/* ── 三列统计：本月结余 / 本月收入 / 本月支出 ── */}
      <MetricGrid items={metricItems} columns={3} className="home-metrics" />

      {/* ── 预算大卡片 ── */}
      <View className="budget-card">
        <View className="budget-card__header">
          <Text className="budget-card__title">本月预算</Text>
          <Text className="budget-card__total">
            ¥{fmtAmount(totalSpent)}
            <Text className="budget-card__total-sep"> / </Text>
            ¥{fmtAmount(totalBudget)}
          </Text>
        </View>

        {/* 总进度条 */}
        {totalBudget > 0 && (
          <View className="budget-card__bar-wrap">
            <View
              className={`budget-card__bar ${budgetPercent >= 100 ? "budget-card__bar--over" : ""}`}
              style={{ width: `${Math.min(budgetPercent, 100)}%` }}
            />
          </View>
        )}

        {/* 分类预算明细 */}
        {budgets.length > 0 ? (
          <View className="budget-card__list">
            {budgets.slice(0, 5).map((b) => (
              <View key={b.category_id} className="budget-card__row">
                <View className="budget-card__row-icon">
                  {renderCategoryIcon(b.category_icon || getCategoryIcon(b.category_id), {
                    size: 28,
                    fontScale: 0.85,
                  })}
                </View>
                <View className="budget-card__row-info">
                  <Text className="budget-card__row-name">{b.category_name}</Text>
                  <Text
                    className={`budget-card__row-amt ${b.is_over_budget ? "budget-card__row-amt--over" : ""}`}
                  >
                    ¥{fmtAmount(b.spent_amount)} / ¥{fmtAmount(b.budget_amount)}
                  </Text>
                </View>
                <View className="budget-card__row-bar-wrap">
                  <View
                    className={`budget-card__row-bar ${b.is_over_budget ? "budget-card__row-bar--over" : ""}`}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                  />
                </View>
                <Text
                  className={`budget-card__row-pct ${b.is_over_budget ? "budget-card__row-pct--over" : ""}`}
                >
                  {(b.percentage ?? 0).toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            title="暂无预算设置"
            variant="compact"
            action={
              <Text
                className="budget-card__empty-link"
                onClick={() => Taro.navigateTo({ url: "/pages/Budgets/index" })}
              >
                去设置 ›
              </Text>
            }
          />
        )}
      </View>

      {/* ── 最近交易（卡片式） ── */}
      <AppSection
        title="本月最近交易"
        actionText="全部 ›"
        onAction={() => Taro.switchTab({ url: "/pages/Transactions/index" })}
      >
        {txn.length === 0 ? (
          <EmptyState
            title="暂无交易记录"
            description="记录每一笔交易，掌握家庭收支"
            variant="compact"
          />
        ) : (
          <View className="home-txn-list">
            {txn.map((t: any) => {
              const catName = getCategoryName(t.category) || "其他";
              const catIcon = getCategoryIcon(t.category) || "";
              const isExpense = t.type === "expense";
              return (
                <View
                  key={t.id}
                  className="home-txn-row"
                  onClick={() => {
                    Taro.navigateTo({ url: `/pages/AddTransaction/index?edit=${t.id}` });
                  }}
                >
                  {/* 图标容器：圆角方形背景 */}
                  <View className={`home-txn-icon ${isExpense ? "home-txn-icon--exp" : "home-txn-icon--inc"}`}>
                    {catIcon ? (
                      renderCategoryIcon(catIcon, { size: 28, fontScale: 0.85 })
                    ) : (
                      <Text className="home-txn-icon__fallback">
                        {isExpense ? "支" : "收"}
                      </Text>
                    )}
                  </View>

                  {/* 文字信息 */}
                  <View className="home-txn-body">
                    <Text className="home-txn-name">{t.description || catName}</Text>
                    <Text className="home-txn-meta">{catName} · {(t.date || "").slice(5, 10)}</Text>
                  </View>

                  {/* 金额 */}
                  <Text className={`home-txn-amt ${isExpense ? "home-txn-amt--exp" : "home-txn-amt--inc"}`}>
                    {isExpense ? "−" : "+"}¥{fmtAmount(t.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </AppSection>
    </PageLayout>
  );
}
