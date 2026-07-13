/**
 * TemplateManager — 模板管理（内嵌弹窗模式）
 *
 * 对齐 PC 端功能：
 *   列表页 + 详情弹窗（完整信息+执行/编辑/复制/删除）+ 表单弹窗（PC风格边框输入框）
 */
import { useState, useMemo } from "react";
import { View, Text, Input, Picker } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import PageLayout from "../../components/PageLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import CategoryIcon from "../../components/CategoryIcon";
import BottomSheet from "../../components/BottomSheet";
import LocationPicker, { LocationResult } from "../../components/LocationPicker";
import { EmptyState, Spinner } from "../../components/ui";
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
import { isIconUrl } from "../../utils/renderCategoryIcon";
import type { Template } from "../../types";
import "./index.scss";

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
  const { data: cats } = useCategories();

  /* ---- 数据获取 ---- */
  const { data: templates, isLoading, refetch } = useManualQuery<Template[]>({
    key: "templates",
    queryFn: () => getTemplates(),
  });

  useDidShow(() => { refetch(); });

  const displayList = useMemo(() => {
    return (templates || []).sort((a, b) => {
      const tA = a.type === "expense" ? 0 : 1;
      const tB = b.type === "expense" ? 0 : 1;
      return tA - tB || (a.sort_order || 0) - (b.sort_order || 0);
    });
  }, [templates]);

  /* ---- 排序模式 ---- */
  const [sortMode, setSortMode] = useState(false);
  const [sortOrder, setSortOrder] = useState<Template[]>([]);

  const sortedList = sortMode && sortOrder.length > 0 ? sortOrder : displayList;
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  /* ---- 分类查找 ---- */
  const findCat = (cid?: string) => (cats || []).find((c) => c.id === cid);
  const catOpts = useMemo(
    () => (cats || []).filter((c: any) => c.type === form.type),
    [cats, form.type],
  );
  const selectedCat = findCat(form.category_id);

  /* ==================== 排序逻辑 ==================== */
  const reorderMut = useMutation({
    mutationFn: (ids: string[]) => reorderTemplates({ ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      Taro.showToast({ title: "排序已保存", icon: "success" });
      setSortMode(false);
      setSortOrder([]);
      refetch();
    },
    onError: (err: any) => {
      Taro.showToast({ title: err?.message || "排序保存失败", icon: "none" });
    },
  });

  const handleEnterSortMode = () => { setSortOrder([...displayList]); setSortMode(true); };
  const handleCancelSortMode = () => { setSortMode(false); setSortOrder([]); };
  const handleMoveUp = (idx: number) => {
    if (idx <= 0) return;
    const nl = [...sortOrder]; [nl[idx - 1], nl[idx]] = [nl[idx], nl[idx - 1]];
    setSortOrder(nl);
  };
  const handleMoveDown = (idx: number) => {
    if (idx >= sortOrder.length - 1) return;
    const nl = [...sortOrder]; [nl[idx], nl[idx + 1]] = [nl[idx + 1], nl[idx]];
    setSortOrder(nl);
  };
  const handleSaveSort = () => {
    if (sortOrder.length === 0) return;
    reorderMut.mutate(sortOrder.map((t) => t.id));
  };

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
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      Taro.showToast({ title: "模板已删除", icon: "success" });
      setShowDelete(false);
      closeDetail();
      refetch();
    },
    onError: (err: any) => {
      Taro.showToast({ title: err?.message || "删除失败", icon: "none" });
      setShowDelete(false);
    },
  });
  const handleDeleteFromDetail = () => { closeDetail(); setShowDelete(true); };

  /* ==================== 表单弹窗 ==================== */
  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const createMut = useMutation({
    mutationFn: (data: any) => createTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      Taro.showToast({ title: editingId ? "模板已更新" : "模板已创建", icon: "success" });
      setShowForm(false);
      refetch();
    },
    onError: (err: any) => {
      Taro.showToast({ title: err?.message || "操作失败", icon: "none" });
      // 失败时也关闭表单，避免 loading 卡住
      setShowForm(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => updateTemplate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      Taro.showToast({ title: "模板已更新", icon: "success" });
      setShowForm(false);
      refetch();
    },
    onError: (err: any) => {
      Taro.showToast({ title: err?.message || "更新失败", icon: "none" });
      // 失败时也关闭表单，避免 loading 卡住
      setShowForm(false);
    },
  });

  const handleFormSave = () => {
    if (!form.name.trim()) {
      Taro.showToast({ title: "请输入模板名称", icon: "none" });
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

    if (editingId) {
      updateMut.mutate({ id: editingId, data });
    } else {
      createMut.mutate(data);
    }
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
      Taro.showLoading({ title: "加载中..." });
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
      Taro.navigateTo({ url: "/pages/AddTransaction/index" });
    } catch (err: any) {
      Taro.hideLoading();
      Taro.showToast({ title: err?.message || "执行失败", icon: "none" });
    }
  };

  /* ==================== 渲染 ==================== */
  const saving = createMut.isPending || updateMut.isPending;

  return (
    <PageLayout contentClassName="tpl-content" loading={isLoading} loadingText="加载中…">

      {/* ====== 顶部工具栏（对齐 Categories/Budgets：无外层卡片） ====== */}
      <View className="tpl-toolbar">
        {!isLoading && displayList.length > 1 && (
          <View
            className={`tpl-sort-btn ${sortMode ? "tpl-sort-btn--active" : ""}`}
            onClick={sortMode ? handleCancelSortMode : handleEnterSortMode}
          >
            <Text>{sortMode ? "完成排序" : "编辑排序"}</Text>
          </View>
        )}
        <View className="tpl-add-btn" onClick={openCreateForm}>
          <Text className="tpl-add-btn__icon">＋</Text>
          <Text className="tpl-add-btn__text">新建模板</Text>
        </View>
      </View>

      {/* 排序提示 */}
      {sortMode && (
        <View className="tpl-sort-hint">
          <Text>拖动调整顺序，完成后点击保存</Text>
            <View
              className={`tpl-sort-save ${reorderMut.isPending ? "tpl-sort-save--pending ui-spin-row" : ""}`}
              onClick={reorderMut.isPending ? undefined : handleSaveSort}
            >
              {reorderMut.isPending && <Spinner />}
              <Text>{reorderMut.isPending ? "保存中..." : "保存排序"}</Text>
            </View>
        </View>
      )}

      {/* ====== 模板卡片列表 ====== */}
      {displayList.length === 0 ? (
        <View className="tpl-empty">
          <EmptyState
            title="还没有交易模板"
            description="创建模板后，记账时可一键套用，省去重复填写。"
          />
        </View>
      ) : (
        <View className="tpl-grid">
          {sortedList.map((t, idx) => {
              const cat = findCat(t.category_id);
              return (
                <View
                  key={t.id}
                  className={`tpl-card ${sortMode ? "tpl-card--sort" : ""}`}
                  onClick={() => !sortMode && openDetail(t)}
                >
                  {/* 卡片头部：图标 + 名称 */}
                  <View className="tpl-card__head">
                    <CategoryIcon icon={cat?.icon} size={28} className="tpl-card__icon" />
                    <Text className="tpl-card__name">{t.name}</Text>
                  </View>
                  {/* 卡片内容：类型标签 + 分类 + 金额 */}
                  <View className="tpl-card__body">
                    <View className={`tpl-card__type tpl-card__type--${t.type}`}>
                      <Text>{t.type === "expense" ? "支出" : "收入"}</Text>
                    </View>
                    {cat && (
                      <Text className="tpl-card__cat">{cat.name}</Text>
                    )}
                    {t.amount != null && t.amount > 0 && (
                      <Text className={`tpl-card__amount tpl-card__amount--${t.type}`}>
                        ¥{Number(t.amount).toFixed(2)}
                      </Text>
                    )}
                  </View>

                  {/* 排序模式的操作按钮 */}
                  {sortMode && (
                    <View className="tpl-card__sort-actions">
                      <View
                        className={`tpl-pill tpl-pill--sort ${idx === 0 ? "tpl-pill--disabled" : ""}`}
                        onClick={(e: any) => { e.stopPropagation(); handleMoveUp(idx); }}
                      >
                        <Text>↑</Text>
                      </View>
                      <View
                        className={`tpl-pill tpl-pill--sort ${idx === sortOrder.length - 1 ? "tpl-pill--disabled" : ""}`}
                        onClick={(e: any) => { e.stopPropagation(); handleMoveDown(idx); }}
                      >
                        <Text>↓</Text>
                      </View>
                    </View>
                  )}
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
              <View className="tpl-detail-btn tpl-detail-btn--execute" onClick={() => selectedTemplate && handleExecute(selectedTemplate)}>
                <Text>执行</Text>
              </View>
              <View className="tpl-detail-btn tpl-detail-btn--edit" onClick={handleEditFromDetail}>
                <Text>编辑</Text>
              </View>
              <View className="tpl-detail-btn tpl-detail-btn--copy" onClick={handleCopyFromDetail}>
                <Text>复制</Text>
              </View>
              <View className="tpl-detail-btn tpl-detail-btn--delete" onClick={handleDeleteFromDetail}>
                <Text>删除</Text>
              </View>
            </View>
          }
        >
          <View className="tpl-detail-hero">
            <CategoryIcon
              icon={findCat(selectedTemplate.category_id)?.icon}
              size={48}
              className="tpl-detail-hero__icon"
            />
            <Text className="tpl-detail-hero__name">{selectedTemplate.name}</Text>
            <View className="tpl-detail-hero__tags">
              <View className={`tpl-tag tpl-tag--type tpl-tag--${selectedTemplate.type}`}>
                <Text>{selectedTemplate.type === "expense" ? "支出" : "收入"}</Text>
              </View>
              {selectedTemplate.amount != null && (
                <View className={`tpl-tag tpl-tag--amount tpl-tag--${selectedTemplate.type}`}>
                  <Text>¥{Number(selectedTemplate.amount).toFixed(2)}</Text>
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
            {selectedTemplate.created_at && (
              <View className="tpl-detail-item">
                <Text className="tpl-detail-item__label">创建时间</Text>
                <Text className="tpl-detail-item__value">{selectedTemplate.created_at.slice(0, 16).replace("T", " ")}</Text>
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
              <View
                className={`tpl-form-btn tpl-form-btn--submit ${saving ? "tpl-form-btn--disabled ui-spin-row" : ""}`}
                onClick={saving ? undefined : handleFormSave}
              >
                {saving && <Spinner />}
                <Text>{saving ? "保存中..." : (editingId ? "更新" : "创建")}</Text>
              </View>
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
                range={[{ label: "支出", value: "expense" }, { label: "收入", value: "income" }]}
                rangeKey="label"
                value={form.type === "expense" ? 0 : 1}
                onChange={(e: any) =>
                  setForm((p) => ({ ...p, type: e.detail.value === 0 ? "expense" : "income", category_id: "" }))
                }
              >
                <View className="tpl-fg__select">
                  <Text className={`tpl-fg__select-val tpl-fg__select-val--${form.type}`}>
                    {form.type === "expense" ? "支出" : "收入"}
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
                onInput={(e: any) => setForm((p) => ({ ...p, amount: e.detail.value }))}
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
        title="确认删除"
        message="确定要删除这个模板吗？"
        confirmText="确认删除"
        danger
        confirmLoading={deleteMut.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => selectedTemplate && deleteMut.mutate(selectedTemplate.id)}
      />
    </PageLayout>
  );
}
