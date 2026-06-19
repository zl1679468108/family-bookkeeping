/**
 * Categories — 分类管理
 * 对齐 PC：支出/收入切换、分类列表、新增、编辑、删除、排序
 * 样式：参考 TemplateManager — 白色圆角卡片 + 悬浮 FAB + Sheet 底部弹窗
 * 排序模式：点击顶部"编辑排序"进入，每个卡片显示上移/下移箭头，点击"完成"提交保存
 */
import { useState, useMemo } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import PageLayout from "../../components/PageLayout";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";
import CategoryIcon from "../../components/CategoryIcon";
import { AppSection, PageHero } from "../../components/ui";
import { fetchCategories, createCategory, updateCategory, deleteCategory, reorderCategories } from "../../services/categoriesApi";
import { uploadIcon, fetchCustomIcons, deleteIcon } from "../../services/iconsApi";
import { useManualQuery } from "../../hooks/useManualQuery";
import { EMOJI_PRESETS } from "../../utils/emojiPresets";
import {
  SHOPPING_PLATFORM_ICONS,
  renderPlatformIconSvg,
} from "../../utils/platformIcons";

import "./index.scss";

interface Category {
  id: string;
  name: string;
  icon: string;
  type: "expense" | "income";
  sort_order: number;
  is_default?: boolean;
}

interface CustomIconItem {
  id: string;
  icon_url: string;
  icon_type: string;
  created_at?: string;
}

type CatType = "expense" | "income";

export default function CategoriesPage() {
  const qc = useQueryClient();

  // Tab: 支出/收入
  const [tabIndex, setTabIndex] = useState<number>(0);
  const catType: CatType = tabIndex === 0 ? "expense" : "income";

  // 弹窗
  const [showSheet, setShowSheet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", icon: "📌" });

  // 自定义图标
  const [customIcons, setCustomIcons] = useState<CustomIconItem[]>([]);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // 删除确认
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 排序模式
  const [sortMode, setSortMode] = useState(false);
  const [sortOrder, setSortOrder] = useState<Category[]>([]);

  // --- 数据请求 ---
  const { data: categories, isLoading, refetch } = useManualQuery<Category[]>({
    key: "categories",
    queryFn: () => fetchCategories(),
  });

  // 过滤并排序
  const filtered = useMemo(() => {
    return (categories || [])
      .filter((c) => c.type === catType)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories, catType]);

  // 排序模式下用的列表（用户可以在内存里调整）
  const displayList = sortMode && sortOrder.length > 0 ? sortOrder : filtered;

  // --- 自定义图标操作 ---
  const refreshCustomIcons = () => {
    fetchCustomIcons("category")
      .then((list: CustomIconItem[]) => {
        setCustomIcons(list || []);
      })
      .catch(() => setCustomIcons([]));
  };

  // 上传自定义图标
  const handleUploadCustomIcon = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    })
      .then((res) => {
        const path = res.tempFilePaths && res.tempFilePaths[0];
        if (!path) return;
        setUploadingIcon(true);
        uploadIcon(path, "category")
          .then((result: any) => {
            const iconUrl = result?.icon_url || result?.url || "";
            if (iconUrl) {
              setForm({ ...form, icon: iconUrl });
              refreshCustomIcons();
              Taro.showToast({ title: "已添加到自定义", icon: "success" });
            } else {
              Taro.showToast({ title: "上传失败", icon: "none" });
            }
          })
          .catch(() => {
            Taro.showToast({ title: "上传失败", icon: "none" });
          })
          .finally(() => setUploadingIcon(false));
      })
      .catch(() => {});
  };

  // 删除自定义图标
  const handleDeleteCustomIcon = (iconId: string, e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    deleteIcon(iconId)
      .then(() => {
        refreshCustomIcons();
        Taro.showToast({ title: "已删除", icon: "success" });
      })
      .catch(() => {
        Taro.showToast({ title: "删除失败", icon: "none" });
      });
  };

  // 进入排序模式：拷贝一份当前列表
  const handleEnterSortMode = () => {
    setSortOrder([...filtered]);
    setSortMode(true);
  };

  // 退出排序模式（不保存）
  const handleCancelSortMode = () => {
    setSortMode(false);
    setSortOrder([]);
  };

  // 上移
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newList = [...sortOrder];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setSortOrder(newList);
  };

  // 下移
  const handleMoveDown = (index: number) => {
    if (index >= sortOrder.length - 1) return;
    const newList = [...sortOrder];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setSortOrder(newList);
  };

  // --- Mutations ---
  const createMut = useMutation({
    mutationFn: (data: { name: string; icon: string; type: CatType }) =>
      createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      Taro.showToast({ title: "已添加", icon: "success" });
      handleClose();
      refetch();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; icon: string } }) =>
      updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      Taro.showToast({ title: "已更新", icon: "success" });
      handleClose();
      refetch();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      Taro.showToast({ title: "已删除", icon: "success" });
      setDeleteId(null);
      refetch();
    },
  });

  // 排序保存 Mutation
  const reorderMut = useMutation({
    mutationFn: (orders: { id: string; sort_order: number }[]) =>
      reorderCategories(orders),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      Taro.showToast({ title: "排序已保存", icon: "success" });
      setSortMode(false);
      setSortOrder([]);
      refetch();
    },
  });

  // 提交排序
  const handleSaveSort = () => {
    if (sortOrder.length === 0) return;
    const orders = sortOrder.map((c, index) => ({
      id: c.id,
      sort_order: index,
    }));
    reorderMut.mutate(orders);
  };

  const handleAdd = () => {
    setForm({ name: "", icon: "📌" });
    setEditingId(null);
    refreshCustomIcons();
    setShowSheet(true);
  };

  const handleEdit = (cat: Category) => {
    setForm({ name: cat.name, icon: cat.icon });
    setEditingId(cat.id);
    refreshCustomIcons();
    setShowSheet(true);
  };

  const handleClose = () => {
    setShowSheet(false);
    setEditingId(null);
    setForm({ name: "", icon: "📌" });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      Taro.showToast({ title: "请输入名称", icon: "none" });
      return;
    }
    if (editingId) {
      updateMut.mutate({
        id: editingId,
        data: { name: form.name.trim(), icon: form.icon },
      });
    } else {
      createMut.mutate({
        name: form.name.trim(),
        icon: form.icon,
        type: catType,
      });
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <PageLayout contentClassName="cats-content">
      <PageHero
        eyebrow="分类管理"
        title={catType === "expense" ? "支出分类" : "收入分类"}
        meta={`${filtered.length} 个分类 · ${sortMode ? "排序模式" : "点击卡片可编辑"}`}
        tone="surface"
      />

      {/* Tab 切换：支出 / 收入 + 排序按钮 */}
      <View className="cats-tabs-card">
        <View className="cats-pill-tabs">
          <View
            className={`cats-pill-tab ${tabIndex === 0 ? "cats-pill-tab--active" : ""}`}
            onClick={() => {
              if (sortMode) handleCancelSortMode();
              setTabIndex(0);
            }}
          >
            <Text className="cats-pill-tab__text">支出分类</Text>
          </View>
          <View
            className={`cats-pill-tab ${tabIndex === 1 ? "cats-pill-tab--active" : ""}`}
            onClick={() => {
              if (sortMode) handleCancelSortMode();
              setTabIndex(1);
            }}
          >
            <Text className="cats-pill-tab__text">收入分类</Text>
          </View>
        </View>
        {!isLoading && filtered.length > 1 && (
          <View
            className={`cats-sort-btn ${sortMode ? "cats-sort-btn--active" : ""}`}
            onClick={sortMode ? handleCancelSortMode : handleEnterSortMode}
          >
            <Text>{sortMode ? "取消" : "排序"}</Text>
          </View>
        )}
      </View>

      {/* 排序模式下的"完成"提示 */}
      {sortMode && (
        <View className="cats-sort-hint">
          <Text>点击 ↑ / ↓ 调整顺序，完成后点击「保存排序」</Text>
          <View
            className={`cats-sort-save ${reorderMut.isPending ? "cats-sort-save--pending" : ""}`}
            onClick={handleSaveSort}
          >
            <Text>{reorderMut.isPending ? "保存中..." : "保存排序"}</Text>
          </View>
        </View>
      )}

      {/* 列表 */}
      <AppSection title="分类列表" compact flush>
      {isLoading ? (
        <View className="cats-list">
          <View className="cats-loading-row" />
          <View className="cats-loading-row" />
          <View className="cats-loading-row" />
        </View>
      ) : filtered.length === 0 ? (
        <View className="cats-empty">
          <EmptyState
            icon="category"
            title={`暂无${catType === "expense" ? "支出" : "收入"}分类`}
            description="点击右下角 ＋ 新建分类"
          />
        </View>
      ) : (
        <View className="cats-list">
          {displayList.map((cat, idx) => (
            <View
              key={cat.id}
              className={`cats-card ${sortMode ? "cats-card--sort" : ""}`}
              onClick={() => {
                if (sortMode) return;
                handleEdit(cat);
              }}
            >
              <View className="cats-card__head">
                <CategoryIcon icon={cat.icon} className="cats-card__icon" />
                <Text className="cats-card__name">{cat.name}</Text>
                {cat.is_default && (
                  <Text className="cats-tag cats-tag--default">默认</Text>
                )}
              </View>
              <Text className="cats-card__meta-line">排序：第 {idx + 1} 位</Text>
              <View className="cats-card__actions">
                {sortMode ? (
                  <>
                    <View
                      className={`cats-pill cats-pill--sort ${idx === 0 ? "cats-pill--disabled" : ""}`}
                      onClick={(e: any) => {
                        e.stopPropagation();
                        handleMoveUp(idx);
                      }}
                    >
                      <Text>↑ 上移</Text>
                    </View>
                    <View
                      className={`cats-pill cats-pill--sort ${idx === sortOrder.length - 1 ? "cats-pill--disabled" : ""}`}
                      onClick={(e: any) => {
                        e.stopPropagation();
                        handleMoveDown(idx);
                      }}
                    >
                      <Text>↓ 下移</Text>
                    </View>
                  </>
                ) : !cat.is_default ? (
                  <>
                    <View
                      className="cats-pill cats-pill--edit"
                      onClick={(e: any) => {
                        e.stopPropagation();
                        handleEdit(cat);
                      }}
                    >
                      <Text>编辑</Text>
                    </View>
                    <View
                      className="cats-pill cats-pill--delete"
                      onClick={(e: any) => {
                        e.stopPropagation();
                        setDeleteId(cat.id);
                      }}
                    >
                      <Text>删除</Text>
                    </View>
                  </>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
      </AppSection>

      {/* 悬浮新建按钮（非排序模式） */}
      {!sortMode && (
        <View className="cats-fab" onClick={handleAdd}>
          <Text className="cats-fab__icon">＋</Text>
        </View>
      )}

      {/* Sheet 弹窗：新增/编辑 */}
      {showSheet && (
        <View className="cats-mask" onClick={handleClose}>
          <View className="cats-sheet" onClick={(e: any) => e.stopPropagation()}>
            <View className="cats-sheet__header">
              <Text className="cats-sheet__cancel" onClick={handleClose}>取消</Text>
              <Text className="cats-sheet__title">
                {editingId ? "编辑分类" : `新增${catType === "expense" ? "支出" : "收入"}分类`}
              </Text>
              <Text
                className={`cats-sheet__confirm ${saving ? "cats-sheet__confirm--disabled" : ""}`}
                onClick={handleSave}
              >
                {saving ? "保存中…" : "保存"}
              </Text>
            </View>

            <View className="cats-sheet__body">
              <View className="cats-form-row">
                <Text className="cats-form-label">名称</Text>
                <Input
                  className="cats-form-input"
                  placeholder="如：餐饮"
                  maxlength={10}
                  value={form.name}
                  onInput={(e: any) =>
                    setForm((p) => ({ ...p, name: e.detail.value }))
                  }
                />
              </View>

              <View className="cats-form-row cats-form-row--icon">
                <Text className="cats-form-label">图标</Text>
                <View className="cats-form-emoji-current">
                  <CategoryIcon icon={form.icon} className="cats-form-emoji-current__icon" />
                </View>
              </View>

              {/* 1. emoji 选择网格（62 个 — 与 PC 端一致） */}
              <View className="cats-emoji-grid">
                {EMOJI_PRESETS.map((e) => (
                  <View
                    key={e}
                    className={`cats-emoji-item ${form.icon === e ? "cats-emoji-item--selected" : ""}`}
                    onClick={() => setForm((p) => ({ ...p, icon: e }))}
                  >
                    <Text className="cats-emoji-item__text">{e}</Text>
                  </View>
                ))}
              </View>

              {/* 2. 购物平台 SVG 线条图标网格（与 PC 端一致） */}
              <View className="cats-form-row cats-form-row--stack">
                <Text className="cats-form-label cats-form-label--sub">购物与生活服务</Text>
              </View>
              <View className="cats-emoji-grid cats-emoji-grid--platform">
                {SHOPPING_PLATFORM_ICONS.map((item) => {
                  const val = `platform_${item.key}`;
                  const selected = form.icon === val;
                  return (
                    <View
                      key={val}
                      className={`cats-platform-item ${selected ? "cats-platform-item--selected" : ""}`}
                      onClick={() => setForm((p) => ({ ...p, icon: val }))}
                    >
                      <View className="cats-platform-item__icon">
                        <Image
                          src={renderPlatformIconSvg(item.key, 22, selected ? "#2d9d8a" : "#1a1c19")}
                          mode="aspectFit"
                          style={{ width: "22px", height: "22px", display: "block" }}
                        />
                      </View>
                      <Text
                        className={`cats-platform-item__label ${
                          selected ? "cats-platform-item__label--selected" : ""
                        }`}
                      >
                        {item.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* 自定义图标：上传入口 + 已上传图标网格 */}
              <View className="cats-form-row cats-form-row--custom">
                <Text className="cats-form-label">自定义图标</Text>
                <View className="cats-custom-icons">
                  {/* 上传按钮 */}
                  <View
                    className={`cats-custom-icon-upload ${uploadingIcon ? "cats-custom-icon-upload--loading" : ""}`}
                    onClick={handleUploadCustomIcon}
                  >
                    <Text>{uploadingIcon ? "上传中…" : "＋ 上传图标"}</Text>
                  </View>

                  {/* 已上传的自定义图标 */}
                  {customIcons.map((item) => (
                    <View
                      key={item.id}
                      className={`cats-custom-icon-item ${form.icon === item.icon_url ? "cats-custom-icon-item--selected" : ""}`}
                      onClick={() => setForm((p) => ({ ...p, icon: item.icon_url }))}
                    >
                      <Image className="cats-custom-icon-item__img" src={item.icon_url} mode="aspectFit" />
                      <View
                        className="cats-custom-icon-item__del"
                        onClick={(e: any) => handleDeleteCustomIcon(item.id, e)}
                      >
                        <Text>×</Text>
                      </View>
                    </View>
                  ))}

                  {customIcons.length === 0 && !uploadingIcon && (
                    <View className="cats-custom-empty">
                      <Text>还没有自定义图标，点击「＋ 上传图标」添加</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View className="cats-sheet__safe" />
          </View>
        </View>
      )}

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        visible={!!deleteId}
        title="确认删除"
        message="确定要删除这个分类吗？"
        confirmText="确认删除"
        confirmLoading={deleteMut.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
      />
    </PageLayout>
  );
}
