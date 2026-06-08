/**
 * Budgets — v3.0 预算管理
 * 白色导航 · 月份选择 · 支出预算设置 · 保存 · 复制上月 · 收入只读
 */
import { useState, useEffect, useRef } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Input } from "@tarojs/components";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import MonthPicker from "../../components/MonthPicker";
import EmptyState from "../../components/EmptyState";
import { useMonthSelector } from "../../hooks/useMonthSelector";
import { useManualQuery } from "../../hooks/useManualQuery";
import {
  fetchBudgets,
  fetchBudgetStatus,
  upsertBudgets,
  copyBudgets,
} from "../../services/budgetsApi";
import { fetchCategories } from "../../services/categoriesApi";
import type { BudgetRecord, Category } from "../../types";
import "./index.scss";

export default function BudgetsPage() {
  const qc = useQueryClient();
  const { year, month, setYear, setMonth, monthKey } = useMonthSelector();

  const { data: categories = [] } = useManualQuery<Category[]>({
    key: "categories",
    queryFn: () => fetchCategories(),
  });
  const expenseCats = categories.filter((c) => c.type === "expense");
  const incomeCats = categories.filter((c) => c.type === "income");

  const { data: budgets = [], isLoading } = useManualQuery<BudgetRecord[]>({
    key: `budgets-${monthKey}`,
    queryFn: () => fetchBudgets(monthKey),
  });
  const { data: bs } = useManualQuery({
    key: `budgets-status-${monthKey}`,
    queryFn: () => fetchBudgetStatus(monthKey),
  });

  /* Build lookup maps */
  const bm = new Map<string, number>();
  budgets.forEach((b) => {
    const catId = (b as any).category_id || (b as any).category;
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
      qc.invalidateQueries({ queryKey: ["budgets"] });
      Taro.showToast({ title: "预算保存成功", icon: "success" });
    },
  });
  const copyMut = useMutation({
    mutationFn: () => copyBudgets({ targetMonth: monthKey }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      Taro.showToast({ title: "复制成功", icon: "success" });
    },
  });

  const handleSave = () => {
    const items = expenseCats
      .filter((c) => (editValues[c.id] || 0) > 0)
      .map((c) => ({ category: c.id, amount: editValues[c.id] || 0 }));
    if (items.length > 0) saveMut.mutate(items);
  };

  const statusColor = (status: string) =>
    status === "over"
      ? "var(--color-danger)"
      : status === "warning"
        ? "var(--color-warning)"
        : "var(--color-primary)";

  return (
    <View className="min-h-screen bg-bg flex flex-col">
      <View className="flex-1 overflow-y-auto">
        <View className="budgets-content">
          {/* Month Picker + Copy */}
          <View className="card flex items-center justify-between px-3 py-2">
            <MonthPicker
              year={year}
              month={month}
              onChange={(y, m) => {
                setYear(y);
                setMonth(m);
              }}
            />
            <Text
              className={`text-sm font-semibold ${copyMut.isPending ? "text-hint" : "text-primary"} tappable`}
              onClick={() => {
                if (!copyMut.isPending) copyMut.mutate();
              }}
            >
              {copyMut.isPending ? "复制中..." : "复制上月"}
            </Text>
          </View>

          {isLoading ? (
            <View className="flex justify-center py-8">
              <View
                className="animate-spin"
                style={{
                  width: "44rpx",
                  height: "44rpx",
                  border: "4rpx solid var(--color-primary)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                }}
              />
            </View>
          ) : (
            <>
              {/* Expense Budgets */}
              <View className="card overflow-hidden">
                <View className="px-4 py-3 border-b">
                  <Text className="text-sm font-semibold">支出分类预算</Text>
                </View>
                {expenseCats.length === 0 ? (
                  <EmptyState icon="💰" title="暂无支出分类" />
                ) : (
                  expenseCats.map((cat, idx) => {
                    const budget = editValues[cat.id] || 0;
                    const st = sm.get(cat.id);
                    const spent = st?.spent || 0;
                    const progress = st?.progress || 0;
                    const status = st?.status || "safe";
                    return (
                      <View
                        key={cat.id}
                        className={`budgets-row ${idx < expenseCats.length - 1 ? "border-b" : ""}`}
                      >
                        <View className="flex items-center gap-2 mb-2">
                          <Text style={{ fontSize: "36rpx" }}>{cat.icon}</Text>
                          <Text className="flex-1 text-sm font-medium">
                            {cat.name}
                          </Text>
                          <View className="flex items-center gap-1">
                            <Text className="text-sm text-secondary">¥</Text>
                            <Input
                              className="budgets-amount-input"
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
                              placeholderClass="text-hint"
                              type="digit"
                            />
                          </View>
                        </View>
                        {budget > 0 && (
                          <View className="flex items-center gap-2 pl-2">
                            <View className="flex-1 progress-bar">
                              <View
                                className="progress-bar-fill"
                                style={{
                                  width: `${Math.min(progress, 100)}%`,
                                  backgroundColor: statusColor(status),
                                }}
                              />
                            </View>
                            <Text
                              className="text-xs"
                              style={{ color: statusColor(status) }}
                            >
                              已花 ¥{spent.toFixed(0)}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>

              {/* Income (read-only) */}
              <View className="card overflow-hidden">
                <View className="px-4 py-3 border-b">
                  <Text className="text-sm font-semibold">收入分类</Text>
                </View>
                <View className="px-4 py-3">
                  <Text className="text-xs text-secondary mb-2">
                    收入分类不设预算
                  </Text>
                  <View className="flex flex-wrap gap-1">
                    {incomeCats.map((c) => (
                      <View key={c.id} className="budgets-income-chip">
                        <Text style={{ fontSize: "24rpx" }}>{c.icon}</Text>
                        <Text className="text-xs">{c.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Save Button */}
              <View
                className={`btn-primary ${saveMut.isPending ? "opacity-60" : ""}`}
                onClick={handleSave}
              >
                <Text className="text-white font-semibold">
                  {saveMut.isPending ? "保存中..." : "💾 保存预算"}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
