/**
 * Home — 首页（增强版）
 * 结构:
 *   .stat-card.hero — 本月结余
 *   .stat-split — 收入 / 支出
 *   .section-card — 预算进度
 *   .section-card — 最近交易（全部 →）
 *   .section-card — 快捷记账（4列 .cat-grid）
 *   .fab — 右下角 +
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageLayout from "../../components/PageLayout";
import { AppSection, PageHero, MetricGrid, FloatingAction } from "../../components/ui";
import { getTransactions } from "../../services/transactionsApi";
import { fetchSummary } from "../../services/statisticsApi";
import { fetchBudgetStatus } from "../../services/budgetsApi";
import { useCategoryLookup } from "../../hooks/useCategories";
import { useAuth } from "../../context/AuthContext";
import { fmtAmount } from "../../utils/format";
import { renderCategoryIcon } from "../../utils/renderCategoryIcon";
import "./index.scss";

interface BudgetStatus {
  category_id: string;
  category_name: string;
  budget_amount: number;
  spent_amount: number;
  percentage: number;
  is_over_budget: boolean;
}

export default function Home() {
  const { categories, getCategoryName, getCategoryIcon } = useCategoryLookup();
  const { user, loading } = useAuth();
  const [txn, setTxn] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    // 未登录不请求接口，由 AuthGuard 跳转登录页
    if (!user) {
      return Promise.resolve();
    }
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const startDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const endDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const monthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    return Promise.all([
      fetchSummary({ startDate, endDate }).then((s: any) => setSummary(s)),
      getTransactions({ page: 1, pageSize: 5 })
        .then((r: any) => setTxn(r.data || []))
        .catch(() => setTxn([])),
      fetchBudgetStatus(monthStr).then((b: any) => {
        const cats = (b?.categories || []).map((c: any) => ({
          category_id: c.category_id,
          category_name: c.category_name,
          budget_amount: c.budget,
          spent_amount: c.spent,
          percentage: c.progress ?? 0,
          is_over_budget: c.status === "over",
        }));
        setBudgets(cats);
      }).catch(() => setBudgets([])),
    ]);
  }, [user]);

  useEffect(() => {
    // 等待认证状态初始化完成，且已登录才请求
    if (loading) return;
    if (!user) return;
    loadData().catch(() => {});
  }, [loading, user, loadData]);

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
  const metricItems = [
    { label: "收入", value: `¥${fmtAmount(income)}`, tone: "income" as const, meta: `${txn.length} 笔交易` },
    { label: "支出", value: `¥${fmtAmount(expense)}`, tone: "expense" as const, meta: "本月累计" },
  ];

  // 快捷记账分类（支出类 8 个）
  const quickCats = useMemo(
    () =>
      (categories || [])
        .filter((c: any) => c.type === "expense")
        .slice(0, 8),
    [categories],
  );

  return (
    <>
    <PageLayout
      contentClassName="home-content"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <PageHero
        eyebrow="家庭记账"
        title="本月结余"
        value={`¥ ${fmtAmount(balance)}`}
        meta={`${txn.length} 笔交易 · ${income >= expense ? "保持顺差" : "需要控制支出"}`}
      />

      <MetricGrid items={metricItems} className="home-metrics" />

      {budgets.length > 0 && (
        <AppSection
          title="预算进度"
          actionText="管理 ›"
          onAction={() => Taro.navigateTo({ url: "/pages/Budgets/index" })}
        >
          <View className="budget-list">
            {budgets.slice(0, 4).map((budget) => (
              <View key={budget.category_id} className="budget-item">
                <View className="budget-info">
                  <Text className="budget-name">{budget.category_name}</Text>
                  <Text className={`budget-amount ${budget.is_over_budget ? "over" : ""}`}>
                    ¥{fmtAmount(budget.spent_amount)} / ¥{fmtAmount(budget.budget_amount)}
                  </Text>
                </View>
                <View className="budget-bar-wrap">
                  <View
                    className={`budget-bar ${budget.is_over_budget ? "over" : ""}`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </View>
                <Text className={`budget-percentage ${budget.is_over_budget ? "over" : ""}`}>
                  {(budget.percentage ?? 0).toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        </AppSection>
      )}

      <AppSection
        title="最近交易"
        actionText="全部 ›"
        onAction={() => Taro.switchTab({ url: "/pages/Transactions/index" })}
        flush
      >
        {txn.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-text">暂无交易记录</Text>
          </View>
        ) : (
          <View>
            {txn.map((t: any) => {
              const catName = getCategoryName(t.category) || "其他";
              const catIcon = getCategoryIcon(t.category) || "📌";
              const amt = t.amount;
              return (
                <View
                  key={t.id}
                  className="txn-row"
                  onClick={() => {
                    Taro.setStorageSync("edit_tx_id", t.id);
                    Taro.navigateTo({ url: "/pages/AddTransaction/index" });
                  }}
                >
                  <View className="txn-icon">
                    {renderCategoryIcon(catIcon, { size: 40 })}
                  </View>
                  <View className="txn-info">
                    <Text className="txn-title">{t.description || catName}</Text>
                    <Text className="txn-meta">{catName} · {(t.date || "").slice(5)}</Text>
                  </View>
                  <Text className={`txn-amount ${t.type === "expense" ? "debit" : "credit"}`}>
                    {t.type === "expense" ? "-" : "+"}¥{fmtAmount(amt)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </AppSection>

      <AppSection title="快捷记账" compact>
        <View className="cat-grid">
          {quickCats.map((c: any) => (
            <View
                key={c.id}
                className="cat-item"
                onClick={() =>
                  Taro.navigateTo({
                    url: `/pages/AddTransaction/index?category=${c.id}&type=expense`,
                  })
                }
              >
                {renderCategoryIcon(c.icon || "📌", { size: 72, className: "ci-emoji" })}
                <Text className="ci-name">{c.name}</Text>
              </View>
          ))}
        </View>
      </AppSection>
    </PageLayout>

    <FloatingAction onClick={() => Taro.navigateTo({ url: "/pages/AddTransaction/index" })} />
    </>
  );
}
