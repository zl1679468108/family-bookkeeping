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
import { useEffect, useMemo, useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageLayout from "../../components/PageLayout";
import { getTransactions } from "../../services/transactionsApi";
import { fetchSummary, fetchBudgetStatus } from "../../services/statisticsApi";
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

  const loadData = () => {
    // 未登录不请求接口，由 AuthGuard 跳转登录页
    if (!user) {
      return Promise.resolve();
    }
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const startDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const endDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const monthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    return Promise.all([
      fetchSummary({ startDate, endDate }).then((s: any) => setSummary(s)),
      getTransactions({ page: 1, pageSize: 5 })
        .then((r: any) => setTxn(r.data || []))
        .catch(() => setTxn([])),
      fetchBudgetStatus({ month: monthStr }).then((b: any) => setBudgets(b || [])).catch(() => setBudgets([])),
    ]);
  };

  useEffect(() => {
    // 等待认证状态初始化完成，且已登录才请求
    if (loading) return;
    if (!user) return;
    loadData().catch(() => {});
  }, [loading, user]);

  const handleRefresh = () => {
    return new Promise<void>((resolve) => {
      setRefreshing(true);
      loadData()
        .catch(() => {})
        .finally(() => {
          setRefreshing(false);
          resolve();
        });
    });
  };

  const expense = summary?.totalExpense ?? 0;
  const income = summary?.totalIncome ?? 0;
  const balance = income - expense;

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
      {/* ===== Hero 结余卡片 ===== */}
      <View className="stat-card hero">
        <Text className="stat-label">本月结余</Text>
        <Text className="stat-value">¥ {fmtAmount(balance)}</Text>
        <Text className="stat-meta">{txn.length} 笔交易</Text>
      </View>

      {/* ===== 收入 / 支出 双卡片 ===== */}
      <View className="stat-split">
        <View className="stat-card">
          <Text className="stat-label">收入</Text>
          <Text className="stat-value income-value">¥{fmtAmount(income)}</Text>
        </View>
        <View className="stat-card">
          <Text className="stat-label">支出</Text>
          <Text className="stat-value expense-value">¥{fmtAmount(expense)}</Text>
        </View>
      </View>

      {/* ===== 预算进度 ===== */}
      {budgets.length > 0 && (
        <View className="section-card">
          <View className="section-header">
            <Text className="section-title">预算进度</Text>
            <Text className="section-action" onClick={() => Taro.navigateTo({ url: "/pages/Budgets/index" })}>
              管理 ›
            </Text>
          </View>
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
                  {budget.percentage.toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ===== 最近交易 ===== */}
      <View className="section-card">
        <View className="section-header">
          <Text className="section-title">最近交易</Text>
          <Text className="section-action" onClick={() => Taro.switchTab({ url: "/pages/Transactions/index" })}>
            全部 ›
          </Text>
        </View>

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
      </View>

      {/* ===== 快捷记账 ===== */}
      <View className="section-card">
        <View className="section-header">
          <Text className="section-title">快捷记账</Text>
        </View>
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
      </View>
    </PageLayout>

    {/* FAB - 屏幕固定定位的右下角 + 按钮 */}
    <View className="fab" onClick={() => Taro.navigateTo({ url: "/pages/AddTransaction/index" })}>
      <Text>+</Text>
    </View>
    </>
  );
}