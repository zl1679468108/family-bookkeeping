/**
 * Transactions — 流水页
 * 布局: 搜索栏(第1行) → 筛选 Picker(第2行) → 统计摘要 → 日期分组列表（卡片形式）
 * 交互: 点击列表项 → 直接跳转编辑页（AddTransaction），编辑页内含删除按钮
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, Text, Input, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageContainer from "../../components/PageContainer";
import { EmptyState, EmptyAddTransactionAction } from "../../components/ui";
import Icon, { ICON_COLOR } from "../../components/Icon";
import TransactionItem from "../../components/TransactionItem";
import { getTransactions } from "../../services/transactionsApi";
import { useCategoryLookup } from "../../hooks/useCategories";
import { useAuth } from "../../context/AuthContext";
import { useBookContext } from "../../context/BookContext";
import { formatMoney } from "../../utils/format";
import "./index.scss";
import { TRANSACTION_TYPE_FILTER_LABELS, TRANSACTION_TIME_FILTER_LABELS, FILTER_ALL_CATEGORIES } from "../../utils/transactionType";
import { parseAmount } from "../../utils/budget";
import { ACTION_LOADING } from "../../utils/actionCopy";
import { EMPTY_TRANSACTIONS_HINT } from "../../utils/emptyCopy";
import { FORM_SEARCH_TXN } from "../../utils/formCopy";
import {
  typeFilterFromIndex,
  transactionTimeDateRange,
  groupTransactionsByDate,
  sortedTransactionDateKeys,
  formatTransactionDateLabel,
} from "../../utils/transactionList";
import { CATEGORY_FALLBACK_OTHER } from "../../utils/categories";
import { DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import { buildFilterCardClassName } from "../../utils/booksUi";

const FILTER_OPTIONS = [...TRANSACTION_TYPE_FILTER_LABELS];
const TIME_OPTIONS = [...TRANSACTION_TIME_FILTER_LABELS];


// 请求序列号：并发/快速切换筛选时，只采用最新一次请求的结果，丢弃过期响应。
// 小程序运行时无 AbortController，故用序列号做竞态兜底而非取消请求。
let reqSeq = 0;

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
  const { categories, getCategoryName, getCategoryIcon } = useCategoryLookup();

  // 分类 Picker 数据源
  const categoryOptions = useMemo(() => {
    const typeFilter = typeFilterFromIndex(typeIdx);
    const cats = typeFilter
      ? categories.filter((c) => c.type === typeFilter)
      : categories;
    return [FILTER_ALL_CATEGORIES, ...cats.map((c) => c.name)];
  }, [categories, typeIdx]);

  const filteredCategoriesForSelection = useMemo(() => {
    const type = typeFilterFromIndex(typeIdx);
    return type ? categories.filter((c) => c.type === type) : categories;
  }, [categories, typeIdx]);

  // 数据请求
  const doFetch = useCallback(
    async (targetPage: number, currentList: any[], replace: boolean, overrides?: {
      typeIdx?: number;
      timeIdx?: number;
      catIdx?: number;
      searchKeyword?: string;
    }) => {
      const ti = overrides?.typeIdx ?? typeIdx;
      const tmi = overrides?.timeIdx ?? timeIdx;
      const ci = overrides?.catIdx ?? catIdx;
      const s = overrides?.searchKeyword ?? searchKeyword;

      const r = transactionTimeDateRange(tmi);
      const typeParam = typeFilterFromIndex(ti);
      const catParam = ci > 0 && filteredCategoriesForSelection[ci - 1]
        ? filteredCategoriesForSelection[ci - 1].id
        : undefined;

      const seq = ++reqSeq; // 本次请求序列号
      if (replace) setLoading(true);
      else setLoadingMore(true);

      try {
        const res: any = await getTransactions({
          type: typeParam,
          startDate: r.startDate,
          endDate: r.endDate,
          category: catParam || undefined,
          search: s.trim() || undefined,
          page: targetPage,
          pageSize: DEFAULT_PAGE_SIZE,
          view: "own",
        });
        // 已被更新的请求取代，丢弃过期响应（不动 loading 态，交给最新请求收口）
        if (seq !== reqSeq) return replace ? [] : currentList;
        const list: any[] = res?.data || [];
        const next = replace ? list : [...currentList, ...list];
        setTxn(next);
        setHasMore(list.length === DEFAULT_PAGE_SIZE);
        setPage(targetPage);
        setLoading(false);
        setLoadingMore(false);
        return next;
      } catch {
        if (seq !== reqSeq) return replace ? [] : currentList;
        if (replace) setTxn([]);
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        return replace ? [] : currentList;
      }
    },
    [typeIdx, timeIdx, catIdx, searchKeyword, filteredCategoriesForSelection],
  );

  const initialFetchDoneRef = useRef(false);
  const lastBookIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (authLoading || !user) {
      initialFetchDoneRef.current = false;
      lastBookIdRef.current = undefined;
      return;
    }

    const bookId = currentBook?.id;

    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      lastBookIdRef.current = bookId;
      doFetch(1, [], true);
      return;
    }

    // currentBook 从空灌入时只同步 id（首屏已用 storage 的 x-book-id 拉过）
    if (lastBookIdRef.current === undefined && bookId) {
      lastBookIdRef.current = bookId;
      return;
    }

    if (bookId && bookId !== lastBookIdRef.current) {
      lastBookIdRef.current = bookId;
      doFetch(1, [], true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, currentBook?.id]);

  const handleRefresh = useCallback(() =>
    new Promise<void>((resolve) => {
      setRefreshing(true);
      doFetch(1, [], true)
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
    doFetch(page + 1, txn, false);
  }, [loadingMore, hasMore, page, txn, doFetch]);

  const handleSearch = useCallback(() => {
    setPage(1);
    doFetch(1, [], true, { searchKeyword });
  }, [doFetch, searchKeyword]);

  const handleClearSearch = useCallback(() => {
    setSearchKeyword("");
    setPage(1);
    doFetch(1, [], true, { searchKeyword: "" });
  }, [doFetch]);

  const handleTypeChange = useCallback((e: any) => {
    const idx = Number(e.detail.value);
    setTypeIdx(idx);
    setCatIdx(0);
    setPage(1);
    doFetch(1, [], true, { typeIdx: idx, catIdx: 0 });
  }, [doFetch]);

  const handleTimeChange = useCallback((e: any) => {
    const idx = Number(e.detail.value);
    setTimeIdx(idx);
    setPage(1);
    doFetch(1, [], true, { timeIdx: idx });
  }, [doFetch]);

  const handleCatChange = useCallback((e: any) => {
    const idx = Number(e.detail.value);
    setCatIdx(idx);
    setPage(1);
    doFetch(1, [], true, { catIdx: idx });
  }, [doFetch]);

  // 条目点击 → 直接跳转编辑页
  const handleTxnClick = (t: any) => {
    Taro.navigateTo({ url: `/pages/AddTransaction/index?edit=${t.id}` });
  };

  // 统计
  const stats = useMemo(() => {
    return txn.reduce(
      (acc, t) => {
        const amount = parseAmount(t.amount);
        if (t.type === "income") acc.income += amount;
        else acc.expense += amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [txn]);

  // 日期分组
  const groupedTxns = useMemo(() => groupTransactionsByDate(txn), [txn]);
  const dates = useMemo(() => sortedTransactionDateKeys(groupedTxns), [groupedTxns]);

  return (
    <>
      <PageContainer
        loading={loading}
        loadingText={ACTION_LOADING}
      loadingVariant="list"
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onScroll={handleScroll}
        header={
          <View className={buildFilterCardClassName({ scrolled })}>
          <View className="filter-card-surface">
          <View className="search-row">
            <Input
              className="search-input"
              value={searchKeyword}
              onInput={(e) => setSearchKeyword(e.detail.value)}
              placeholder={FORM_SEARCH_TXN}
              confirmType="search"
              onConfirm={handleSearch}
            />
            {searchKeyword && (
              <View className="search-clear-btn" onClick={handleClearSearch}><Icon name="close" size={28} color={ICON_COLOR.muted} /></View>
            )}
          </View>

          {/* ═══ 第2行：筛选 Picker ═══ */}
          <View className="filter-picker-row">
            <View className="filter-picker-col">
              <Picker mode="selector" range={FILTER_OPTIONS} value={typeIdx} onChange={handleTypeChange}>
                <View className="picker-chip picker-chip--start">
                  <Text className="picker-chip-text">{FILTER_OPTIONS[typeIdx]}</Text>
                  <Icon name="chevron-down" size={24} color={ICON_COLOR.muted} />
                </View>
              </Picker>
            </View>
            <View className="filter-picker-col">
              <Picker mode="selector" range={TIME_OPTIONS} value={timeIdx} onChange={handleTimeChange}>
                <View className="picker-chip">
                  <Text className="picker-chip-text">{TIME_OPTIONS[timeIdx]}</Text>
                  <Icon name="chevron-down" size={24} color={ICON_COLOR.muted} />
                </View>
              </Picker>
            </View>
            <View className="filter-picker-col">
              <Picker mode="selector" range={categoryOptions} value={catIdx} onChange={handleCatChange}>
                <View className="picker-chip picker-chip--end">
                  <Text className="picker-chip-text">{categoryOptions[catIdx] || FILTER_ALL_CATEGORIES}</Text>
                  <Icon name="chevron-down" size={24} color={ICON_COLOR.muted} />
                </View>
              </Picker>
            </View>
          </View>
          </View>

          {/* ═══ 第3行：统计摘要（对齐PC端） ═══ */}
          {txn.length > 0 && (
            <View className="stats-summary">
              <Text className="stats-text">
                本页{txn.length}笔 · 支出{formatMoney(stats.expense, { wan: true })} · 收入{formatMoney(stats.income, { wan: true })}
              </Text>
            </View>
          )}
        </View>
      }
      >
        {/* 交易列表（卡片形式） */}
        <View className="txn-list">
          {txn.length === 0 ? (
            <EmptyState
              description={EMPTY_TRANSACTIONS_HINT}
              action={
                <EmptyAddTransactionAction
                  onClick={() => Taro.navigateTo({ url: "/pages/AddTransaction/index" })}
                />
              }
            />
          ) : (
            <View>
              {dates.map((date) => (
                <View key={date} className="date-group">
                  <View className="date-header">
                    <Text className="date-label">{formatTransactionDateLabel(date)}</Text>
                  </View>
                  {groupedTxns[date].map((t: any) => {
                    const catName = getCategoryName(t.category) || CATEGORY_FALLBACK_OTHER;
                    const catIcon = getCategoryIcon(t.category) || "📌";

                    return (
                      <View key={t.id} className="txn-card" onClick={() => handleTxnClick(t)}>
                        <TransactionItem
                          icon={catIcon}
                          categoryName={catName}
                          description={t.description}
                          brand={t.brand}
                          amount={parseAmount(t.amount)}
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
      </PageContainer>
    </>
  );
}
