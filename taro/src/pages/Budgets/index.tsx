/**
 * Budgets — v3.0 预算管理（精简版）
 * 白色导航 · 月份选择 · 支出预算设置 · 保存
 */
import { useState, useEffect, useRef } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Input } from "@tarojs/components";
import { useMutation } from "@tanstack/react-query";
import MonthPicker from "../../components/MonthPicker";
import EmptyState from "../../components/EmptyState";
import PageLayout from "../../components/PageLayout";
import CategoryIcon from "../../components/CategoryIcon";
import { AppSection, MetricGrid } from "../../components/ui";
import { useMonthSelector } from "../../hooks/useMonthSelector";
import { useManualQuery } from "../../hooks/useManualQuery";
import { fetchBudgets, fetchBudgetStatus, upsertBudgets, copyBudgets } from "../../services/budgetsApi";
import { fetchCategories } from "../../services/categoriesApi";
import "./index.scss";

export default function BudgetsPage() {
  const { year, month, setYear, setMonth, monthKey } = useMonthSelector();

  const { data: categories = [] } = useManualQuery({
    key: "categories",
    queryFn: () => fetchCategories(),
  });
  const expenseCats = categories.filter((c) => c.type === "expense");

  const { data: budgets = [], isLoading } = useManualQuery({
    key: `budgets-${monthKey}`,
    queryFn: () => fetchBudgets(monthKey),
  });
  const { data: bs } = useManualQuery({
    key: `budgets-status-${monthKey}`,
    queryFn: () => fetchBudgetStatus(monthKey),
  });

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

  /* Mutations */
  const saveMut = useMutation({
    mutationFn: (items: Array<{ category: string; amount: number }>) =>
      upsertBudgets({ month: monthKey, budgets: items }),
    onSuccess: () => {
      Taro.showToast({ title: "预算保存成功", icon: "success" });
    },
  });

  const copyMut = useMutation({
    mutationFn: () => copyBudgets({ targetMonth: monthKey }),
    onSuccess: (data) => {
      Taro.showToast({ title: "上月预算已复制", icon: "success" });
      // 刷新预算数据
      if (data && Array.isArray(data)) {
        const s: Record<string, number> = {};
        expenseCats.forEach((c) => {
          const found = data.find((b: any) => (b.category_id || b.category) === c.id);
          s[c.id] = found ? found.amount : 0;
        });
        setEditValues(s);
      }
    },
    onError: () => {
      Taro.showToast({ title: "复制失败，请检查上月是否有预算", icon: "none" });
    },
  });

  const handleSave = () => {
    const items = expenseCats
      .filter((c) => (editValues[c.id] || 0) > 0)
      .map((c) => ({ category: c.id, amount: editValues[c.id] || 0 }));
    if (items.length > 0) saveMut.mutate(items);
    else Taro.showToast({ title: "请先设置预算金额", icon: "none" });
  };

  const statusColor = (status: string) =>
    status === "over"
      ? "#ef5350"
      : status === "warning"
        ? "#f9a825"
        : "#2d9d8a";
  const totalBudget = Object.values(editValues).reduce((sum, value) => sum + (value || 0), 0);
  const totalSpent = Array.from(sm.values()).reduce((sum, item) => sum + (item.spent || 0), 0);
  const remaining = totalBudget - totalSpent;

  return (
    <PageLayout contentClassName="bdg-content">
      <AppSection title="预算月份" compact>
        <View className="bdg-toolbar">
          <View className="bdg-toolbar__month">
            <MonthPicker
              year={year}
              month={month}
              onChange={(y, m) => {
                setYear(y);
                setMonth(m);
              }}
            />
          </View>
          <View
            className={`bdg-toolbar__copy ${copyMut.isPending ? "bdg-toolbar__copy--pending" : ""}`}
            onClick={() => {
              if (copyMut.isPending) return;
              Taro.showModal({
                title: "复制上月预算",
                content: `将上月预算金额复制到 ${monthKey}？`,
                success: (res) => {
                  if (res.confirm) copyMut.mutate();
                },
              });
            }}
          >
            <Text className="bdg-toolbar__copy-text">
              {copyMut.isPending ? "复制中..." : "复制上月"}
            </Text>
          </View>
        </View>
      </AppSection>

      <MetricGrid
        columns={3}
        items={[
          { label: "总预算", value: `¥${totalBudget.toFixed(0)}`, tone: "accent" },
          { label: "已花费", value: `¥${totalSpent.toFixed(0)}`, tone: "expense" },
          {
            label: "剩余额度",
            value: `¥${remaining.toFixed(0)}`,
            tone: remaining >= 0 ? "income" : "expense",
          },
        ]}
      />

      {isLoading ? (
        <View className="bdg-loading">
          <View className="bdg-spin" />
        </View>
      ) : (
        <>
          <AppSection title="预算明细" flush>
            {expenseCats.length === 0 ? (
              <View className="bdg-section__body">
                <EmptyState icon="budget" title="暂无支出分类" />
              </View>
            ) : (
              expenseCats.map((cat, idx) => {
                const budget = editValues[cat.id] || 0;
                const st = sm.get(cat.id);
                const spent = st?.spent || 0;
                const progress = st?.progress || 0;
                const status = st?.status || "safe";
                const color = statusColor(status);
                const isLast = idx === expenseCats.length - 1;
                return (
                  <View
                    key={cat.id}
                    className={`bdg-row ${isLast ? "bdg-row--last" : ""}`}
                  >
                    <View className="bdg-row__main">
                    <CategoryIcon icon={cat.icon} />
                      <Text className="bdg-row__name">{cat.name}</Text>
                      <View className="bdg-row__amount">
                        <Text className="bdg-row__currency">¥</Text>
                        <Input
                          className="bdg-amount-input"
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
                          placeholder="0"
                          placeholderClass="bdg-amount-placeholder"
                          type="digit"
                        />
                      </View>
                    </View>
                    {budget > 0 && (
                      <View className="bdg-row__progress">
                        <View className="bdg-progress-track">
                          <View
                            className="bdg-progress-bar"
                            style={{
                              width: `${Math.min(progress, 100)}%`,
                              backgroundColor: color,
                            }}
                          />
                        </View>
                        <Text
                          className="bdg-progress-text"
                          style={{ color }}
                        >
                          已花 ¥{spent.toFixed(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </AppSection>

          {/* Save Button */}
          <View
            className={`bdg-save ${saveMut.isPending ? "bdg-save--disabled" : ""}`}
            onClick={handleSave}
          >
            <Text className="bdg-save__text">
              {saveMut.isPending ? "保存中..." : "保存预算"}
            </Text>
          </View>
        </>
      )}
    </PageLayout>
  );
}
