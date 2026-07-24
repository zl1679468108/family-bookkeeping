/**
 * TemplateManager — 模板管理（内嵌弹窗模式）
 *
 * 对齐 PC 端功能：
 *   列表页 → 点卡片打开只读详情（元数据+执行/编辑/复制/删除）→ 表单弹窗编辑
 */
import { useState, useMemo, useCallback, useRef } from "react";
import { View, Text, Input, Picker } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "../../components/PageContainer";
import ConfirmDialog from "../../components/ConfirmDialog";
import CategoryIcon from "../../components/CategoryIcon";
import BottomSheet from "../../components/BottomSheet";
import DragSortList from "../../components/DragSortList";
import LocationPicker, { LocationResult } from "../../components/LocationPicker";
import { Button, EmptyState } from "../../components/ui";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  reorderTemplates,
  executeTemplate,
} from "../../services/templatesApi";
import { useCategories } from "../../hooks/useCategories";
import { useManualQuery } from "../../hooks/useManualQuery";
import { useSubmit, toastError } from "../../hooks/useSubmit";
import { FREQUENCY_LABELS } from "../../utils/frequency";
import { transactionTypeLabel, TRANSACTION_TYPE_OPTIONS } from "../../utils/transactionType";
import { useReorder } from "../../hooks/useReorder";
import { isIconUrl } from "../../utils/renderCategoryIcon";
import type { Template } from "../../types";
import "./index.scss";
import { toastSuccess, toastInfo } from "../../utils/toast";
import { formatMoney } from "../../utils/format";
import { formatDateTime } from "../../utils/date";
import { sanitizeAmountInput } from "../../utils/budget";
import { ACTION_DELETING, ACTION_LOADING, ACTION_SAVING } from "../../utils/actionCopy";
import { sortModeLabel, SORT_SAVE } from "../../utils/sortCopy";
import {
  CONFIRM_DELETE_TITLE,
  CONFIRM_DELETE_TEXT,
  confirmDeleteThis,
} from "../../utils/confirmCopy";
import { successEntityDeleted, successEntityUpsert } from "../../utils/successCopy";

/* ---------- 空表单初始态 ---------- */
const EMPTY_FORM = {
  name: "",
  type: "expense" as "expense" | "income",
  category_id: "",
  amount: "",
  note: "",
  merchant_name: "",
  latitude: "",
  longitude: "",
  location_name: "",
  poi_id: "",
  sort_order: 0,
};


export default function TemplateManager() {
  const qc = useQueryClient();
  const { run } = useSubmit();
  const { data: cats } = useCategories();

  /* ---- 数据获取 ---- */
  const { data: templates, isLoading, refetch } = useManualQuery<Template[]>({
    key: "templates",
    queryFn: () => getTemplates(),
  });

  /* 首次显示已由 useManualQuery 的 mount effect 请求过，若已拿到数据则跳过，避免重复请求 */
  const isFirstShow = useRef(true);
  useDidShow(() => {
    if (isFirstShow.current) {
      isFirstShow.current = false;
      if ((templates || []).length > 0) return;
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

  const orderedTemplates = useMemo(() => {
    // 纯按 sort_order 升序排列（1 在前、2 在后），不按 type 分组
    // 后端 reorder 接口按 ids 顺序分配 sort_order(0,1,2...)，此处保持一致
    return (templates || [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [templates]);

  /* ---- 排序（useReorder 共享 Hook）---- */
  const {
    sortMode,
    displayList,
    enter: handleEnterSortMode,
    cancel: handleCancelSortMode,
    moveTo: handleMoveTo,
    save: handleSaveSort,
  } = useReorder<Template>({
    items: orderedTemplates,
    getKey: (t) => t.id,
    onSave: (ids) => reorderTemplates({ ids }),
    queryKey: ["templates"],
    queryClient: qc,
    refetch,
  });
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  /* ---- 分类查找 ---- */
  const findCat = (cid?: string | null) => (cats || []).find((c) => c.id === cid);
  const catOpts = useMemo(
    () => (cats || []).filter((c: any) => c.type === form.type),
    [cats, form.type],
  );
  const selectedCat = findCat(form.category_id);

  /* ==================== 详情弹窗 ==================== */
  const openDetail = (t: Template) => {
    setSelectedTemplate(t);
    setShowDetail(true);
  };
  const closeDetail = () => { setShowDetail(false); setSelectedTemplate(null); };

  /* 从详情 → 进入编辑 */
  const handleEditFromDetail = () => {
    if (!selectedTemplate) return;
    setEditingId(selectedTemplate.id);
    setForm({
      name: selectedTemplate.name,
      type: selectedTemplate.type,
      category_id: selectedTemplate.category_id || "",
      amount: selectedTemplate.amount ? String(selectedTemplate.amount) : "",
      note: selectedTemplate.note || "",
      merchant_name: selectedTemplate.merchant_name || "",
      latitude: selectedTemplate.latitude ? String(selectedTemplate.latitude) : "",
      longitude: selectedTemplate.longitude ? String(selectedTemplate.longitude) : "",
      location_name: selectedTemplate.location_name || "",
      poi_id: selectedTemplate.poi_id || "",
      sort_order: selectedTemplate.sort_order || 0,
    });
    setShowDetail(false);
    setShowForm(true);
  };

  /* 从详情 → 复制（对齐 PC：打开预填表单，由用户确认创建） */
  const handleCopyFromDetail = () => {
    if (!selectedTemplate) return;
    const t = selectedTemplate;
    setForm({
      name: `${t.name} (副本)`,
      type: t.type,
      category_id: t.category_id || "",
      amount: t.amount ? String(t.amount) : "",
      note: t.note || "",
      merchant_name: t.merchant_name || "",
      latitude: t.latitude ? String(t.latitude) : "",
      longitude: t.longitude ? String(t.longitude) : "",
      location_name: t.location_name || "",
      poi_id: t.poi_id || "",
      sort_order: t.sort_order || 0,
    });
    setEditingId(null);
    setShowForm(true);
    closeDetail();
  };

  /* 从详情 → 删除 */
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const handleDelete = () => {
    if (!deleteId) return;
    run(async () => {
      await deleteTemplate(deleteId);
      qc.invalidateQueries({ queryKey: ["templates"] });
      toastSuccess(successEntityDeleted("模板"));
      setShowDelete(false);
      setDeleteId(null);
      refetch();
    }, ACTION_DELETING).catch((err: any) => {
      toastError(err, "删除失败");
      setShowDelete(false);
      setDeleteId(null);
    });
  };
  const handleDeleteFromDetail = () => {
    if (!selectedTemplate) return;
    setDeleteId(selectedTemplate.id);
    closeDetail();
    setShowDelete(true);
  };

  /* ==================== 表单弹窗 ==================== */
  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const handleFormSave = () => {
    if (!form.name.trim()) {
      toastInfo("请输入模板名称");
      return;
    }
    const data: any = {
      name: form.name.trim(),
      type: form.type,
      sort_order: form.sort_order,
    };
    if (form.category_id) data.category_id = form.category_id;
    if (form.amount) data.amount = parseFloat(form.amount);
    if (form.note.trim()) data.note = form.note.trim();
    if (form.merchant_name.trim()) data.merchant_name = form.merchant_name.trim();
    if (form.location_name.trim()) data.location_name = form.location_name.trim();
    if (form.poi_id) data.poi_id = form.poi_id;
    if (form.latitude) data.latitude = parseFloat(form.latitude);
    if (form.longitude) data.longitude = parseFloat(form.longitude);

    run(async () => {
      if (editingId) {
        await updateTemplate(editingId, data);
      } else {
        await createTemplate(data);
      }
      qc.invalidateQueries({ queryKey: ["templates"] });
      toastSuccess(successEntityUpsert("模板", Boolean(editingId)));
      setShowForm(false);
      setEditingId(null);
      refetch();
    }, ACTION_SAVING).catch((err: any) => {
      toastError(err, "操作失败");
      setShowForm(false);
      setEditingId(null);
    });
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); };

  /* 位置选择回调 */
  const handleLocationConfirm = (result: LocationResult) => {
    setForm((p) => ({
      ...p,
      location_name: result.locationName || "",
      latitude: result.latitude ? String(result.latitude) : "",
      longitude: result.longitude ? String(result.longitude) : "",
      poi_id: result.poiId || "",
    }));
    setShowLocationPicker(false);
  };

  /* 执行模板 */
  const handleExecute = async (t: Template) => {
    try {
      Taro.showLoading({ title: ACTION_LOADING });
      const result = await executeTemplate(t.id);
      Taro.hideLoading();
      Taro.setStorageSync("templateExecuteResult", {
        category_id: result.category_id,
        amount: result.amount,
        description: result.description || result.note || "",
        brand: result.brand || "",
        merchant_name: result.merchant_name || "",
        type: result.type,
      });
      toastSuccess("模板已应用");
      setTimeout(() => Taro.navigateTo({ url: "/pages/AddTransaction/index" }), 600);
    } catch (err: any) {
      Taro.hideLoading();
      toastError(err, "执行失败");
    }
  };

  /* ==================== 渲染 ==================== */

  return (
    <PageContainer
      loading={isLoading}
      loadingText={ACTION_LOADING}
      loadingVariant="list"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >

      {/* ====== 顶部工具栏（对齐 Categories/Budgets：无外层卡片） ====== */}
      <View className="tpl-toolbar">
        {!isLoading && orderedTemplates.length > 1 && (
          <Button
            variant={sortMode ? "primary" : "outline"}
            size="sm"
            onClick={sortMode ? handleCancelSortMode : handleEnterSortMode}
          >
            {sortModeLabel(sortMode)}
          </Button>
        )}
        <Button variant="primary" size="sm" onClick={openCreateForm}>
          ＋ 新建模板
        </Button>
      </View>

      {/* 排序提示 */}
      {sortMode && (
        <View className="tpl-sort-hint">
          <Text>长按卡片拖动调整顺序，完成后点击保存</Text>
          <Button variant="primary" size="sm" onClick={handleSaveSort}>{SORT_SAVE}</Button>
        </View>
      )}

      {/* ====== 模板卡片列表 ====== */}
      {orderedTemplates.length === 0 ? (
        <View className="tpl-empty">
          <EmptyState
            description="还没有交易模板，创建后记账可一键套用"
          />
        </View>
      ) : sortMode ? (
        <View className="tpl-drag-wrap">
          <DragSortList
            items={displayList}
            getKey={(t) => t.id}
            itemHeight={200}
            onReorder={handleMoveTo}
            renderItem={(t) => {
              const cat = findCat(t.category_id);
              return (
                <View className="tpl-card tpl-card--sort tpl-card--drag">
                  <View className="tpl-card__head">
                    <CategoryIcon icon={cat?.icon} size={28} className="tpl-card__icon" />
                    <Text className="tpl-card__name">{t.name}</Text>
                    <Text className="tpl-card__drag-handle">⋮⋮</Text>
                  </View>
                  <View className="tpl-card__body">
                    <View className={`tpl-card__type tpl-card__type--${t.type}`}>
                      <Text>{transactionTypeLabel(t.type)}</Text>
                    </View>
                    {cat && (
                      <Text className="tpl-card__cat">{cat.name}</Text>
                    )}
                    {t.amount != null && t.amount > 0 && (
                      <Text className={`tpl-card__amount tpl-card__amount--${t.type}`}>
                        {formatMoney(Number(t.amount), { compact: false })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </View>
      ) : (
        <View className="tpl-grid">
          {displayList.map((t) => {
              const cat = findCat(t.category_id);
              return (
                <View
                  key={t.id}
                  className="tpl-card"
                  onClick={() => openDetail(t)}
                >
                  {/* 卡片头部：图标 + 名称 */}
                  <View className="tpl-card__head">
                    <CategoryIcon icon={cat?.icon} size={28} className="tpl-card__icon" />
                    <Text className="tpl-card__name">{t.name}</Text>
                  </View>
                  {/* 卡片内容：类型标签 + 分类 + 金额 */}
                  <View className="tpl-card__body">
                    <View className={`tpl-card__type tpl-card__type--${t.type}`}>
                      <Text>{transactionTypeLabel(t.type)}</Text>
                    </View>
                    {cat && (
                      <Text className="tpl-card__cat">{cat.name}</Text>
                    )}
                    {t.amount != null && t.amount > 0 && (
                      <Text className={`tpl-card__amount tpl-card__amount--${t.type}`}>
                        {formatMoney(Number(t.amount), { compact: false })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

      {/* ========== 详情弹窗（对齐PC截图2） ========== */}
      {showDetail && selectedTemplate && (
        <BottomSheet
          title="模板详情"
          onClose={closeDetail}
          maxHeight="85vh"
          bodyClassName="tpl-detail-pad"
          footer={
            <View className="tpl-detail-footer">
              <Button variant="primary" size="sm" onClick={() => selectedTemplate && handleExecute(selectedTemplate)}>
                执行
              </Button>
              <Button variant="secondary" size="sm" onClick={handleEditFromDetail}>
                编辑
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyFromDetail}>
                复制
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteFromDetail}>
                删除
              </Button>
            </View>
          }
        >
          <View className="tpl-detail-hero">
            <CategoryIcon
              icon={findCat(selectedTemplate.category_id)?.icon}
              size={56}
              className="tpl-detail-hero__icon"
            />
            <Text className="tpl-detail-hero__name">{selectedTemplate.name}</Text>
            <View className="tpl-detail-hero__tags">
              <View className={`tpl-tag tpl-tag--type tpl-tag--${selectedTemplate.type}`}>
                <Text>{transactionTypeLabel(selectedTemplate.type)}</Text>
              </View>
              {selectedTemplate.amount != null && (
                <View className={`tpl-tag tpl-tag--amount tpl-tag--${selectedTemplate.type}`}>
                  <Text>{formatMoney(Number(selectedTemplate.amount), { compact: false })}</Text>
                </View>
              )}
              {findCat(selectedTemplate.category_id) && (
                <View className="tpl-tag tpl-tag--cat">
                  <Text>{findCat(selectedTemplate.category_id)?.name}</Text>
                </View>
              )}
            </View>
          </View>

          <View className="tpl-detail-divider" />

          <View className="tpl-detail-grid">
            {selectedTemplate.note && (
              <View className="tpl-detail-item">
                <Text className="tpl-detail-item__label">备注</Text>
                <Text className="tpl-detail-item__value">{selectedTemplate.note}</Text>
              </View>
            )}
            {selectedTemplate.latitude && selectedTemplate.longitude && (
              <View className="tpl-detail-item">
                <Text className="tpl-detail-item__label">位置</Text>
                <Text className="tpl-detail-item__value">
                  {selectedTemplate.latitude}, {selectedTemplate.longitude}
                </Text>
              </View>
            )}
            {selectedTemplate.location_name && (
              <View className="tpl-detail-item tpl-detail-item--full">
                <Text className="tpl-detail-item__label">地址</Text>
                <Text className="tpl-detail-item__value">{selectedTemplate.location_name}</Text>
              </View>
            )}
            {selectedTemplate.poi_id && (
              <View className="tpl-detail-item">
                <Text className="tpl-detail-item__label">商户 ID</Text>
                <Text className="tpl-detail-item__value">{selectedTemplate.poi_id}</Text>
              </View>
            )}
            {selectedTemplate.merchant_name && (
              <View className="tpl-detail-item">
                <Text className="tpl-detail-item__label">商户名称</Text>
                <Text className="tpl-detail-item__value">{selectedTemplate.merchant_name}</Text>
              </View>
            )}
            {selectedTemplate.book_id && (
              <View className="tpl-detail-item">
                <Text className="tpl-detail-item__label">账本 ID</Text>
                <Text className="tpl-detail-item__value">{selectedTemplate.book_id}</Text>
              </View>
            )}
            {selectedTemplate.sort_order !== undefined && (
              <View className="tpl-detail-item">
                <Text className="tpl-detail-item__label">排序</Text>
                <Text className="tpl-detail-item__value">第 {(selectedTemplate.sort_order ?? 0) + 1} 位</Text>
              </View>
            )}
            {selectedTemplate.frequency && (
              <View className="tpl-detail-item">
                <Text className="tpl-detail-item__label">周期</Text>
                <Text className="tpl-detail-item__value">
                  {FREQUENCY_LABELS[selectedTemplate.frequency] || selectedTemplate.frequency}
                </Text>
              </View>
            )}
            {selectedTemplate.start_date && (
              <View className="tpl-detail-item">
                <Text className="tpl-detail-item__label">开始日期</Text>
                <Text className="tpl-detail-item__value">{selectedTemplate.start_date}</Text>
              </View>
            )}
            {selectedTemplate.end_date && (
              <View className="tpl-detail-item">
                <Text className="tpl-detail-item__label">结束日期</Text>
                <Text className="tpl-detail-item__value">{selectedTemplate.end_date}</Text>
              </View>
            )}
            {selectedTemplate.last_executed_at && (
              <View className="tpl-detail-item">
                <Text className="tpl-detail-item__label">上次执行</Text>
                <Text className="tpl-detail-item__value">
                  {formatDateTime(selectedTemplate.last_executed_at)}
                </Text>
              </View>
            )}
            {selectedTemplate.created_at && (
              <View className="tpl-detail-item">
                <Text className="tpl-detail-item__label">创建时间</Text>
                <Text className="tpl-detail-item__value">{formatDateTime(selectedTemplate.created_at)}</Text>
              </View>
            )}
          </View>
        </BottomSheet>
      )}

      {/* ========== 表单弹窗（对齐PC截图） ========== */}
      {showForm && (
        <BottomSheet
          title={editingId ? "编辑模板" : "新建模板"}
          onClose={closeForm}
          maxHeight="90vh"
          bodyClassName="tpl-form-pad"
          footer={
            <View className="tpl-form-footer tpl-form-footer--single">
              <Button variant="primary" block size="md" onClick={handleFormSave}>{editingId ? "更新" : "创建"}</Button>
            </View>
          }
        >
          {/* 模板名称 */}
          <View className="tpl-fg">
            <Text className="tpl-fg__label tpl-fg__label--req">模板名称</Text>
            <Input
              className="tpl-fg__input"
              placeholder="如：公司食堂午餐"
              maxlength={20}
              value={form.name}
              onInput={(e: any) => setForm((p) => ({ ...p, name: e.detail.value }))}
            />
          </View>

          {/* 类型 + 分类 并排 */}
          <View className="tpl-fg-row">
            <View className="tpl-fg tpl-fg--half">
              <Text className="tpl-fg__label tpl-fg__label--req">类型</Text>
              <Picker
                mode="selector"
                range={TRANSACTION_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.key }))}
                rangeKey="label"
                value={form.type === "expense" ? 0 : 1}
                onChange={(e: any) =>
                  setForm((p) => ({ ...p, type: e.detail.value === 0 ? "expense" : "income", category_id: "" }))
                }
              >
                <View className="tpl-fg__select">
                  <Text className={`tpl-fg__select-val tpl-fg__select-val--${form.type}`}>
                    {transactionTypeLabel(form.type)}
                  </Text>
                  <Text
                    className="tpl-fg__select-cls"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      setForm((p) => ({ ...p, type: p.type === "expense" ? "income" : "expense", category_id: "" }));
                    }}
                  >×</Text>
                  <Text className="tpl-fg__select-arrow">·</Text>
                </View>
              </Picker>
            </View>
            <View className="tpl-fg tpl-fg--half">
              <Text className="tpl-fg__label tpl-fg__label--req">分类</Text>
              <Picker
                mode="selector"
                range={
                  catOpts.length > 0
                    ? catOpts.map((c: any) => {
                        const ic = c.icon || "";
                        const displayIcon = isIconUrl(ic) ? "📌" : ic;
                        return `${displayIcon} ${c.name}`;
                      })
                    : ["暂无分类"]
                }
                value={Math.max(0, catOpts.findIndex((c: any) => c.id === form.category_id))}
                onChange={(e: any) => {
                  if (catOpts.length > 0) {
                    setForm((p) => ({ ...p, category_id: catOpts[Number(e.detail.value)]?.id || "" }));
                  }
                }}
              >
                <View className="tpl-fg__select">
                  <Text className={`tpl-fg__select-val ${selectedCat ? "" : "tpl-fg__select-val--ph"}`}>
                    {selectedCat ? selectedCat.name : "选择分类"}
                  </Text>
                  <Text className="tpl-fg__select-arrow">·</Text>
                </View>
              </Picker>
            </View>
          </View>

          {/* 金额 */}
          <View className="tpl-fg">
            <Text className="tpl-fg__label">金额</Text>
            <View className="tpl-fg__input-wrap">
              <Text className="tpl-fg__yen">¥</Text>
              <Input
                className="tpl-fg__input tpl-fg__input--amount"
                placeholder="0.00"
                type="digit"
                value={form.amount}
                onInput={(e: any) => setForm((p) => ({ ...p, amount: sanitizeAmountInput(e.detail.value) }))}
              />
            </View>
          </View>

          {/* 备注 */}
          <View className="tpl-fg">
            <Text className="tpl-fg__label">备注</Text>
            <Input
              className="tpl-fg__input"
              placeholder="添加备注（可选）"
              value={form.note}
              onInput={(e: any) => setForm((p) => ({ ...p, note: e.detail.value }))}
            />
          </View>

          {/* 位置信息 */}
          <View className="tpl-fg">
            <Text className="tpl-fg__label">位置信息</Text>
            {form.location_name ? (
              <View className="tpl-location-block" onClick={() => setShowLocationPicker(true)}>
                <Text className="tpl-location-block__addr">{form.location_name}</Text>
                <View className="tpl-location-block__meta">
                  <Text className="tpl-location-block__coord">
                    {form.latitude}, {form.longitude}
                  </Text>
                  {form.poi_id && (
                    <Text className="tpl-location-block__poi">
                      商户ID: {form.poi_id}
                    </Text>
                  )}
                </View>
                <View className="tpl-location-block__actions">
                  <Text className="tpl-location-block__modify" onClick={() => setShowLocationPicker(true)}>
                    点击修改
                  </Text>
                  <Text
                    className="tpl-location-block__clear"
                    onClick={() =>
                      setForm((p) => ({ ...p, location_name: "", latitude: "", longitude: "", poi_id: "" }))
                    }
                  >
                    关闭
                  </Text>
                </View>
              </View>
            ) : (
              <View className="tpl-location-empty" onClick={() => setShowLocationPicker(true)}>
                <Text>📍 选择位置</Text>
              </View>
            )}
          </View>

          {/* 排序 */}
          <View className="tpl-fg">
            <Text className="tpl-fg__label">排序</Text>
            <Input
              className="tpl-fg__input tpl-fg__input--num"
              type="number"
              value={String(form.sort_order || 0)}
              onInput={(e: any) => setForm((p) => ({ ...p, sort_order: parseInt(e.detail.value) || 0 }))}
            />
          </View>
        </BottomSheet>
      )}

      {/* 位置选择器 */}
      {showLocationPicker && (
        <LocationPicker
          visible={showLocationPicker}
          initialLocation={
            form.latitude && form.longitude
              ? {
                  latitude: parseFloat(form.latitude),
                  longitude: parseFloat(form.longitude),
                  locationName: form.location_name || "",
                  address: form.location_name || "",
                  poiId: form.poi_id || null,
                }
              : null
          }
          onClose={() => setShowLocationPicker(false)}
          onConfirm={handleLocationConfirm}
        />
      )}

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        visible={showDelete}
        title={CONFIRM_DELETE_TITLE}
        message={confirmDeleteThis("模板")}
        confirmText={CONFIRM_DELETE_TEXT}
        danger
        confirmLoading={false}
        onCancel={() => { setShowDelete(false); setDeleteId(null); }}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}
