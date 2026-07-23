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
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "../../components/PageContainer";
import { Button, EmptyState, SegControl } from "../../components/ui";
import CategoryIcon from "../../components/CategoryIcon";
import ConfirmDialog from "../../components/ConfirmDialog";
import { IconGrid } from "../../components/ui/IconGrid";
import BottomSheet from "../../components/BottomSheet";
import DragSortList from "../../components/DragSortList";
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
import { useSubmit } from "../../hooks/useSubmit";
import { useReorder } from "../../hooks/useReorder";
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

  // ---- 弹窗状态 ----
  const [detailCat, setDetailCat] = useState<Category | null>(null); // 截图2：详情弹窗
  const [formMode, setFormMode] = useState<FormMode | null>(null); // 截图3：表单弹窗
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("📌");
  const [formCatType, setFormCatType] = useState<CatType>("expense");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null); // 待删除目标（关闭 detail 后 detailCat 会丢失）

  const { run } = useSubmit();
  const [editingId, setEditingId] = useState<string | null>(null); // 编辑目标 id（关闭详情后不丢失）

  // 自定义图标列表
  const [customIcons, setCustomIcons] = useState<
    { id: string; icon_url: string; icon_type: string }[]
  >([]);

  // ---- 数据拉取 ----
  const { data: categories, isLoading, refetch } = useManualQuery<Category[]>({
    key: "categories",
    queryFn: () => fetchCategories(),
  });

  /* 首次显示已由 useManualQuery 的 mount effect 请求过，若已拿到数据则跳过，避免重复请求 */
  const isFirstShow = useRef(true);
  useDidShow(() => {
    if (isFirstShow.current) {
      isFirstShow.current = false;
      if ((categories || []).length > 0) return;
    }
    refetch();
  });

  /* 下拉刷新 */
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

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

  // ---- 排序（useReorder 共享 Hook）----
  const {
    sortMode,
    displayList,
    enter: handleEnterSortMode,
    cancel: handleCancelSortMode,
    moveTo: handleMoveTo,
    save: handleSaveSort,
  } = useReorder<Category>({
    items: filtered,
    getKey: (c) => c.id,
    onSave: (ids) => reorderCategories(ids.map((id, i) => ({ id, sort_order: i }))),
    queryKey: ["categories"],
    queryClient: qc,
    refetch,
  });

  // ---- 创建 / 更新 / 删除 全部改用手动 Promise 链（见对应 handle* 函数）----
  // 不再依赖 useMutation 驱动 UI，规避 Taro 下 isPending/onSettled 偶发卡死导致
  // 按钮永久 loading、弹窗不关闭、关闭按钮无响应。

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
    setEditingId(detailCat.id); // 记住编辑目标，关闭详情后不丢失
    setFormName(detailCat.name);
    setFormIcon(detailCat.icon || "📌");
    setFormCatType(detailCat.type);
    setFormMode("edit");
    setDetailCat(null); // 关闭详情，打开表单
  };

  const handleDetailDelete = () => {
    if (!detailCat) return;
    setDeletingCat(detailCat); // 先保存目标，再关闭 detail
    closeDetail();
    setShowDeleteConfirm(true);
  };

  // ---- 表单提交（手动 Promise 链，规避 Taro 下 useMutation 卡死）----
  const handleFormSubmit = () => {
    if (!formName.trim()) {
      Taro.showToast({ title: "请输入名称", icon: "none" });
      return;
    }
    const name = formName.trim();
    const icon = formIcon;
    const isEdit = formMode === "edit" && !!editingId;
    run(async () => {
      const apiCall = isEdit
        ? updateCategory(editingId as string, { name, icon })
        : createCategory({ name, icon, type: catType });
      await apiCall;
      qc.invalidateQueries({ queryKey: ["categories"] });
      Taro.showToast({ title: isEdit ? "分类已更新" : "分类已创建", icon: "success" });
      closeForm();
      refetch();
    }, "保存中…").catch((err: any) => {
      Taro.showToast({
        title: err?.message || (isEdit ? "更新失败" : "创建失败"),
        icon: "none",
      });
      // 失败也关闭表单，避免 loading 卡住
      closeForm();
    });
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
  const closeForm = () => {
    setFormMode(null);
    setEditingId(null);
  };

  /* ======================== 渲染 ======================== */
  const iconOptions = useMemo(() => buildIconOptions(), []);

  return (
    <PageContainer
      loading={isLoading}
      loadingText="加载中…"
      loadingVariant="list"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      {/* Tab 切换 + 排序 + 添加按钮 */}
      <View className="cats-tabs-card">
        <SegControl
          size="sm"
          variant="default"
          value={catType}
          onChange={(v) => {
            if (sortMode) handleCancelSortMode();
            setTabIndex(v === "income" ? 1 : 0);
          }}
          options={[
            { value: "expense", label: "支出分类" },
            { value: "income", label: "收入分类" },
          ]}
        />
        <View className="cats-actions">
          {sortMode ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancelSortMode}>
                取消
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveSort}>
                完成排序
              </Button>
            </>
          ) : (
            <>
              {!isLoading && filtered.length > 1 && (
                <Button variant="outline" size="sm" onClick={handleEnterSortMode}>
                  编辑排序
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={handleAdd}>
                ＋ 新建分类
              </Button>
            </>
          )}
        </View>
      </View>

      {/* 排序模式提示 */}
      {sortMode && (
        <View className="cats-sort-hint">
          <Text>长按卡片拖动调整顺序，完成后点击保存</Text>
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
        ) : sortMode ? (
          <View className="cats-drag-wrap">
            <DragSortList
              items={displayList}
              getKey={(c) => c.id}
              itemHeight={140}
              onReorder={handleMoveTo}
              renderItem={(cat) => (
                <View className="cats-grid-card cats-grid-card--sort cats-grid-card--drag">
                  <View className="cats-grid-card__drag-row">
                    <View className="cats-grid-card__icon-wrap">
                      <CategoryIcon icon={cat.icon} size={28} fill className="cats-grid-card__icon" />
                    </View>
                    <Text className="cats-grid-card__name">{cat.name}</Text>
                    <Text className="cats-grid-card__drag-handle">⋮⋮</Text>
                  </View>
                  <View className="cats-grid-card__tags">
                    {cat.is_default ? (
                      <Text className="cats-tag cats-tag--default">默认</Text>
                    ) : (
                      <Text className="cats-tag cats-tag--custom">自定义</Text>
                    )}
                  </View>
                </View>
              )}
            />
          </View>
        ) : (
          <View className="cats-grid-list">
            {displayList.map((cat) => (
              <View
                key={cat.id}
                className="cats-grid-card"
                onClick={() => handleCardTap(cat)}
              >
                <View className="cats-grid-card__icon-wrap">
                  <CategoryIcon icon={cat.icon} size={28} fill className="cats-grid-card__icon" />
                </View>
                <Text className="cats-grid-card__name">{cat.name}</Text>
                <View className="cats-grid-card__tags">
                  {cat.is_default ? (
                    <Text className="cats-tag cats-tag--default">默认</Text>
                  ) : (
                    <Text className="cats-tag cats-tag--custom">自定义</Text>
                  )}
                </View>
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
            {/* 图标 + 名称 + 标签（PC 同款左右布局） */}
            <View className="catds-hero">
              <View className="catds-hero__icon-wrap">
                <CategoryIcon icon={detailCat.icon} size={56} fill className="catds-hero__icon" />
              </View>
              <View className="catds-hero__content">
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
            </View>

            {/* 分隔线 */}
            <View className="catds-divider" />

            {/* 信息字段（PC 同款 2 列网格） */}
            <View className="catds-grid">
              <View className="catds-item">
                <Text className="catds-item__label">分类 ID</Text>
                <Text className="catds-item__value catds-item__value--mono">{detailCat.id}</Text>
              </View>
              <View className="catds-item">
                <Text className="catds-item__label">排序</Text>
                <Text className="catds-item__value">
                  第 {detailCat.sort_order + 1} 位
                </Text>
              </View>
              <View className="catds-item">
                <Text className="catds-item__label">创建时间</Text>
                <Text className="catds-item__value">
                  {detailCat.created_at ? detailCat.created_at.slice(0, 16) : "-"}
                </Text>
              </View>
              <View className="catds-item">
                <Text className="catds-item__label">更新时间</Text>
                <Text className="catds-item__value">
                  {detailCat.updated_at ? detailCat.updated_at.slice(0, 16) : "-"}
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
                className="catfs-footer-btn"
                onClick={handleFormSubmit}
              >
                确认
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
          deletingCat
            ? `确定删除自定义分类「${deletingCat.name}」吗？删除后不可恢复。`
            : "确定要删除这个分类吗？"
        }
        confirmText="确认删除"
        danger
        confirmLoading={false}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingCat(null);
        }}
        onConfirm={() => {
          if (!deletingCat) return;
          run(async () => {
            await deleteCategory(deletingCat.id);
            qc.invalidateQueries({ queryKey: ["categories"] });
            Taro.showToast({ title: "已删除", icon: "success" });
            setShowDeleteConfirm(false);
            setDetailCat(null);
            setDeletingCat(null);
            refetch();
          }, "删除中…").catch((err: any) => {
            Taro.showToast({ title: err?.message || "删除失败", icon: "none" });
            setShowDeleteConfirm(false);
            setDeletingCat(null);
          });
        }}
      />
    </PageContainer>
  );
}
