/**
 * Home — 首页（1:1 严格按设计稿）
 * 结构:
 *   .stat-card.hero — 本月结余
 *   .stat-split — 收入 / 支出
 *   .section-card — 最近交易（全部 →）
 *   .section-card — 快捷记账（4列 .cat-grid）
 *   .fab — 右下角 +
 */
import { useEffect, useMemo, useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageLayout from "../../components/PageLayout";
import { getTransactions } from "../../services/transactionsApi";
import { fetchSummary } from "../../services/statisticsApi";
import { useCategoryLookup } from "../../hooks/useCategories";
import { fmtAmount } from "../../utils/format";
import "./index.scss";

export default function Home() {
  const { categories, getCategoryName, getCategoryIcon } = useCategoryLookup();
  const [txn, setTxn] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const startDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const endDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    return Promise.all([
      fetchSummary({ startDate, endDate }).then((s: any) => setSummary(s)),
      getTransactions({ page: 1, pageSize: 5 })
        .then((r: any) => setTxn(r.data || []))
        .catch(() => setTxn([])),
    ]);
  };

  useEffect(() => {
    loadData().catch(() => {});
  }, []);

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
                    <Text>{catIcon}</Text>
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
              <Text className="ci-emoji">{c.icon || "📌"}</Text>
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