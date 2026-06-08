/**
 * Transactions v4 — 流水页（设计稿对齐）
 * 搜索按钮置于胶囊左侧 · 月份Picker · 全部/支出/收入分段 · 日期分组
 */
import { useState, useMemo, useEffect, useRef } from "react";
import { View, Text, Input, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import TransactionItem from "../../components/TransactionItem";
import EmptyState from "../../components/EmptyState";
import PageLayout from "../../components/PageLayout";
import PullRefresh from "../../components/PullRefresh";
import ConfirmDialog from "../../components/ConfirmDialog";
import MonthPicker from "../../components/MonthPicker";
import {
  getTransactions,
  deleteTransaction,
} from "../../services/transactionsApi";
import { useMonthSelector } from "../../hooks/useMonthSelector";
import { useCategoryLookup } from "../../hooks/useCategories";
import { fmtFriendlyDate } from "../../utils/format";
import { useManualQuery } from "../../hooks/useManualQuery";
import type { Transaction, Category } from "../../types";
import "./index.scss";

export default function Transactions() {
  const qc = useQueryClient();
  const router = Taro.useRouter();
  const rp = router.params as Record<string, string | undefined>;

  const urlCategory = rp.category || "";
  const urlType = (rp.type as "all" | "income" | "expense") || "all";
  const urlStart = rp.startDate || "";
  const urlEnd = rp.endDate || "";

  const { year, month, setYear, setMonth, dateRange } = useMonthSelector();
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    urlType,
  );
  const [categoryFilter] = useState<string | null>(urlCategory || null);
  const [search, setSearch] = useState("");
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  useEffect(() => {
    if (urlStart) setYear(Number(urlStart.slice(0, 4)));
    if (urlEnd) setMonth(Number(urlEnd.slice(5, 7)));
  }, [urlStart, urlEnd]);

  const effectiveDateRange = useMemo(
    () => (urlStart && urlEnd ? { start: urlStart, end: urlEnd } : dateRange),
    [urlStart, urlEnd, dateRange],
  );

  const { categories, getCategoryName, getCategoryIcon } = useCategoryLookup();

  const txKey = `tx-${effectiveDateRange.start}-${typeFilter}-${categoryFilter || ""}-${search}-${page}`;
  const { data, isLoading, isFetching } = useManualQuery({
    key: txKey,
    queryFn: () =>
      getTransactions({
        startDate: effectiveDateRange.start,
        endDate: effectiveDateRange.end,
        type: typeFilter !== "all" ? typeFilter : undefined,
        category: categoryFilter || undefined,
        search: search || undefined,
        page,
        pageSize: 20,
        sortBy: "date",
        sortOrder: "desc",
      }),
  });

  const pagesRef = useRef<Map<number, Transaction[]>>(new Map());
  const lastKeyRef = useRef("");
  const filterKey = `${effectiveDateRange.start}-${typeFilter}-${categoryFilter || ""}-${search}`;
  if (lastKeyRef.current !== filterKey) {
    lastKeyRef.current = filterKey;
    pagesRef.current = new Map();
  }
  if (!isLoading && !isFetching && data?.data?.length)
    pagesRef.current.set(page, data.data);

  const allTx = useMemo(
    () =>
      Array.from(pagesRef.current.entries())
        .sort(([a], [b]) => a - b)
        .flatMap(([, txs]) => txs),
    [page, data, isLoading, isFetching],
  );
  const hasMore = (data?.data?.length || 0) >= 20;

  useEffect(() => {
    setPage(1);
  }, [effectiveDateRange.start, typeFilter, categoryFilter, search]);

  const delMut = useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      Taro.showToast({ title: "删除成功", icon: "success" });
      setDeleteTarget(null);
    },
  });

  const grouped = useMemo(() => {
    const g: Record<string, Transaction[]> = {};
    allTx.forEach((tx) => {
      const dk = tx.date.split("T")[0];
      if (!g[dk]) g[dk] = [];
      g[dk].push(tx);
    });
    return g;
  }, [allTx]);

  const daySum = (txs: Transaction[]) => {
    let i = 0,
      e = 0;
    txs.forEach((tx) =>
      tx.type === "income" ? (i += tx.amount) : (e += tx.amount),
    );
    return { income: i, expense: e };
  };

  const sd = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const handleSearchSubmit = () => {
    setSearch(searchText);
  };
  const handleClearSearch = () => {
    setSearchText("");
    setSearch("");
    setShowSearch(false);
  };
  const handleToggleSearch = () => {
    setShowSearch((v) => !v);
    if (showSearch) {
      setSearchText("");
      setSearch("");
    }
  };

  const displayCats = useMemo(() => {
    if (typeFilter === "income") return categories.filter((c: Category) => c.type === "income");
    return categories.filter((c: Category) => c.type === "expense");
  }, [categories, typeFilter]);

  const handleLongPress = (tx: Transaction) => {
    Taro.showActionSheet({
      itemList: ["编辑", "删除"],
      success: (res) => {
        if (res.tapIndex === 0) {
          Taro.setStorageSync("edit_tx_id", tx.id);
          Taro.switchTab({ url: "/pages/AddTransaction/index" });
        } else if (res.tapIndex === 1) {
          setDeleteTarget(tx);
        }
      },
    });
  };

  return (
    <PageLayout
      title="流水"
      tabBar
      rightContent={
        <View className="txns-search-toggle" onClick={handleToggleSearch}>
          <Text className="txns-search-toggle-text">
            {showSearch ? "取消" : "搜索"}
          </Text>
        </View>
      }
      onScrollToLower={() => {
        if (hasMore && !isFetching) setPage((p) => p + 1);
      }}
    >
      {/* Search Bar — collapsible, placed below nav */}
      {showSearch && (
        <View className="txns-search-bar animate-fade-in">
          <View className="txns-search-input-wrap">
            <Text className="txns-search-icon">🔍</Text>
            <Input
              className="txns-search-input"
              placeholder="搜索交易描述…"
              value={searchText}
              onInput={(e: any) => setSearchText(e.detail.value)}
              onConfirm={handleSearchSubmit}
              focus
            />
            {searchText ? (
              <Text className="txns-search-clear" onClick={handleClearSearch}>
                ✕
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Month Picker — 使用组件 */}
      <View className="txns-month-row">
        <MonthPicker
          year={year}
          month={month}
          onChange={(y, m) => { setYear(y); setMonth(m); }}
        />
      </View>

      {/* Type Segmented */}
      <View className="txns-seg-wrap">
        <View className="segmented-control">
          <Text
            className={`segmented-item ${typeFilter === "all" ? "segmented-item-active" : ""}`}
            onClick={() => setTypeFilter("all")}
          >
            全部
          </Text>
          <Text
            className={`segmented-item ${typeFilter === "expense" ? "segmented-item-active" : ""}`}
            onClick={() => setTypeFilter("expense")}
          >
            支出
          </Text>
          <Text
            className={`segmented-item ${typeFilter === "income" ? "segmented-item-active" : ""}`}
            onClick={() => setTypeFilter("income")}
          >
            收入
          </Text>
        </View>
      </View>

      {/* Category slider chips (horizontal scroll) */}
      <ScrollView className="txns-cat-scroll" scrollX enableFlex>
        <View className="txns-cat-scroll-inner">
          <View
            className={`txns-cat-chip ${!categoryFilter ? "txns-cat-chip--active" : ""}`}
            onClick={() => {
              const rp = { ...router.params, category: undefined } as any;
              delete rp.category;
              Taro.navigateTo({
                url: `/pages/Transactions/index?type=${typeFilter}&startDate=${effectiveDateRange.start}&endDate=${effectiveDateRange.end}`,
              });
            }}
          >
            <Text>全部</Text>
          </View>
          {displayCats.map((c: Category) => (
            <View
              key={c.id}
              className={`txns-cat-chip ${categoryFilter === c.id ? "txns-cat-chip--active" : ""}`}
              onClick={() =>
                Taro.navigateTo({
                  url: `/pages/Transactions/index?category=${c.id}&type=${typeFilter}&startDate=${effectiveDateRange.start}&endDate=${effectiveDateRange.end}`,
                })
              }
            >
              <Text>{c.icon}</Text>
              <Text>{c.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Transaction List */}
      {isLoading ? (
        <View className="txns-loading">
          <PullRefresh loading text="拉取流水数据…" />
          <View className="skeleton" style={{ height: "90rpx", marginBottom: "12rpx", borderRadius: "var(--radius-lg)" }} />
          <View className="skeleton" style={{ height: "90rpx", marginBottom: "12rpx", borderRadius: "var(--radius-lg)" }} />
          <View className="skeleton" style={{ height: "90rpx", marginBottom: "12rpx", borderRadius: "var(--radius-lg)" }} />
        </View>
      ) : sd.length === 0 ? (
        <EmptyState
          icon="📋"
          title="暂无交易记录"
          description="还没有这个月的交易数据"
        />
      ) : (
        <View className="txns-list">
          {sd.map((dk) => {
            const sum = daySum(grouped[dk]);
            return (
              <View key={dk} className="txns-group">
                <View className="txns-group-header">
                  <Text className="txns-group-date">{fmtFriendlyDate(dk)}</Text>
                  <View className="flex gap-2">
                    {sum.expense > 0 && (
                      <Text className="txns-group-total-expense">
                        支出 ¥{sum.expense.toFixed(2)}
                      </Text>
                    )}
                    {sum.income > 0 && (
                      <Text className="txns-group-total-income">
                        收入 ¥{sum.income.toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
                <View className="card">
                  {grouped[dk].map((tx) => {
                    return (
                      <TransactionItem
                        key={tx.id}
                        icon={getCategoryIcon(tx.category)}
                        categoryName={getCategoryName(tx.category)}
                        description={tx.description}
                        amount={tx.amount}
                        type={tx.type}
                        date={tx.date?.split("T")[1]?.slice(0, 5) || ""}
                        onClick={() => {
                          Taro.setStorageSync("edit_tx_id", tx.id);
                          Taro.switchTab({ url: "/pages/AddTransaction/index" });
                        }}
                        onLongPress={() => handleLongPress(tx)}
                        onDelete={() => setDeleteTarget(tx)}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })}
          {isFetching && (
            <View className="txns-load-more">加载中…</View>
          )}
        </View>
      )}

      <ConfirmDialog
        visible={!!deleteTarget}
        title="确认删除"
        message="确定删除这笔交易记录吗？不可恢复。"
        confirmText="确认删除"
        confirmLoading={delMut.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && delMut.mutate(deleteTarget.id)}
      />
    </PageLayout>
  );
}
