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
import {  useDidShow  } from "@tarojs/taro";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "../../components/PageContainer";
import { Button, EmptyState, FooterActions, SegControl } from "../../components/ui";
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
import {
    getPlatformIconSvgDataUrl,
} from "../../utils/platformIcons";
import { useManualQuery, invalidateManualQuery } from "../../hooks/useManualQuery";
import { useSubmit, toastError } from "../../hooks/useSubmit";
import { transactionTypeLabel } from "../../utils/transactionType";
import { useReorder } from "../../hooks/useReorder";
import "./index.scss";
import { toastSuccess, toastInfo } from "../../utils/toast";
import { formatDateTimeMinute } from "../../utils/date";
import { ACTION_DELETING, ACTION_LOADING, ACTION_SAVING, ACTION_UPLOADING_ELLIPSIS } from "../../utils/actionCopy";
import { SORT_DONE, SORT_EDIT } from "../../utils/sortCopy";
import { categoryTypeTabLabel } from "../../utils/transactionType";
import {
  CONFIRM_DELETE_TITLE,
  CONFIRM_DELETE_TEXT,
  confirmDeleteThis,
  confirmDeleteCategory,
} from "../../utils/confirmCopy";
import { SUCCESS_DELETED, SUCCESS_ICON_UPLOADED, successEntityUpsert } from "../../utils/successCopy";
import { buildCategoryPayload, validateCategoryName } from "../../utils/categoryPayload";
import { emptyCategories } from "../../utils/emptyCopy";
import { entityCreateButton, ENTITY_CATEGORY, DETAIL_CATEGORY } from "../../utils/entityCopy";
import { UPLOAD_FAILED, DELETE_FAILED } from "../../utils/uploadCopy";
import { failEntityUpsert } from "../../utils/errorCopy";
import { buildCategoryIconOptionSpecs } from "../../utils/categories";
import { FORM_CATEGORY_NAME_PLACEHOLDER, MAX_CATEGORY_NAME_LENGTH } from "../../utils/formCopy";
import { FIELD_CATEGORY_ID, FIELD_SORT, FIELD_CREATED_AT, FIELD_UPDATED_AT, FIELD_NAME, FIELD_ICON, sortOrderLabel, FIELD_DEFAULT, FIELD_CUSTOM } from "../../utils/fieldCopy";
import { queryKeys } from "../../utils/queryKeys";
import {
  buildCategoryDetailOriginBadgeClassName,
  buildCategoryDetailTypeBadgeClassName,
} from "../../utils/typeTag";

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
  return buildCategoryIconOptionSpecs().map((spec) =>
    spec.kind === "platform"
      ? {
          value: spec.value,
          icon: getPlatformIconSvgDataUrl(spec.platformKey || ""),
          label: spec.label,
          isImage: true,
        }
      : { value: spec.value, icon: spec.value },
  );
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
    queryKey: [...queryKeys.categories.all],
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
    const nameErr = validateCategoryName(formName);
    if (nameErr) {
      toastInfo(nameErr);
      return;
    }
    const isEdit = formMode === "edit" && !!editingId;
    const payload = buildCategoryPayload(
      { name: formName, icon: formIcon, type: catType },
      { includeType: !isEdit },
    );
    run(async () => {
      const apiCall = isEdit
        ? updateCategory(editingId as string, payload)
        : createCategory(payload as import("@family-bookkeeping/shared-types").CreateCategoryInput);
      await apiCall;
      qc.invalidateQueries({ queryKey: [...queryKeys.categories.all] });
      invalidateManualQuery("categories");
      toastSuccess(successEntityUpsert(ENTITY_CATEGORY, isEdit));
      closeForm();
      refetch();
    }, ACTION_SAVING).catch((err: any) => {
      toastError(err, failEntityUpsert(isEdit));
      // 失败也关闭表单，避免 loading 卡住
      closeForm();
    });
  };

  // ---- 图标上传/删除：走 useSubmit 防连点 ----
  const handleIconUpload = async (
    file: { tempFilePath: string; name?: string; size?: number },
    iconType: "category" | "book" | "avatar"
  ) => {
    await run(async () => {
      const result: any = await uploadIcon(file.tempFilePath, iconType);
      const url = result?.icon_url || result?.url || "";
      if (!url) {
        toastInfo(UPLOAD_FAILED);
        return;
      }
      setFormIcon(url);
      const list = await fetchCustomIcons("category");
      setCustomIcons(list || []);
      toastSuccess(SUCCESS_ICON_UPLOADED);
    }, ACTION_UPLOADING_ELLIPSIS).catch(() => {
      toastInfo(UPLOAD_FAILED);
    });
  };

  const handleIconDelete = async (iconId: string) => {
    await run(async () => {
      await deleteIcon(iconId);
      const list = await fetchCustomIcons("category");
      setCustomIcons(list || []);
      toastSuccess(SUCCESS_DELETED);
    }, ACTION_DELETING).catch(() => {
      toastInfo(DELETE_FAILED);
    });
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
      loadingText={ACTION_LOADING}
      loadingVariant="list"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      overlay={
        <>
      {/* ========== 截图2：分类详情弹窗 ========== */}
      {!!detailCat && (
        <BottomSheet
          title={DETAIL_CATEGORY}
          onClose={closeDetail}
          footer={
            !detailCat.is_default ? (
              <FooterActions align="stretch">
                <Button variant="secondary" size="md" block onClick={handleDetailEdit}>
                  编辑
                </Button>
                <Button variant="danger" size="md" block onClick={handleDetailDelete}>
                  删除
                </Button>
              </FooterActions>
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
                    className={buildCategoryDetailTypeBadgeClassName({ type: detailCat.type })}
                  >
                    {transactionTypeLabel(detailCat.type)}
                  </Text>
                  <Text
                    className={buildCategoryDetailOriginBadgeClassName({
                      isDefault: detailCat.is_default,
                    })}
                  >
                    {detailCat.is_default ? FIELD_DEFAULT : FIELD_CUSTOM}
                  </Text>
                </View>
              </View>
            </View>

            {/* 分隔线 */}
            <View className="catds-divider" />

            {/* 信息字段（PC 同款 2 列网格） */}
            <View className="catds-grid">
              <View className="catds-item catds-item--full">
                <Text className="catds-item__label">{FIELD_CATEGORY_ID}</Text>
                <Text className="catds-item__value catds-item__value--mono">{detailCat.id}</Text>
              </View>
              <View className="catds-item">
                <Text className="catds-item__label">{FIELD_CREATED_AT}</Text>
                <Text className="catds-item__value">
                  {detailCat.created_at ? formatDateTimeMinute(detailCat.created_at) : "-"}
                </Text>
              </View>
              <View className="catds-item">
                <Text className="catds-item__label">{FIELD_UPDATED_AT}</Text>
                <Text className="catds-item__value">
                  {detailCat.updated_at ? formatDateTimeMinute(detailCat.updated_at) : "-"}
                </Text>
              </View>
              <View className="catds-item">
                <Text className="catds-item__label">{FIELD_SORT}</Text>
                <Text className="catds-item__value">
                  {sortOrderLabel(detailCat.sort_order)}
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
              ? `编辑${transactionTypeLabel(formCatType)}分类`
              : `新增${transactionTypeLabel(catType)}分类`
          }
          onClose={closeForm}
          footer={
            <View className="catfs-footer">
              <Button variant="primary" block size="md" onClick={handleFormSubmit}>
                确认
              </Button>
            </View>
          }
        >
          {/* 表单体 */}
          <View className="catfs-body">
            {/* 名称 */}
            <View className="catfs-form-group">
              <Text className="catfs-label">
                <Text className="catfs-label__req">*</Text>{FIELD_NAME}
              </Text>
              <Input
                className="catfs-input"
                placeholder={FORM_CATEGORY_NAME_PLACEHOLDER}
                maxlength={MAX_CATEGORY_NAME_LENGTH}
                value={formName}
                onInput={(e: any) => setFormName(e.detail.value)}
              />
            </View>

            {/* 图标 */}
            <View className="catfs-form-group">
              <Text className="catfs-label">{FIELD_ICON}</Text>
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
        title={CONFIRM_DELETE_TITLE}
        message={
          deletingCat
            ? confirmDeleteCategory(deletingCat.name)
            : confirmDeleteThis(ENTITY_CATEGORY)
        }
        confirmText={CONFIRM_DELETE_TEXT}
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
            qc.invalidateQueries({ queryKey: [...queryKeys.categories.all] });
      invalidateManualQuery("categories");
            toastSuccess(SUCCESS_DELETED);
            setShowDeleteConfirm(false);
            setDetailCat(null);
            setDeletingCat(null);
            refetch();
          }, ACTION_DELETING).catch((err: any) => {
            toastError(err, DELETE_FAILED);
            setShowDeleteConfirm(false);
            setDeletingCat(null);
          });
        }}
      />
        </>
      }
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
            { value: "expense", label: categoryTypeTabLabel("expense") },
            { value: "income", label: categoryTypeTabLabel("income") },
          ]}
        />
        <View className="cats-actions">
          {sortMode ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancelSortMode}>
                取消
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveSort}>
                {SORT_DONE}
              </Button>
            </>
          ) : (
            <>
              {!isLoading && filtered.length > 1 && (
                <Button variant="outline" size="sm" onClick={handleEnterSortMode}>
                  {SORT_EDIT}
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={handleAdd}>
                {entityCreateButton(ENTITY_CATEGORY)}
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
              description={emptyCategories(transactionTypeLabel(catType))}
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
    </PageContainer>
  );
}
