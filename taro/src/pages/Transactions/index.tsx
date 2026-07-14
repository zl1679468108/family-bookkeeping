/**
 * Transactions — 流水页
 * 布局: 搜索栏(第1行) → 筛选 Picker(第2行) → 统计摘要 → 日期分组列表（卡片形式）
 * 交互: 点击列表项 → 直接跳转编辑页（AddTransaction），编辑页内含删除按钮
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Input, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageContainer from "../../components/PageContainer";
import { EmptyState } from "../../components/ui";
import TransactionItem from "../../components/TransactionItem";
import { getTransactions } from "../../services/transactionsApi";
import { useCategoryLookup } from "../../hooks/useCategories";
import { useCategoryList } from "../../hooks/useCategories";
import { useAuth } from "../../context/AuthContext";
import { useBookContext } from "../../context/BookContext";
import { fmtAmount } from "../../utils/format";
import "./index.scss";

const FILTER_OPTIONS = ["全部类型", "支出", "收入"];
const TIME_OPTIONS = ["全部时间", "近 7 天", "近 30 天"];

const PAGE_SIZE = 20;

let currentAbortController: AbortController | null = null;

function dateRange(timeIdx: number): { start?: string; end?: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const end = fmt(now);

  if (timeIdx === 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - 6);
    return { start: fmt(d), end };
  }
  if (timeIdx === 2) {
    const d = new Date(now);
    d.setDate(now.getDate() - 29);
    return { start: fmt(d), end };
  }
  return {};
}

function getTypeFromFilter(typeIdx: number): "expense" | "income" | undefined {
  if (typeIdx === 1) return "expense";
  if (typeIdx === 2) return "income";
  return undefined;
}

/** 按日期分组 */
function groupByDate(txns: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  txns.forEach((t) => {
    const key = (t.date || "").slice(0, 10) || "未知日期";
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  return groups;
}

/** 格式化日期显示 */
function formatDateLabel(dateStr: string): string {
  if (!dateStr || dateStr === "未知日期") return dateStr;
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const td = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const yd = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  if (ds === td) return "今天";
  if (ds === yd) return "昨天";

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diffDays > 0 && diffDays < 7) return `周${weekDays[d.getDay()]}`;

  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function Transactions() {
  const { user, loading: authLoading } = useAuth();
  const { currentBook } = useBookContext();

  // 筛选状态
  const [typeIdx, setTypeIdx] = useState(0);
  const [timeIdx, setTimeIdx] = useState(0); // 默认全部时间
  const [catIdx, setCatIdx] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");

  // 数据状态
  const [txn, setTxn] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const handleScroll = useCallback((top: number) => setScrolled(top > 4), []);
  const { getCategoryName, getCategoryIcon } = useCategoryLookup();
  const { categories } = useCategoryList();

  // 分类 Picker 数据源
  const categoryOptions = useMemo(() => {
    const typeFilter = getTypeFromFilter(typeIdx);
    const cats = typeFilter
      ? categories.filter((c) => c.type === typeFilter)
      : categories;
    return ["全部分类", ...cats.map((c) => c.name)];
  }, [categories, typeIdx]);

  const filteredCategoriesForSelection = useMemo(() => {
    const type = getTypeFromFilter(typeIdx);
    return type ? categories.filter((c) => c.type === type) : categories;
  }, [categories, typeIdx]);

  // 数据请求
  const doFetch = useCallback(
    async (targetPage: number, currentList: any[], replace: boolean, overrides?: {
      typeIdx?: number;
      timeIdx?: number;
      catIdx?: number;
      searchKeyword?: string;
    }, signal?: AbortSignal) => {
      const ti = overrides?.typeIdx ?? typeIdx;
      const tmi = overrides?.timeIdx ?? timeIdx;
      const ci = overrides?.catIdx ?? catIdx;
      const s = overrides?.searchKeyword ?? searchKeyword;

      const r = dateRange(tmi);
      const typeParam = getTypeFromFilter(ti);
      const catParam = ci > 0 && filteredCategoriesForSelection[ci - 1]
        ? filteredCategoriesForSelection[ci - 1].id
        : undefined;

      if (replace) setLoading(true);
      else setLoadingMore(true);

      try {
        const res: any = await getTransactions({
          type: typeParam,
          startDate: r.start,
          endDate: r.end,
          category: catParam || undefined,
          search: s.trim() || undefined,
          page: targetPage,
          pageSize: PAGE_SIZE,
          view: "own",
        }, signal);
        const list: any[] = res?.data || [];
        const next = replace ? list : [...currentList, ...list];
        setTxn(next);
        setHasMore(list.length === PAGE_SIZE);
        setPage(targetPage);
        setLoading(false);
        setLoadingMore(false);
        return next;
      } catch {
        if (replace) setTxn([]);
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        return replace ? [] : currentList;
      }
    },
    [typeIdx, timeIdx, catIdx, searchKeyword, filteredCategoriesForSelection],
  );

  useEffect(() => {
    if (authLoading || !user) return;
    doFetch(1, [], true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, currentBook]);

  const handleRefresh = useCallback(() =>
    new Promise<void>((resolve) => {
      setRefreshing(true);
      if (currentAbortController) currentAbortController.abort();
      const ac = new AbortController();
      currentAbortController = ac;
      doFetch(1, [], true, undefined, ac.signal)
        .then(() => {
          setRefreshing(false);
          resolve();
        })
        .catch(() => {
          setRefreshing(false);
          resolve();
        });
    }),
    [doFetch],
  );

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    if (currentAbortController) currentAbortController.abort();
    const ac = new AbortController();
    currentAbortController = ac;
    doFetch(page + 1, txn, false, undefined, ac.signal);
  }, [loadingMore, hasMore, page, txn, doFetch]);

  const handleSearch = useCallback(() => {
    setPage(1);
    if (currentAbortController) currentAbortController.abort();
    const ac = new AbortController();
    currentAbortController = ac;
    doFetch(1, [], true, { searchKeyword }, ac.signal);
  }, [doFetch, searchKeyword]);

  const handleClearSearch = useCallback(() => {
    setSearchKeyword("");
    setPage(1);
    if (currentAbortController) currentAbortController.abort();
    const ac = new AbortController();
    currentAbortController = ac;
    doFetch(1, [], true, { searchKeyword: "" }, ac.signal);
  }, [doFetch]);

  const handleTypeChange = useCallback((e: any) => {
    const idx = Number(e.detail.value);
    setTypeIdx(idx);
    setCatIdx(0);
    setPage(1);
    if (currentAbortController) currentAbortController.abort();
    const ac = new AbortController();
    currentAbortController = ac;
    doFetch(1, [], true, { typeIdx: idx, catIdx: 0 }, ac.signal);
  }, [doFetch]);

  const handleTimeChange = useCallback((e: any) => {
    const idx = Number(e.detail.value);
    setTimeIdx(idx);
    setPage(1);
    if (currentAbortController) currentAbortController.abort();
    const ac = new AbortController();
    currentAbortController = ac;
    doFetch(1, [], true, { timeIdx: idx }, ac.signal);
  }, [doFetch]);

  const handleCatChange = useCallback((e: any) => {
    const idx = Number(e.detail.value);
    setCatIdx(idx);
    setPage(1);
    if (currentAbortController) currentAbortController.abort();
    const ac = new AbortController();
    currentAbortController = ac;
    doFetch(1, [], true, { catIdx: idx }, ac.signal);
  }, [doFetch]);

  // 条目点击 → 直接跳转编辑页
  const handleTxnClick = (t: any) => {
    Taro.navigateTo({ url: `/pages/AddTransaction/index?edit=${t.id}` });
  };

  // 统计
  const stats = useMemo(() => {
    return txn.reduce(
      (acc, t) => {
        const amount = parseFloat(t.amount) || 0;
        if (t.type === "income") acc.income += amount;
        else acc.expense += amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [txn]);

  // 日期分组
  const groupedTxns = useMemo(() => groupByDate(txn), [txn]);
  const dates = useMemo(() => Object.keys(groupedTxns).sort().reverse(), [groupedTxns]);

  return (
    <>
      <PageContainer
        loading={loading}
        loadingText="加载中…"
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onScroll={handleScroll}
        header={
          <View className={`filter-card ${scrolled ? "scrolled" : ""}`}>
          <View className="filter-card-surface">
          <View className="search-row">
            <Input
              className="search-input"
              value={searchKeyword}
              onInput={(e) => setSearchKeyword(e.detail.value)}
              placeholder="搜索描述/品牌..."
              confirmType="search"
              onConfirm={handleSearch}
            />
            {searchKeyword && (
              <Text className="search-clear-btn" onClick={handleClearSearch}>✕</Text>
            )}
          </View>

          {/* ═══ 第2行：筛选 Picker ═══ */}
          <View className="picker-row">
            <Picker mode="selector" range={FILTER_OPTIONS} value={typeIdx} onChange={handleTypeChange}>
              <View className="picker-chip">
                <Text className="picker-chip-text">{FILTER_OPTIONS[typeIdx]}</Text>
                <Text className="picker-arrow">▾</Text>
              </View>
            </Picker>
            <Picker mode="selector" range={TIME_OPTIONS} value={timeIdx} onChange={handleTimeChange}>
              <View className="picker-chip">
                <Text className="picker-chip-text">{TIME_OPTIONS[timeIdx]}</Text>
                <Text className="picker-arrow">▾</Text>
              </View>
            </Picker>
            <Picker mode="selector" range={categoryOptions} value={catIdx} onChange={handleCatChange}>
              <View className="picker-chip">
                <Text className="picker-chip-text">{categoryOptions[catIdx] || "全部分类"}</Text>
                <Text className="picker-arrow">▾</Text>
              </View>
            </Picker>
          </View>
          </View>

          {/* ═══ 第3行：统计摘要（对齐PC端） ═══ */}
          {txn.length > 0 && (
            <View className="stats-summary">
              <Text className="stats-text">
                本页{txn.length}笔 · 支出{fmtAmount(stats.expense)} · 收入{fmtAmount(stats.income)}
              </Text>
            </View>
          )}
        </View>
      }
      >
        {/* 交易列表（卡片形式） */}
        <View className="txn-list">
          {txn.length === 0 ? (
            <EmptyState title="暂无交易记录" description="调整筛选条件或新增一笔账单" />
          ) : (
            <View>
              {dates.map((date) => (
                <View key={date} className="date-group">
                  <View className="date-header">
                    <Text className="date-label">{formatDateLabel(date)}</Text>
                  </View>
                  {groupedTxns[date].map((t: any) => {
                    const catName = getCategoryName(t.category) || "其他";
                    const catIcon = getCategoryIcon(t.category) || "📌";

                    return (
                      <View key={t.id} className="txn-card" onClick={() => handleTxnClick(t)}>
                        <TransactionItem
                          icon={catIcon}
                          categoryName={catName}
                          description={t.description}
                          brand={t.brand}
                          amount={parseFloat(t.amount) || 0}
                          type={t.type === "income" ? "income" : "expense"}
                          hasImage={t.image_url_list && t.image_url_list.length > 0}
                        />
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 底部提示 */}
        {!hasMore && txn.length > 0 && (
          <View className="list-footer">
            <Text className="footer-text">— 已经到底了 —</Text>
          </View>
        )}

      </PageContainer>
    </>
  );
}
