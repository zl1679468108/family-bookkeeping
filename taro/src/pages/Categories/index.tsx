/**
 * Categories — 分类管理页 v3（对齐 PC 端功能）
 *
 * 功能入口（三张截图全覆盖）：
 *   1. 分类列表 + 支出/收入 Tab + 排序（截图1）
 *   2. 卡片点击 → 详情弹窗：图标/名称/标签/ID/时间 + 编辑&删除（截图2）
 *   3. 新建/编辑表单弹窗：名称输入 + IconGrid 图标选择器（截图3）
 *
 * 不再做页面跳转（navigateTo），全部以 Sheet 弹窗完成。
 */
import { useState, useMemo, useEffect } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import PageLayout from "../../components/PageLayout";
import { EmptyState, Spinner } from "../../components/ui";
import CategoryIcon from "../../components/CategoryIcon";
import ConfirmDialog from "../../components/ConfirmDialog";
import { IconGrid } from "../../components/ui/IconGrid";
import BottomSheet from "../../components/BottomSheet";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "../../services/categoriesApi";
import {
  fetchCustomIcons,
  uploadIcon,
  deleteIcon,
} from "../../services/iconsApi";
import { EMOJI_PRESETS } from "../../utils/emojiPresets";
import {
  SHOPPING_PLATFORM_ICONS,
  getPlatformIconSvgDataUrl,
} from "../../utils/platformIcons";
import { useManualQuery } from "../../hooks/useManualQuery";
import "./index.scss";

/* ---------- 类型 ---------- */
interface Category {
  id: string;
  name: string;
  icon: string;
  type: "expense" | "income";
  sort_order: number;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

type CatType = "expense" | "income";
type FormMode = "add" | "edit";

/* ---------- 图标选项（与 PC 一致）---------- */
function buildIconOptions() {
  return [
    ...EMOJI_PRESETS.map((e) => ({ value: e, icon: e })),
    ...SHOPPING_PLATFORM_ICONS.map((item) => ({
      value: `platform_${item.key}`,
      icon: getPlatformIconSvgDataUrl(item.key),
      label: item.label,
      isImage: true,
    })),
  ];
}

/* ================================================================
 *  主页面
 * ================================================================ */
export default function CategoriesPage() {
  const qc = useQueryClient();

  // ---- 基础状态 ----
  const [tabIndex, setTabIndex] = useState<number>(0);
  const catType: CatType = tabIndex === 0 ? "expense" : "income";

  // 排序模式
  const [sortMode, setSortMode] = useState(false);
  const [sortOrder, setSortOrder] = useState<Category[]>([]);

  // ---- 弹窗状态 ----
  const [detailCat, setDetailCat] = useState<Category | null>(null); // 截图2：详情弹窗
  const [formMode, setFormMode] = useState<FormMode | null>(null); // 截图3：表单弹窗
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("📌");
  const [formCatType, setFormCatType] = useState<CatType>("expense");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 自定义图标列表
  const [customIcons, setCustomIcons] = useState<
    { id: string; icon_url: string; icon_type: string }[]
  >([]);

  // ---- 数据拉取 ----
  const { data: categories, isLoading, refetch } = useManualQuery<Category[]>({
    key: "categories",
    queryFn: () => fetchCategories(),
  });

  useDidShow(() => {
    refetch();
  });

  // 自定义图标（打开表单时加载）
  useEffect(() => {
    if (formMode) {
      fetchCustomIcons("category")
        .then((list) => setCustomIcons(list || []))
        .catch(() => setCustomIcons([]));
    }
  }, [formMode]);

  const filtered = useMemo(() => {
    return (categories || [])
      .filter((c) => c.type === catType)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories, catType]);

  const displayList = sortMode && sortOrder.length > 0 ? sortOrder : filtered;

  // ---- 排序 Mutations ----
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
    onError: (err: any) => {
      Taro.showToast({ title: err?.message || "排序保存失败", icon: "none" });
    },
  });

  // ---- CRUD Mutations ----
  const createMut = useMutation({
    mutationFn: (data: { name: string; icon: string; type: CatType }) =>
      createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      Taro.showToast({ title: "分类已创建", icon: "success" });
      closeForm();
      refetch();
    },
    onError: (err: any) => {
      Taro.showToast({ title: err?.message || "创建失败", icon: "none" });
      // 失败时也关闭表单，避免 loading 卡住
      closeForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; icon: string } }) =>
      updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      Taro.showToast({ title: "分类已更新", icon: "success" });
      closeForm();
      refetch();
    },
    onError: (err: any) => {
      Taro.showToast({ title: err?.message || "更新失败", icon: "none" });
      // 失败时也关闭表单，避免 loading 卡住
      closeForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      Taro.showToast({ title: "已删除", icon: "success" });
      setShowDeleteConfirm(false);
      setDetailCat(null);
      refetch();
    },
    onError: (err: any) => {
      Taro.showToast({ title: err?.message || "删除失败", icon: "none" });
      setShowDeleteConfirm(false);
    },
  });

  // ---- 排序操作 ----
  const handleEnterSortMode = () => {
    setSortOrder([...filtered]);
    setSortMode(true);
  };
  const handleCancelSortMode = () => {
    setSortMode(false);
    setSortOrder([]);
  };
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newList = [...sortOrder];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setSortOrder(newList);
  };
  const handleMoveDown = (index: number) => {
    if (index >= sortOrder.length - 1) return;
    const newList = [...sortOrder];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setSortOrder(newList);
  };
  const handleSaveSort = () => {
    if (sortOrder.length === 0) return;
    const orders = sortOrder.map((c, index) => ({ id: c.id, sort_order: index }));
    reorderMut.mutate(orders);
  };

  // ---- 卡片点击 → 详情弹窗（截图2）----
  const handleCardTap = (cat: Category) => {
    if (sortMode) return;
    setDetailCat(cat);
  };

  // ---- FAB → 新建表单（截图3）----
  const handleAdd = () => {
    setFormName("");
    setFormIcon("📌");
    setFormCatType(catType);
    setFormMode("add");
  };

  // ---- 详情弹窗内操作 ----
  const handleDetailEdit = () => {
    if (!detailCat) return;
    setFormName(detailCat.name);
    setFormIcon(detailCat.icon || "📌");
    setFormCatType(detailCat.type);
    setFormMode("edit");
    setDetailCat(null); // 关闭详情，打开表单
  };

  const handleDetailDelete = () => {
    closeDetail();
    setShowDeleteConfirm(true);
  };

  // ---- 表单提交 ----
  const handleFormSubmit = () => {
    if (!formName.trim()) {
      Taro.showToast({ title: "请输入名称", icon: "none" });
      return;
    }
    if (formMode === "edit" && detailCat) {
      updateMut.mutate({
        id: detailCat.id,
        data: { name: formName.trim(), icon: formIcon },
      });
    } else {
      createMut.mutate({
        name: formName.trim(),
        icon: formIcon,
        type: catType,
      });
    }
  };

  // ---- 图标上传/删除 ----
  const handleIconUpload = async (
    file: { tempFilePath: string; name?: string; size?: number },
    iconType: "category" | "book" | "avatar"
  ) => {
    try {
      const result: any = await uploadIcon(file.tempFilePath, iconType);
      const url = result?.icon_url || result?.url || "";
      if (url) {
        setFormIcon(url);
        // 刷新自定义图标列表
        const list = await fetchCustomIcons("category");
        setCustomIcons(list || []);
        Taro.showToast({ title: "上传成功", icon: "success" });
      } else {
        Taro.showToast({ title: "上传失败", icon: "none" });
      }
    } catch {
      Taro.showToast({ title: "上传失败", icon: "none" });
    }
  };

  const handleIconDelete = async (iconId: string) => {
    try {
      await deleteIcon(iconId);
      const list = await fetchCustomIcons("category");
      setCustomIcons(list || []);
      Taro.showToast({ title: "已删除", icon: "success" });
    } catch {
      Taro.showToast({ title: "删除失败", icon: "none" });
    }
  };

  // ---- 关闭弹窗 ----
  const closeDetail = () => setDetailCat(null);
  const closeForm = () => setFormMode(null);

  const saving = createMut.isPending || updateMut.isPending;

  /* ======================== 渲染 ======================== */
  const iconOptions = useMemo(() => buildIconOptions(), []);

  return (
    <PageLayout contentClassName="cats-content" loading={isLoading} loadingText="加载中…">
      {/* Tab 切换 + 排序 + 添加按钮 */}
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
        <View className="cats-actions">
          {sortMode ? (
            <>
              <View className="cats-sort-btn" onClick={handleCancelSortMode}>
                <Text>取消</Text>
              </View>
              <View
                className={`cats-sort-save ${reorderMut.isPending ? "cats-sort-save--pending ui-spin-row" : ""}`}
                onClick={reorderMut.isPending ? undefined : handleSaveSort}
              >
                {reorderMut.isPending && <Spinner />}
                <Text>{reorderMut.isPending ? "保存中..." : "完成排序"}</Text>
              </View>
            </>
          ) : (
            <>
              {!isLoading && filtered.length > 1 && (
                <View className="cats-sort-btn" onClick={handleEnterSortMode}>
                  <Text>编辑排序</Text>
                </View>
              )}
              <View className="cats-add-btn" onClick={handleAdd}>
                <Text className="cats-add-btn__icon">＋</Text>
                <Text className="cats-add-btn__text">新建分类</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* 排序模式提示 */}
      {sortMode && (
        <View className="cats-sort-hint">
          <Text>点击 ↑ / ↓ 调整顺序</Text>
        </View>
      )}

      {/* 分类列表（截图1风格：网格卡片，无边框） */}
      <View className="cats-list-wrap">
        {filtered.length === 0 ? (
          <View className="cats-empty">
            <EmptyState
              title={`暂无${catType === "expense" ? "支出" : "收入"}分类`}
              description="添加第一个分类，让每一笔收支都有清晰的归类。"
            />
          </View>
        ) : (
          <View className="cats-grid-list">
            {displayList.map((cat, idx) => (
              <View
                key={cat.id}
                className={`cats-grid-card ${sortMode ? "cats-grid-card--sort" : ""}`}
                onClick={() => {
                  if (sortMode) return;
                  handleCardTap(cat);
                }}
              >
                <View className="cats-grid-card__icon-wrap">
                  <CategoryIcon icon={cat.icon} className="cats-grid-card__icon" />
                </View>
                <Text className="cats-grid-card__name">{cat.name}</Text>
                <View className="cats-grid-card__tags">
                  {cat.is_default ? (
                    <Text className="cats-tag cats-tag--default">默认</Text>
                  ) : (
                    <Text className="cats-tag cats-tag--custom">自定义</Text>
                  )}
                </View>
                {sortMode && (
                  <View className="cats-grid-card__sort-ctrl">
                    <View
                      className={`cats-sort-arrow ${idx === 0 ? "cats-sort-arrow--disabled" : ""}`}
                      onClick={(e: any) => {
                        e.stopPropagation();
                        handleMoveUp(idx);
                      }}
                    >
                      <Text>↑</Text>
                    </View>
                    <View
                      className={`cats-sort-arrow ${idx >= displayList.length - 1 ? "cats-sort-arrow--disabled" : ""}`}
                      onClick={(e: any) => {
                        e.stopPropagation();
                        handleMoveDown(idx);
                      }}
                    >
                      <Text>↓</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ========== 截图2：分类详情弹窗 ========== */}
      {!!detailCat && (
        <BottomSheet
          title="分类详情"
          onClose={closeDetail}
          footer={
            !detailCat.is_default ? (
              <View className="catds-footer">
                <View className="catds-btn catds-btn--edit" onClick={handleDetailEdit}>
                  <Text>编辑</Text>
                </View>
                <View
                  className="catds-btn catds-btn--delete"
                  onClick={handleDetailDelete}
                >
                  <Text>删除</Text>
                </View>
              </View>
            ) : null
          }
        >
          {/* 内容区 */}
          <View className="catds-body">
            {/* 图标 + 名称 + 标签 */}
            <View className="catds-hero">
              <View className="catds-hero__icon-wrap">
                <CategoryIcon icon={detailCat.icon} className="catds-hero__icon" />
              </View>
              <Text className="catds-hero__name">{detailCat.name}</Text>
              <View className="catds-hero__badges">
                <Text
                  className={`catds-badge catds-badge--type ${
                    detailCat.type === "expense" ? "catds-badge--expense" : "catds-badge--income"
                  }`}
                >
                  {detailCat.type === "expense" ? "支出" : "收入"}
                </Text>
                <Text
                  className={`catds-badge catds-badge--origin ${
                    detailCat.is_default ? "catds-badge--default" : "catds-badge--custom"
                  }`}
                >
                  {detailCat.is_default ? "默认" : "自定义"}
                </Text>
              </View>
            </View>

            {/* 分隔线 */}
            <View className="catds-divider" />

            {/* 信息字段 */}
            <View className="catds-fields">
              <View className="catds-field">
                <Text className="catds-field__label">分类 ID</Text>
                <Text className="catds-field__value catds-field__value--mono">
                  {detailCat.id}
                </Text>
              </View>
              <View className="catds-field">
                <Text className="catds-field__label">排序</Text>
                <Text className="catds-field__value">
                  第{" "}
                  {(filtered.findIndex((c) => c.id === detailCat.id) + 1) ||
                    detailCat.sort_order + 1}{" "}
                  位
                </Text>
              </View>
              <View className="catds-field">
                <Text className="catds-field__label">创建时间</Text>
                <Text className="catds-field__value">
                  {detailCat.created_at
                    ? detailCat.created_at.slice(0, 16).replace("T", " ")
                    : "-"}
                </Text>
              </View>
              <View className="catds-field">
                <Text className="catds-field__label">更新时间</Text>
                <Text className="catds-field__value">
                  {detailCat.updated_at
                    ? detailCat.updated_at.slice(0, 16).replace("T", " ")
                    : "-"}
                </Text>
              </View>
            </View>
          </View>
        </BottomSheet>
      )}

      {/* ========== 截图3：新建/编辑分类表单弹窗 ========== */}
      {!!formMode && (
        <BottomSheet
          title={
            formMode === "edit"
              ? `编辑${formCatType === "expense" ? "支出" : "收入"}分类`
              : `新增${catType === "expense" ? "支出" : "收入"}分类`
          }
          onClose={closeForm}
          footer={
            <View className="catfs-footer">
              <Text
                className={`catfs-footer-btn ${saving ? "catfs-footer-btn--disabled" : ""}`}
                onClick={saving ? undefined : handleFormSubmit}
              >
                {saving ? "保存中..." : "确认"}
              </Text>
            </View>
          }
        >
          {/* 表单体 */}
          <View className="catfs-body">
            {/* 名称 */}
            <View className="catfs-form-group">
              <Text className="catfs-label">
                <Text className="catfs-label__req">*</Text>名称
              </Text>
              <Input
                className="catfs-input"
                placeholder="输入分类名称"
                maxlength={10}
                value={formName}
                onInput={(e: any) => setFormName(e.detail.value)}
                focus={!!formMode}
              />
            </View>

            {/* 图标 */}
            <View className="catfs-form-group">
              <Text className="catfs-label">图标</Text>
              <IconGrid
                options={iconOptions}
                value={formIcon}
                onChange={(val) => setFormIcon(val)}
                customIcons={customIcons.map((c) => ({
                  id: c.id,
                  icon_url: c.icon_url,
                  icon_type: "category" as const,
                }))}
                onUpload={handleIconUpload}
                onDelete={handleIconDelete}
                iconType="category"
                columns={5}
                className="catfs-icon-grid"
              />
            </View>
          </View>
        </BottomSheet>
      )}

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="确认删除"
        message={
          detailCat
            ? `确定删除自定义分类「${detailCat.name}」吗？删除后不可恢复。`
            : "确定要删除这个分类吗？"
        }
        confirmText="确认删除"
        danger
        confirmLoading={deleteMut.isPending}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (detailCat) deleteMut.mutate(detailCat.id);
        }}
      />
    </PageLayout>
  );
}
