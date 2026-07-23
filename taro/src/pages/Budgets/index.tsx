/**
 * Budgets — 预算管理（对齐 PC 端卡片式布局 + 详情弹窗）
 * 展示型列表 · 月份选择 · 点击卡片→详情弹窗 · 编辑/删除预算
 */
import { useState, useEffect, useRef, useCallback } from "react";
import Taro, { useDidShow } from "@tarojs/taro";
import { View, Text, Input } from "@tarojs/components";
import MonthPicker from "../../components/MonthPicker";
import PageContainer from "../../components/PageContainer";
import CategoryIcon from "../../components/CategoryIcon";
import { EmptyState } from "../../components/ui";
import ConfirmDialog from "../../components/ConfirmDialog";
import BottomSheet from "../../components/BottomSheet";
import { useMonthSelector } from "../../hooks/useMonthSelector";
import { useManualQuery, invalidateManualQuery } from "../../hooks/useManualQuery";
import { useSubmit } from "../../hooks/useSubmit";
import { fetchBudgets, fetchBudgetStatus, upsertBudgets, copyBudgets } from "../../services/budgetsApi";
import { fetchCategories } from "../../services/categoriesApi";
import "./index.scss";

/* ---------- 类型 ---------- */
interface BudgetDetail {
  category: {
    id: string;
    name: string;
    icon: string;
  };
  budget: number;
  spent: number;
  progress: number;
  status: string;
  remaining: number;
}

/* ================================================================
 *  主页面
 * ================================================================ */
export default function BudgetsPage() {
  const { year, month, setYear, setMonth, monthKey } = useMonthSelector();

  const { data: categories = [], refetch: refetchCategories } = useManualQuery({
    key: "categories",
    queryFn: () => fetchCategories(),
  });
  const expenseCats = categories.filter((c) => c.type === "expense");

  const { data: budgets = [], isLoading, refetch: refetchBudgets } = useManualQuery({
    key: `budgets-${monthKey}`,
    queryFn: () => fetchBudgets(monthKey),
  });
  const { data: bs, isLoading: statusLoading, refetch: refetchStatus } = useManualQuery({
    key: `budgets-status-${monthKey}`,
    queryFn: () => fetchBudgetStatus(monthKey),
  });

  /* 页面显示时刷新；首次显示已由 useManualQuery 的 mount effect 请求过，
   * 若数据已加载则跳过，避免同一进页触发两次请求。 */
  const isFirstShow = useRef(true);
  useDidShow(() => {
    if (isFirstShow.current) {
      isFirstShow.current = false;
      const hasData =
        categories.length > 0 || budgets.length > 0 || !!bs;
      if (hasData) return;
    }
    refetchCategories();
    refetchBudgets();
    refetchStatus();
  });

  /* 下拉刷新 */
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([refetchCategories(), refetchBudgets(), refetchStatus()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchCategories, refetchBudgets, refetchStatus]);

  /* Build lookup maps */
  const bm = new Map<string, number>();
  budgets.forEach((b: any) => {
    const catId = b.category_id || b.category;
    if (catId) bm.set(catId, b.amount);
  });
  const sm = new Map<
    string,
    { spent: number; progress: number; status: string }
  >();
  ((bs as any)?.categories || (bs as any)?.items || []).forEach((c: any) => {
    const catId = c.category_id || c.category;
    if (catId)
      sm.set(catId, {
        spent: c.spent || 0,
        progress: c.progress || 0,
        status: c.status || "safe",
      });
  });

  /* Local budget values */
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const lastSync = useRef("");
  useEffect(() => {
    if (expenseCats.length === 0) return;
    const s: Record<string, number> = {};
    expenseCats.forEach((c) => {
      s[c.id] = bm.get(c.id) || 0;
    });
    const h = JSON.stringify(s);
    if (h !== lastSync.current) {
      lastSync.current = h;
      setEditValues(s);
    }
  }, [monthKey, budgets, expenseCats.length]);

  /* ---- 弹窗状态 ---- */
  const [detailCat, setDetailCat] = useState<BudgetDetail | null>(null); // 详情弹窗
  const [showEditForm, setShowEditForm] = useState(false); // 编辑表单弹窗
  const [editFormAmount, setEditFormAmount] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { run } = useSubmit();

  /** 手动 Promise 链保存预算（替代 useMutation） */
  const handleUpsert = (items: Array<{ category: string; amount: number }>) => {
    run(async () => {
      await upsertBudgets({ month: monthKey, budgets: items });
      invalidateManualQuery(`budgets-`);
      Taro.showToast({ title: "预算保存成功", icon: "success" });
      refetchBudgets();
      refetchStatus();
      setEditingId(null);
    }, "保存中…").catch((err: any) => {
      Taro.showToast({ title: err?.message || "预算保存失败", icon: "none" });
      setEditingId(null);
    });
  };

  /** 正数全量 + 原先有预算现为 0 的分类一并提交，确保清零可落库 */
  const handleSave = () => {
    const items = expenseCats
      .map((c) => {
        const amount = editValues[c.id] || 0;
        const prev = bm.get(c.id) || 0;
        if (amount > 0 || prev > 0) return { category: c.id, amount };
        return null;
      })
      .filter(Boolean) as Array<{ category: string; amount: number }>;
    if (items.length > 0) handleUpsert(items);
    else Taro.showToast({ title: "请至少设置一个分类的预算金额", icon: "none" });
  };

  const [showCopyConfirm, setShowCopyConfirm] = useState(false);

  const handleCopyLastMonth = () => {
    run(async () => {
      const result = await copyBudgets({ targetMonth: monthKey });
      if (!result || result.length === 0) {
        Taro.showToast({ title: "上月暂无预算可复制", icon: "none" });
        return;
      }
      Taro.showToast({ title: `已复制 ${result.length} 条`, icon: "success" });
      refetchBudgets();
      refetchStatus();
    }, "复制中…").catch((err: any) => {
      Taro.showToast({ title: err?.message || "复制失败", icon: "none" });
    });
  };

  /** 点击卡片 → 打开详情弹窗 */
  const handleCardTap = (cat: any) => {
    const budget = editValues[cat.id] || 0;
    const st = sm.get(cat.id);
    const spent = st?.spent || 0;
    const progress = st?.progress || 0;
    const status = st?.status || "safe";
    setDetailCat({
      category: { id: cat.id, name: cat.name, icon: cat.icon },
      budget,
      spent,
      progress,
      status,
      remaining: budget - spent,
    });
  };

  /** 点击金额区域进入行内编辑（保留原功能） */
  const handleTapAmount = (catId: string) => {
    setEditingId(catId);
  };

  /** 编辑框失隐/完成时退出编辑态 */
  const handleEditBlur = (catId: string, val: string) => {
    const num = parseFloat(val);
    setEditValues((p) => ({
      ...p,
      [catId]: isNaN(num) ? 0 : Math.max(0, num),
    }));
    setEditingId(null);
  };

  const handleEditConfirm = (catId: string, val: string) => {
    const num = parseFloat(val);
    setEditValues((p) => ({
      ...p,
      [catId]: isNaN(num) ? 0 : Math.max(0, num),
    }));
    setEditingId(null);
  };

  /* ---- 详情弹窗操作 ---- */

  /** 详情内 → 打开编辑表单 */
  const handleDetailEdit = () => {
    if (!detailCat) return;
    setEditFormAmount(
      detailCat.budget === 0 ? "" : String(detailCat.budget)
    );
    setShowEditForm(true);
  };

  /** 详情内 → 确认删除（设为0保存） */
  const handleDetailDelete = () => {
    if (!detailCat) return;
    // 设为 0 并立即提交
    const items = [{ category: detailCat.category.id, amount: 0 }];
    handleUpsert(items);
    // 关闭弹窗
    setShowDeleteConfirm(false);
    setDetailCat(null);
  };

  /** 编辑表单提交；金额为 0 且原有预算时走删除确认，避免误清零 */
  const handleEditFormSubmit = () => {
    if (!detailCat) return;
    const num = parseFloat(editFormAmount);
    const amount = isNaN(num) ? 0 : Math.max(0, num);
    if (amount === 0 && detailCat.budget > 0) {
      setShowEditForm(false);
      setShowDeleteConfirm(true);
      return;
    }
    const items = [{ category: detailCat.category.id, amount }];
    handleUpsert(items);
    setShowEditForm(false);
    setDetailCat(null);
  };

  /* ---- 辅助函数 ---- */
  const statusColor = (status: string) =>
    status === "over"
      ? "#E06055"   /* danger — 对齐 PC --exp */
      : status === "warning"
        ? "#E8A838"   /* warn — 对齐 PC RankRow warn 起始色 */
        : "#2D9D8A";  /* safe — 对齐 PC --primary */

  const statusLabel = (status: string) =>
    status === "over" ? "超预算" : status === "warning" ? "接近预算" : "正常";

  const fmt = (n: number) => (n >= 0 ? n.toFixed(2) : "0.00");

  const closeDetail = () => setDetailCat(null);
  const closeEditForm = () => setShowEditForm(false);

  /* ======================== 渲染 ======================== */
  return (
    <PageContainer
      loading={isLoading || statusLoading}
      loadingText="加载中…"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      header={
        /* 头部工具栏：月份选择 + 保存（作为 header 传入，loading 时常驻不消失） */
        <View className="bdg-toolbar">
          <MonthPicker
            year={year}
            month={month}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />
          <View className="bdg-toolbar__actions">
            <View
              className="bdg-save-btn bdg-save-btn--ghost"
              onClick={() => setShowCopyConfirm(true)}
            >
              <Text className="bdg-save-btn__text bdg-save-btn__text--ghost">复制上月</Text>
            </View>
            <View className="bdg-save-btn" onClick={handleSave}>
              <Text className="bdg-save-btn__text">保存</Text>
            </View>
          </View>
        </View>
      }
    >
      {/* 卡片列表 */}
      {expenseCats.length === 0 ? (
        <View className="bdg-empty">
          <EmptyState title="暂无支出分类" />
        </View>
      ) : (
        <View className="bdg-list">
          {expenseCats.map((cat) => {
            const budget = editValues[cat.id] || 0;
            const st = sm.get(cat.id);
            const spent = st?.spent || 0;
            const progress = st?.progress || 0;
            const status = st?.status || "safe";
            const color = statusColor(status);
            const remaining = budget - spent;
            const hasBudget = budget > 0;
            const isEditing = editingId === cat.id;

            return (
              <View
                key={cat.id}
                className="bdg-card"
                onClick={() => handleCardTap(cat)}
              >
                {/* 主行：图标 + 名称 | 金额 */}
                <View className="bdg-card__main">
                  <View className="bdg-card__left">
                    <CategoryIcon icon={cat.icon} size={32} />
                    <Text className="bdg-card__name">{cat.name}</Text>
                  </View>
                  <View
                    className="bdg-card__amount"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      handleTapAmount(cat.id);
                    }}
                  >
                    {isEditing ? (
                      <Input
                        className="bdg-card__input"
                        type="digit"
                        focus
                        value={
                          editValues[cat.id] === 0
                            ? ""
                            : String(editValues[cat.id])
                        }
                        onInput={(e: any) => {
                          const num = parseFloat(e.detail.value);
                          setEditValues((p) => ({
                            ...p,
                            [cat.id]: isNaN(num) ? 0 : Math.max(0, num),
                          }));
                        }}
                        onBlur={(e) => handleEditBlur(cat.id, e.detail.value)}
                        onConfirm={(e) => handleEditConfirm(cat.id, e.detail.value)}
                        placeholder="预算金额"
                      />
                    ) : (
                      <>
                        <Text className="bdg-card__currency">¥</Text>
                        <Text className="bdg-card__value">
                          {hasBudget
                            ? `${fmt(spent)} / ${fmt(budget)}`
                            : fmt(spent)}
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {/* 副行：进度条 + 状态文字 */}
                <View className="bdg-card__sub">
                  {hasBudget ? (
                    <>
                      <View className="bdg-bar-track">
                        <View
                          className="bdg-bar-fill"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </View>
                      <Text className="bdg-bar-meta">
                        {Math.round(progress)}%　剩余 ¥{remaining.toFixed(0)}
                      </Text>
                    </>
                  ) : (
                    <Text className="bdg-bar-meta bdg-bar-meta--muted">
                      未设置预算
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ========== 预算详情弹窗（对齐 PC 截图）========== */}
      {!!detailCat && !showEditForm && !showDeleteConfirm && (
        <BottomSheet
          title="预算详情"
          onClose={closeDetail}
          footer={
            <View className="bgds-footer">
              <View className="bgds-btn bgds-btn--edit" onClick={handleDetailEdit}>
                <Text>编辑预算</Text>
              </View>
              <View
                className="bgds-btn bgds-btn--delete"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Text>删除预算</Text>
              </View>
            </View>
          }
        >
          {/* 内容区 */}
          <View className="bgds-body">
            {/* 图标 + 名称 */}
            <View className="bgds-hero">
              <View className="bgds-hero__icon-wrap">
                <CategoryIcon
                  icon={detailCat.category.icon}
                  size={44}
                  fill
                  className="bgds-hero__icon"
                />
              </View>
              <Text className="bgds-hero__name">
                {detailCat.category.name}
              </Text>
            </View>

            {/* 分隔线 */}
            <View className="bgds-divider" />

            {/* 信息网格（对齐 PC detail-grid：2 列，每格 label 在上、value 在下） */}
            <View className="bgds-grid">
              {/* 使用进度 */}
              <View className="bgds-cell">
                <Text className="bgds-cell__label">使用进度</Text>
                <Text className="bgds-cell__value">{detailCat.progress}%</Text>
              </View>

              {/* 已使用 */}
              <View className="bgds-cell">
                <Text className="bgds-cell__label">已使用</Text>
                <Text className="bgds-cell__value">
                  ¥{detailCat.spent.toLocaleString('zh-CN')}
                </Text>
              </View>

              {/* 预算 */}
              <View className="bgds-cell">
                <Text className="bgds-cell__label">预算</Text>
                <Text className="bgds-cell__value">
                  ¥{detailCat.budget.toLocaleString('zh-CN')}
                </Text>
              </View>

              {/* 剩余 */}
              <View className="bgds-cell">
                <Text className="bgds-cell__label">剩余</Text>
                <Text className="bgds-cell__value">
                  ¥{detailCat.remaining.toLocaleString('zh-CN')}
                </Text>
              </View>

              {/* 状态（对齐 PC：纯文本，不单独着色） */}
              <View className="bgds-cell">
                <Text className="bgds-cell__label">状态</Text>
                <Text className="bgds-cell__value">
                  {statusLabel(detailCat.status)}
                </Text>
              </View>
            </View>
          </View>
        </BottomSheet>
      )}

      {/* ========== 编辑预算表单弹窗 ========== */}
      {showEditForm && !!detailCat && (
        <BottomSheet
          title={`编辑预算 - ${detailCat.category.name}`}
          onClose={closeEditForm}
          footer={
            <View className="bgfs-footer">
              <Text
                className="bgfs-footer-btn"
                onClick={handleEditFormSubmit}
              >
                保存
              </Text>
            </View>
          }
        >
          {/* 表单体 */}
          <View className="bgfs-body">
            <View className="bgfs-form-group">
              <Text className="bgfs-label">
                <Text className="bgfs-label__req">*</Text>
                预算金额
              </Text>
              <Input
                className="bgfs-input"
                type="digit"
                placeholder="0"
                value={editFormAmount}
                onInput={(e: any) => setEditFormAmount(e.detail.value)}
              />
            </View>
          </View>
        </BottomSheet>
      )}

      {/* 删除/清零确认弹窗（详情删除 & 编辑金额置 0 共用） */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="确认删除预算"
        message={
          detailCat
            ? `确定删除「${detailCat.category.name}」本月预算吗？删除后该分类预算将清零。`
            : "确定要删除这个预算吗？"
        }
        confirmText="确认删除"
        danger
        confirmLoading={false}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDetailDelete}
      />

      <ConfirmDialog
        visible={showCopyConfirm}
        title="复制上月预算"
        message="将上月预算复制到当前月份（已有金额会被覆盖），是否继续？"
        confirmText="确认复制"
        danger={false}
        confirmLoading={false}
        onCancel={() => setShowCopyConfirm(false)}
        onConfirm={() => {
          setShowCopyConfirm(false);
          handleCopyLastMonth();
        }}
      />
    </PageContainer>
  );
}
