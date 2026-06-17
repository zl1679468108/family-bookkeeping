/**
 * Transactions — 流水页（增强版）
 * 结构: 搜索框 + 筛选 Tab + 分类筛选 + 统计汇总 + 交易列表 + 交易详情弹窗
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Input, ScrollView, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageLayout from "../../components/PageLayout";
import TransactionItem from "../../components/TransactionItem";
import { getTransactions, deleteTransaction } from "../../services/transactionsApi";
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

  const filteredCategories = useMemo(() => {
    const type = filter === "expense" ? "expense" : filter === "income" ? "income" : undefined;
    return categories.filter((c) => !type || c.type === type);
  }, [categories, filter]);

  const fetchPage = useCallback(
    (targetPage: number, currentList: any[], replace: boolean) => {
      const r = dateRange(filter);
      if (replace) setLoading(true);
      else setLoadingMore(true);
      return getTransactions({
        type: filter === "expense" || filter === "income" ? filter : undefined,
        startDate: r.start,
        endDate: r.end,
        category: categoryId || undefined,
        search: searchKeyword.trim() || undefined,
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
    [filter, categoryId, searchKeyword],
  );

  useEffect(() => {
    // 等待认证状态初始化完成，且已登录才请求
    if (authLoading) return;
    if (!user) return;
    fetchPage(1, [], true);
  }, [authLoading, user, fetchPage]);

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

  const handleSearch = () => {
    setPage(1);
    fetchPage(1, [], true);
  };

  const handleClearSearch = () => {
    setSearchKeyword("");
    setPage(1);
    fetchPage(1, [], true);
  };

  const handleCategoryChange = (categoryId: string) => {
    setCategoryId(categoryId);
    setPage(1);
    fetchPage(1, [], true);
  };

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
      {/* 搜索框 */}
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
          <Text className="search-clear" onClick={handleClearSearch}>✕</Text>
        )}
      </View>

      {/* 筛选栏 */}
      <View className="filter-bar">
        <ScrollView scrollX className="filter-scroll">
          {FILTERS.map((f) => (
            <View
              key={f.key}
              className={`filter-chip ${filter === f.key ? "active" : ""}`}
              onClick={() => {
                setFilter(f.key);
                setPage(1);
                fetchPage(1, [], true);
              }}
            >
              <Text>{f.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 分类筛选 */}
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
          <Text className="category-arrow">▼</Text>
        </View>
      </View>

      {/* 统计汇总 */}
      <View className="stats-bar">
        <View className="stat-item">
          <Text className="stat-label">收入</Text>
          <Text className="stat-value income">¥{fmtAmount(stats.income)}</Text>
        </View>
        <View className="stat-divider" />
        <View className="stat-item">
          <Text className="stat-label">支出</Text>
          <Text className="stat-value expense">¥{fmtAmount(stats.expense)}</Text>
        </View>
        <View className="stat-divider" />
        <View className="stat-item">
          <Text className="stat-label">结余</Text>
          <Text className={`stat-value ${stats.income >= stats.expense ? "income" : "expense"}`}>
            ¥{fmtAmount(stats.income - stats.expense)}
          </Text>
        </View>
      </View>

      {/* 交易列表 */}
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
                  onClick={() => handleTxnClick(t)}
                  hasImage={t.image_url_list && t.image_url_list.length > 0}
                />
              );
            })}
          </View>
        )}
      </View>

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
                          <Text>🔍</Text>
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