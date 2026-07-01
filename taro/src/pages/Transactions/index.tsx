/**
 * Transactions — 流水页（增强版）
 * 结构: 搜索框 + 筛选 Tab + 分类筛选 + 统计汇总 + 交易列表 + 交易详情弹窗
 * 支持批量选择和删除
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, Text, Input, ScrollView, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageLayout from "../../components/PageLayout";
import EmptyState from "../../components/EmptyState";
import TransactionItem from "../../components/TransactionItem";
import { AppSection, MetricGrid } from "../../components/ui";
import { getTransactions, deleteTransaction, batchDeleteTransactions } from "../../services/transactionsApi";
import { useCategoryLookup } from "../../hooks/useCategories";
import { useCategoryList } from "../../hooks/useCategories";
import { useAuth } from "../../context/AuthContext";
import { fmtAmount } from "../../utils/format";
import { renderCategoryIcon } from "../../utils/renderCategoryIcon";
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

// T-M10: AbortController 引用，用于取消前序请求
let currentAbortController: AbortController | null = null;

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
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [categoryId, setCategoryId] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [txn, setTxn] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const { getCategoryName, getCategoryIcon } = useCategoryLookup();
  const { categories } = useCategoryList();

  // 批量选择模式
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // 查看范围：own=只看自己，all=全部成员
  const [viewScope, setViewScope] = useState<"own" | "all">("own");

  const filteredCategories = useMemo(() => {
    const type = filter === "expense" ? "expense" : filter === "income" ? "income" : undefined;
    return categories.filter((c) => !type || c.type === type);
  }, [categories, filter]);

  // 核心异步请求函数，使用 ref 避免闭包陷阱
  const doFetch = useCallback(
    async (targetPage: number, currentList: any[], replace: boolean, scope: "own" | "all") => {
      const r = dateRange(filter);
      if (replace) setLoading(true);
      else setLoadingMore(true);
      try {
        const res: any = await getTransactions({
          type: filter === "expense" || filter === "income" ? filter : undefined,
          startDate: r.start,
          endDate: r.end,
          category: categoryId || undefined,
          search: searchKeyword.trim() || undefined,
          page: targetPage,
          pageSize: PAGE_SIZE,
          view: scope,
        });
        const list: any[] = res?.data || [];
        const next = replace ? list : [...currentList, ...list];
        setTxn(next);
        setHasMore(list.length === PAGE_SIZE);
        setPage(targetPage);
        return next;
      } catch {
        if (replace) setTxn([]);
        setHasMore(false);
        return replace ? [] : currentList;
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter, categoryId, searchKeyword],
  );

  // 初始加载：仅认证完成后触发一次
  useEffect(() => {
    if (authLoading || !user) return;
    doFetch(1, [], true, viewScope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleRefresh = useCallback(() =>
    new Promise<void>((resolve) => {
      setRefreshing(true);
      doFetch(1, [], true, viewScope)
        .catch(() => {})
        .finally(() => {
          setRefreshing(false);
          resolve();
        });
    }),
  [doFetch, viewScope]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    doFetch(page + 1, txn, false, viewScope);
  }, [loadingMore, hasMore, page, txn, doFetch, viewScope]);

  const handleSearch = useCallback(() => {
    setPage(1);
    doFetch(1, [], true, viewScope);
  }, [doFetch, viewScope]);

  const handleClearSearch = useCallback(() => {
    setSearchKeyword("");
    setPage(1);
    doFetch(1, [], true, viewScope);
  }, [doFetch, viewScope]);

  const handleCategoryChange = useCallback((catId: string) => {
    setCategoryId(catId);
    setPage(1);
    // T-M10: 取消前序请求，不再用 setTimeout
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();
    doFetch(1, [], true, viewScope);
  }, [doFetch, viewScope]);

  const handleFilterChange = useCallback((key: FilterKey) => {
    setFilter(key);
    setPage(1);
    // T-M10: 取消前序请求，不再用 setTimeout
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();
    doFetch(1, [], true, viewScope);
  }, [doFetch, viewScope]);

  const handleTxnClick = (t: any) => {
    setSelectedTxn(t);
    setShowDetail(true);
  };

  const handleEdit = () => {
    if (selectedTxn) {
      Taro.setStorageSync("edit_tx_id", selectedTxn.id);
      setShowDetail(false);
      Taro.navigateTo({ url: "/pages/AddTransaction/index" });
    }
  };

  const handleDelete = () => {
    if (!selectedTxn) return;
    Taro.showModal({
      title: "确认删除",
      content: "确定要删除这笔交易吗？",
      success: async (res) => {
        if (res.confirm && selectedTxn) {
          try {
            await deleteTransaction(selectedTxn.id);
            setTxn(txn.filter((t) => t.id !== selectedTxn.id));
            Taro.showToast({ title: "删除成功", icon: "success" });
          } catch {
            Taro.showToast({ title: "删除失败", icon: "none" });
          } finally {
            setShowDetail(false);
            setSelectedTxn(null);
          }
        }
      },
    });
  };

  // 批量选择切换
  const toggleBatchMode = () => {
    if (batchMode) {
      // 退出批量模式，清空选择
      setSelectedIds(new Set());
    }
    setBatchMode(!batchMode);
  };

  // 切换选中状态
  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // 全选
  const handleSelectAll = () => {
    if (selectedIds.size === txn.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(txn.map((t) => t.id)));
    }
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    Taro.showModal({
      title: "确认删除",
      content: `确定要删除选中的 ${selectedIds.size} 笔交易吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const idsToDelete = Array.from(selectedIds);
            await batchDeleteTransactions(idsToDelete);
            setTxn(txn.filter((t) => !selectedIds.has(t.id)));
            setSelectedIds(new Set());
            setBatchMode(false);
            Taro.showToast({ title: "删除成功", icon: "success" });
          } catch {
            Taro.showToast({ title: "批量删除失败", icon: "none" });
          }
        }
      },
    });
  };

  // 范围切换
  const toggleViewScope = useCallback(() => {
    const newScope = viewScope === "own" ? "all" : "own";
    setViewScope(newScope as "own" | "all");
    setPage(1);
    setTimeout(() => doFetch(1, [], true, newScope), 0);
  }, [viewScope, doFetch]);

  const stats = useMemo(() => {
    return txn.reduce(
      (acc, t) => {
        const amount = parseFloat(t.amount) || 0;
        if (t.type === "income") {
          acc.income += amount;
        } else {
          acc.expense += amount;
        }
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [txn]);

  const currentCategoryName = useMemo(() => {
    if (!categoryId) return "全部分类";
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || "全部分类";
  }, [categoryId, categories]);

  return (
    <PageLayout
      contentClassName="txns-content"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      onLoadMore={handleLoadMore}
      hasMore={hasMore}
      loadingMore={loadingMore}
    >
      <AppSection title="流水筛选" subtitle={viewScope === "own" ? "当前仅看我的记录" : "当前查看全部成员"} compact>
        <View className="search-bar">
          <Input
            className="search-input"
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
            placeholder="搜索描述或品牌"
            confirmType="search"
            onConfirm={handleSearch}
          />
          {searchKeyword && (
            <Text className="search-clear" onClick={handleClearSearch}>×</Text>
          )}
        </View>

        <ScrollView scrollX className="filter-scroll">
          {FILTERS.map((f) => (
            <View
              key={f.key}
              className={`filter-chip ${filter === f.key ? "active" : ""}`}
              onClick={() => handleFilterChange(f.key)}
            >
              <Text>{f.label}</Text>
            </View>
          ))}
        </ScrollView>

        <View className="category-filter">
          <View className="category-picker" onClick={() => Taro.showActionSheet({
            itemList: ["全部分类", ...filteredCategories.map((c) => c.name)],
            success: (res) => {
              const idx = res.tapIndex;
              if (idx === 0) {
                handleCategoryChange("");
              } else {
                const cat = filteredCategories[idx - 1];
                handleCategoryChange(cat.id);
              }
            },
          })}>
            <Text className="category-label">{currentCategoryName}</Text>
            <Text className="category-arrow">⌄</Text>
          </View>
        </View>
      </AppSection>

      <MetricGrid
        columns={3}
        items={[
          { label: "收入", value: `¥${fmtAmount(stats.income)}`, tone: "income" },
          { label: "支出", value: `¥${fmtAmount(stats.expense)}`, tone: "expense" },
          {
            label: "结余",
            value: `¥${fmtAmount(stats.income - stats.expense)}`,
            tone: stats.income >= stats.expense ? "income" : "expense",
          },
        ]}
        className="txns-metrics"
      />

      {/* 操作栏：批量选择 + 查看范围 */}
      <View className="action-bar">
        <View className="action-scope" onClick={toggleViewScope}>
          <Text className={`scope-tag ${viewScope === "all" ? "active" : ""}`}>
            {viewScope === "own" ? "我的" : "全部"}
          </Text>
        </View>
        <View className="action-batch" onClick={toggleBatchMode}>
          <Text className={`batch-tag ${batchMode ? "active" : ""}`}>
            {batchMode ? "取消" : "批量"}
          </Text>
        </View>
      </View>

      {/* 批量操作栏 */}
      {batchMode && (
        <View className="batch-bar">
          <View className="batch-select-all" onClick={handleSelectAll}>
            <Text className="batch-text">
              {selectedIds.size === txn.length ? "取消全选" : "全选"}
            </Text>
          </View>
          <View className="batch-info">
            <Text className="batch-count">已选 {selectedIds.size} 笔</Text>
          </View>
          <View
            className={`batch-delete ${selectedIds.size === 0 ? "disabled" : ""}`}
            onClick={handleBatchDelete}
          >
            <Text className="batch-delete-text">删除</Text>
          </View>
        </View>
      )}

      <AppSection title="交易列表" className="txn-list" flush>
        {loading && txn.length === 0 ? (
          <EmptyState icon="note" title="加载中..." />
        ) : txn.length === 0 ? (
          <EmptyState icon="transactions" title="暂无流水记录" description="调整筛选条件或新增一笔账单" />
        ) : (
          <View>
            {txn.map((t: any) => {
              const catName = getCategoryName(t.category) || "其他";
              const catIcon = getCategoryIcon(t.category) || "📌";
              const isSelected = selectedIds.has(t.id);
              return batchMode ? (
                <View
                  key={t.id}
                  className={`txn-item-with-checkbox ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleSelect(t.id)}
                >
                  <View className={`checkbox ${isSelected ? "checked" : ""}`}>
                    {isSelected && <Text className="checkbox-check">✓</Text>}
                  </View>
                  <View className="txn-item-content">
                    <TransactionItem
                      icon={catIcon}
                      categoryName={catName}
                      description={t.description}
                      brand={t.brand}
                      amount={parseFloat(t.amount) || 0}
                      type={t.type === "income" ? "income" : "expense"}
                      date={(t.date || "").slice(0, 10)}
                      onClick={() => {}}
                      hasImage={t.image_url_list && t.image_url_list.length > 0}
                    />
                  </View>
                </View>
              ) : (
                <TransactionItem
                  key={t.id}
                  icon={catIcon}
                  categoryName={catName}
                  description={t.description}
                  brand={t.brand}
                  amount={parseFloat(t.amount) || 0}
                  type={t.type === "income" ? "income" : "expense"}
                  date={(t.date || "").slice(0, 10)}
                  onClick={() => handleTxnClick(t)}
                  hasImage={t.image_url_list && t.image_url_list.length > 0}
                />
              );
            })}
          </View>
        )}
      </AppSection>

      {/* 交易详情弹窗 */}
      {showDetail && selectedTxn && (
        <View className="detail-mask" onClick={() => setShowDetail(false)}>
          <View className="detail-dialog" onClick={(e) => e.stopPropagation()}>
            <View className="detail-header">
              <Text className="detail-title">交易详情</Text>
              <Text className="detail-close" onClick={() => setShowDetail(false)}>✕</Text>
            </View>
            <View className="detail-content">
              <View className="detail-main">
                <View className="detail-icon">{renderCategoryIcon(getCategoryIcon(selectedTxn.category) || "📌", { size: 44 })}</View>
                <View className="detail-info">
                  <Text className="detail-category">{getCategoryName(selectedTxn.category) || "其他"}</Text>
                  <Text className="detail-type">{selectedTxn.type === "income" ? "收入" : "支出"}</Text>
                </View>
                <Text className={`detail-amount ${selectedTxn.type === "income" ? "income" : "expense"}`}>
                  {selectedTxn.type === "income" ? "+" : "-"}¥{fmtAmount(parseFloat(selectedTxn.amount) || 0)}
                </Text>
              </View>
              {selectedTxn.description && (
                <View className="detail-row">
                  <Text className="detail-label">描述</Text>
                  <Text className="detail-value">{selectedTxn.description}</Text>
                </View>
              )}
              {selectedTxn.brand && (
                <View className="detail-row">
                  <Text className="detail-label">品牌</Text>
                  <Text className="detail-value">{selectedTxn.brand}</Text>
                </View>
              )}
              {selectedTxn.counterparty && (
                <View className="detail-row">
                  <Text className="detail-label">对方</Text>
                  <Text className="detail-value">{selectedTxn.counterparty}</Text>
                </View>
              )}
              {selectedTxn.location && (
                <View className="detail-row">
                  <Text className="detail-label">地点</Text>
                  <Text className="detail-value">{selectedTxn.location}</Text>
                </View>
              )}
              {selectedTxn.date && (
                <View className="detail-row">
                  <Text className="detail-label">日期</Text>
                  <Text className="detail-value">{selectedTxn.date}</Text>
                </View>
              )}
              {selectedTxn.image_url_list && selectedTxn.image_url_list.length > 0 && (
                <View className="detail-images">
                  <Text className="detail-label">附件</Text>
                  <View className="image-grid">
                    {selectedTxn.image_url_list.map((img: string, i: number) => (
                      <View
                        key={i}
                        className="image-wrapper"
                        onClick={() => {
                          Taro.previewImage({
                            urls: selectedTxn.image_url_list,
                            current: img,
                          });
                        }}
                      >
                        <Image className="detail-image" src={img} mode="aspectFill" />
                        <View className="image-zoom-hint">
                          <Text>查看</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
            <View className="detail-actions">
              <View className="detail-btn edit" onClick={handleEdit}>
                <Text>编辑</Text>
              </View>
              <View className="detail-btn delete" onClick={handleDelete}>
                <Text>删除</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </PageLayout>
  );
}
