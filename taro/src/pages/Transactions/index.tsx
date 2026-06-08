/**
 * Transactions — v3.0 流水页
 * 白底导航 · 搜索 · 月份/类型/分类筛选 · 日期分组 · 左滑删除 · 分页
 */
import { useState, useMemo, useEffect, useRef } from "react";
import { View, Text, Input, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TransactionItem from "../../components/TransactionItem";
import EmptyState from "../../components/EmptyState";
import PageLayout from "../../components/PageLayout";
import PullRefresh from "../../components/PullRefresh";
import Icon from "../../components/Icon";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  getTransactions,
  deleteTransaction,
} from "../../services/transactionsApi";
import { useMonthSelector } from "../../hooks/useMonthSelector";
import { useCategoryLookup } from "../../hooks/useCategories";
import { fmtFriendlyDate } from "../../utils/format";
import type { Transaction } from "../../types";
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
  const [categoryFilter, setCategoryFilter] = useState<string | null>(
    urlCategory || null,
  );
  const [search, setSearch] = useState("");
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc" | undefined>(
    undefined,
  );
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

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "transactions",
      "list",
      effectiveDateRange,
      typeFilter,
      categoryFilter,
      search,
      page,
      sortOrder,
    ],
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
        sortOrder: sortOrder || "desc",
      }),
    staleTime: 30_000,
  });

  const pagesRef = useRef<Map<number, Transaction[]>>(new Map());
  const lastKeyRef = useRef("");
  const filterKey = `${effectiveDateRange.start}-${typeFilter}-${categoryFilter || ""}-${search}-${sortOrder}`;
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

  const pickerValue = `${year}-${String(month).padStart(2, "0")}`;
  const handleMonthChange = (e: any) => {
    const [y, m] = e.detail.value.split("-").map(Number);
    setYear(y);
    setMonth(m);
  };

  const expenseCats = useMemo(
    () => categories.filter((c) => c.type === "expense").slice(0, 6),
    [categories],
  );
  const incomeCats = useMemo(
    () => categories.filter((c) => c.type === "income").slice(0, 6),
    [categories],
  );

  const handleLongPress = (tx: Transaction) => {
    Taro.showActionSheet({
      itemList: ["编辑", "删除"],
      success: (res) => {
        if (res.tapIndex === 0) {
          Taro.navigateTo({ url: `/pages/AddTransaction/index?edit=${tx.id}` });
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
          <Icon
            name={showSearch ? "close" : "search"}
            size={40}
            color="var(--color-text-secondary)"
          />
        </View>
      }
      onScrollToLower={() => {
        if (hasMore && !isFetching) setPage((p) => p + 1);
      }}
    >
      {/* Search Bar — collapsible */}
      {showSearch && (
        <View className="txns-search-bar animate-fade-in">
          <View className="txns-nav-search">
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

      {/* Filters */}
      <View className="txns-filters">
        {/* Date + type chips */}
        <View className="flex gap-1 mb-1">
          <View className="txns-date-btn">
            <Picker
              mode="date"
              fields="month"
              value={pickerValue}
              onChange={handleMonthChange}
            >
              <Text>
                {year}年{month}月 ▾
              </Text>
            </Picker>
          </View>
          <Text
            className={`tag ${typeFilter === "all" ? "tag-active" : "tag-inactive"}`}
            onClick={() => setTypeFilter("all")}
          >
            全部
          </Text>
          <Text
            className={`tag ${typeFilter === "expense" ? "tag-active" : "tag-inactive"}`}
            onClick={() => setTypeFilter("expense")}
          >
            支出
          </Text>
          <Text
            className={`tag ${typeFilter === "income" ? "tag-active" : "tag-inactive"}`}
            onClick={() => setTypeFilter("income")}
          >
            收入
          </Text>
          <Text
            className="txns-sort-btn"
            onClick={() =>
              setSortOrder((o) =>
                o === "desc" ? "asc" : o === "asc" ? undefined : "desc",
              )
            }
          >
            金额{sortOrder === "desc" ? "↓" : sortOrder === "asc" ? "↑" : "▾"}
          </Text>
        </View>
        {/* Category chips */}
        <View className="flex gap-1">
          {(typeFilter === "income" ? incomeCats : expenseCats).map((c) => (
            <Text
              key={c.id}
              className={`tag ${categoryFilter === c.id ? "tag-active" : "tag-inactive"}`}
              onClick={() =>
                setCategoryFilter(categoryFilter === c.id ? null : c.id)
              }
            >
              {c.icon} {c.name}
            </Text>
          ))}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="txns-loading">
          <PullRefresh loading={true} text="拉取流水数据…" />
          <View
            className="skeleton"
            style={{
              height: "90rpx",
              marginBottom: "12rpx",
              borderRadius: "var(--radius-lg)",
            }}
          />
          <View
            className="skeleton"
            style={{
              height: "90rpx",
              marginBottom: "12rpx",
              borderRadius: "var(--radius-lg)",
            }}
          />
          <View
            className="skeleton"
            style={{
              height: "90rpx",
              marginBottom: "12rpx",
              borderRadius: "var(--radius-lg)",
            }}
          />
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
                      <Text className="text-sm text-expense font-semibold">
                        支出 ¥{sum.expense.toFixed(2)}
                      </Text>
                    )}
                    {sum.income > 0 && (
                      <Text className="text-sm text-income font-semibold">
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
                        categoryType={getCategoryName(tx.category)}
                        onClick={() =>
                          Taro.navigateTo({
                            url: `/pages/AddTransaction/index?edit=${tx.id}`,
                          })
                        }
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
            <View
              style={{
                textAlign: "center",
                padding: "24rpx",
                color: "var(--color-text-hint)",
                fontSize: "var(--font-sm)",
              }}
            >
              加载中…
            </View>
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
