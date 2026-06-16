/**
 * Transactions — 流水页
 * 结构: 筛选 Tab + 交易列表 (TransactionItem)
 */
import { useState, useEffect, useCallback } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageLayout from "../../components/PageLayout";
import TransactionItem from "../../components/TransactionItem";
import { getTransactions } from "../../services/transactionsApi";
import { useCategoryLookup } from "../../hooks/useCategories";
import "./index.scss";

type FilterKey = "all" | "expense" | "income" | "week7" | "month";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "expense", label: "支出" },
  { key: "income", label: "收入" },
  { key: "week7", label: "近7天" },
  { key: "month", label: "本月" },
];

const PAGE_SIZE = 20;

function dateRange(key: FilterKey): { start?: string; end?: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const end = fmt(now);
  if (key === "week7") {
    const d = new Date(now);
    d.setDate(now.getDate() - 6);
    return { start: fmt(d), end };
  }
  if (key === "month") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: fmt(d), end };
  }
  return {};
}

export default function Transactions() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [txn, setTxn] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { getCategoryName, getCategoryIcon } = useCategoryLookup();

  const fetchPage = useCallback(
    (targetPage: number, currentList: any[], replace: boolean) => {
      const r = dateRange(filter);
      if (replace) setLoading(true);
      else setLoadingMore(true);
      return getTransactions({
        type: filter === "expense" || filter === "income" ? filter : undefined,
        startDate: r.start,
        endDate: r.end,
        page: targetPage,
        pageSize: PAGE_SIZE,
      })
        .then((res: any) => {
          const list: any[] = res?.data || [];
          const next = replace ? list : [...currentList, ...list];
          setTxn(next);
          setHasMore(list.length === PAGE_SIZE);
          setPage(targetPage);
          return next;
        })
        .catch(() => {
          if (replace) setTxn([]);
          setHasMore(false);
          return replace ? [] : currentList;
        })
        .finally(() => {
          setLoading(false);
          setLoadingMore(false);
        });
    },
    [filter],
  );

  useEffect(() => {
    fetchPage(1, [], true);
  }, [fetchPage]);

  const handleRefresh = () =>
    new Promise<void>((resolve) => {
      setRefreshing(true);
      fetchPage(1, [], true)
        .catch(() => {})
        .finally(() => {
          setRefreshing(false);
          resolve();
        });
    });

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchPage(page + 1, txn, false);
  };

  return (
    <PageLayout
      contentClassName="txns-content"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      onLoadMore={handleLoadMore}
      hasMore={hasMore}
      loadingMore={loadingMore}
      header={
        <View className="filter-scroll">
          {FILTERS.map((f) => (
            <View
              key={f.key}
              className={`filter-chip ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              <Text>{f.label}</Text>
            </View>
          ))}
        </View>
      }
    >
      <View className="section-card txn-list">
        {loading && txn.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-text">加载中…</Text>
          </View>
        ) : txn.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-text">暂无流水记录</Text>
          </View>
        ) : (
          <View>
            {txn.map((t: any) => {
              const catName = getCategoryName(t.category) || "其他";
              const catIcon = getCategoryIcon(t.category) || "📌";
              return (
                <TransactionItem
                  key={t.id}
                  icon={catIcon}
                  categoryName={catName}
                  description={t.description}
                  brand={t.brand}
                  amount={parseFloat(t.amount) || 0}
                  type={t.type === "income" ? "income" : "expense"}
                  date={(t.date || "").slice(0, 10)}
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
    </PageLayout>
  );
}
