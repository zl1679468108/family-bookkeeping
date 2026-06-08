/**
 * Categories — v3.0 分类管理
 * 白色导航 · 分段控件 · 分类网格 · 拖拽排序 · 底部弹出编辑
 */
import { useState, useCallback, useMemo } from "react";
import { View, Text, Input } from "@tarojs/components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SegmentedControl from "../../components/SegmentedControl";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoriesApi";
import type { Category } from "../../types";
import "./index.scss";

const EMOJI_PRESETS = [
  "🍜",
  "🚇",
  "🛒",
  "🎬",
  "🏠",
  "💊",
  "📚",
  "✈️",
  "🎁",
  "💼",
  "💰",
  "🏦",
  "📈",
  "🎵",
  "🐱",
  "🎮",
  "☕",
  "🍰",
  "🏥",
  "👕",
  "💄",
  "📱",
  "🏸",
];

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [tabIndex, setTabIndex] = useState(0); // 0=支出, 1=收入
  const catType = (tabIndex === 0 ? "expense" : "income") as
    | "expense"
    | "income";

  const [sortMode, setSortMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState<"add" | "edit">("add");
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📌");

  const { data: allCats = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
    staleTime: 60_000,
  });

  const filtered = useMemo(
    () => allCats.filter((c) => c.type === catType),
    [allCats, catType],
  );

  const createMut = useMutation({
    mutationFn: (dto: {
      name: string;
      icon: string;
      type: "expense" | "income";
    }) => createCategory(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      closeModal();
    },
  });
  const updateMut = useMutation({
    mutationFn: ({
      id,
      name: nm,
      icon: ic,
    }: {
      id: string;
      name: string;
      icon: string;
    }) => updateCategory(id, { name: nm, icon: ic }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      closeModal();
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setDeleteTarget(null);
    },
  });

  const openAdd = useCallback(() => {
    setEditMode("add");
    setEditCat(null);
    setName("");
    setIcon("📌");
    setShowModal(true);
  }, []);
  const openEdit = useCallback((cat: Category) => {
    setEditMode("edit");
    setEditCat(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setShowModal(true);
  }, []);
  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditCat(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!name.trim()) return;
    if (editMode === "add")
      createMut.mutate({ name: name.trim(), icon, type: catType });
    else if (editCat)
      updateMut.mutate({ id: editCat.id, name: name.trim(), icon });
  }, [editMode, name, icon, catType, editCat, createMut, updateMut]);

  return (
    <View className="min-h-screen bg-bg flex flex-col">
      {/* Tabs + Sort Toggle */}
      <View className="cats-tabs-wrap">
        <View className="flex items-center justify-between mb-2">
          <SegmentedControl
            options={["支出分类", "收入分类"]}
            value={tabIndex}
            onChange={(i) => {
              setTabIndex(i);
              setSortMode(false);
            }}
          />
          <Text
            className="text-sm font-semibold text-primary tappable ml-3"
            onClick={() => setSortMode((v) => !v)}
          >
            {sortMode ? "完成" : "排序"}
          </Text>
        </View>
      </View>

      {/* Category List */}
      <View className="flex-1 overflow-y-auto">
        <View className="cats-content">
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
          ) : filtered.length === 0 ? (
            <EmptyState title="暂无分类" description="点击下方按钮添加分类" />
          ) : (
            <View className="cats-grid">
              {filtered.map((cat) => {
                const isDefault = cat.is_default === true;
                return (
                  <View key={cat.id} className="cats-card">
                    {isDefault && (
                      <View className="cats-default-badge">
                        <Text className="text-xs text-hint">默认</Text>
                      </View>
                    )}
                    <Text style={{ fontSize: "48rpx" }}>{cat.icon}</Text>
                    <Text
                      className="text-xs truncate mt-1 mb-2"
                      style={{ maxWidth: "100%" }}
                    >
                      {cat.name}
                    </Text>
                    {!sortMode && !isDefault && (
                      <View className="flex gap-1">
                        <View
                          className="cats-action"
                          onClick={() => openEdit(cat)}
                        >
                          <Text className="text-xs text-secondary">编辑</Text>
                        </View>
                        <View
                          className="cats-action"
                          onClick={() => setDeleteTarget(cat)}
                        >
                          <Text className="text-xs text-danger">删除</Text>
                        </View>
                      </View>
                    )}
                    {sortMode && (
                      <Text className="text-xs text-hint">拖动排序</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Add Button */}
          {!sortMode && (
            <View
              className="cats-add-btn"
              onClick={openAdd}
              hoverClass="tappable"
            >
              <Text className="text-sm text-secondary">＋ 新增分类</Text>
            </View>
          )}
        </View>
      </View>

      {/* Add/Edit Bottom Sheet */}
      {showModal && (
        <View
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={closeModal}
        >
          <View
            className="cats-modal animate-slide-up"
            onClick={(e: any) => e.stopPropagation()}
          >
            <Text className="text-base font-semibold mb-4">
              {editMode === "add"
                ? `新增${catType === "expense" ? "支出" : "收入"}分类`
                : "编辑分类"}
            </Text>

            {/* Name Input */}
            <View className="mb-3">
              <Text className="text-xs text-secondary mb-1">名称</Text>
              <Input
                className="auth-input"
                value={name}
                onInput={(e: any) => setName(e.detail.value)}
                placeholder="输入分类名称"
                placeholderClass="text-hint"
                maxlength={10}
                focus
              />
              <Text className="text-xs text-hint mt-1">{name.length}/10</Text>
            </View>

            {/* Emoji Grid */}
            <View className="mb-4">
              <Text className="text-xs text-secondary mb-1">图标</Text>
              <View className="grid grid-cols-8 gap-2">
                {EMOJI_PRESETS.map((e) => (
                  <View
                    key={e}
                    className={`cats-emoji ${icon === e ? "cats-emoji-selected" : ""}`}
                    onClick={() => setIcon(e)}
                  >
                    <Text style={{ fontSize: "36rpx" }}>{e}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex gap-2">
              <View className="btn-secondary flex-1" onClick={closeModal}>
                <Text className="text-sm">取消</Text>
              </View>
              <View
                className={`btn-primary flex-1 ${!name.trim() ? "opacity-50" : ""}`}
                onClick={handleConfirm}
              >
                <Text className="text-sm text-white">
                  {createMut.isPending || updateMut.isPending
                    ? "保存中..."
                    : "确认"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="确认删除"
        message={`确定删除自定义分类「${deleteTarget?.name}」吗？`}
        confirmText="确认删除"
        confirmLoading={deleteMut.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
      />
    </View>
  );
}
