/**
 * TemplateManager — v3.1 模板管理页
 * 对齐 PC：创建/编辑/删除模板，预填类型/分类/备注/位置，支持排序
 * 布局：列表 + 悬浮新建按钮 + Picker 式编辑弹窗
 * 地图：使用 LocationPicker（高德坐标，与后端一致）
 */
import { useState, useMemo } from "react";
import { View, Text, Input, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";
import PageLayout from "../../components/PageLayout";
import CategoryIcon from "../../components/CategoryIcon";
import LocationPicker, { LocationResult } from "../../components/LocationPicker";
import { AppSection, PageHero } from "../../components/ui";
import { getTemplates, createTemplate, updateTemplate, deleteTemplate, reorderTemplates, executeTemplate } from "../../services/templatesApi";
import { useCategories } from "../../hooks/useCategories";
import { useManualQuery } from "../../hooks/useManualQuery";
import { isIconUrl } from "../../utils/renderCategoryIcon";
import "./index.scss";

interface Template {
  id: string;
  name: string;
  type: "expense" | "income";
  category_id?: string;
  amount?: number;
  note?: string;
  description?: string;
  brand?: string;
  merchant_name?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  poi_id?: string | null;
  sort_order?: number;
}

export default function TemplateManager() {
  const qc = useQueryClient();
  const { data: cats } = useCategories();

  // Tab：支出/收入
  const [tabIndex, setTabIndex] = useState<number>(0);
  const curType: "expense" | "income" = tabIndex === 0 ? "expense" : "income";

  // Picker 编辑/新增弹窗状态
  const [showPicker, setShowPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 排序模式
  const [sortMode, setSortMode] = useState(false);
  const [sortOrder, setSortOrder] = useState<Template[]>([]);

  // 表单状态
  const [form, setForm] = useState({
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
  });

  const { data: templates, isLoading, refetch } = useManualQuery<Template[]>({
    key: "templates",
    queryFn: () => getTemplates(),
  });

  // 过滤并排序（当前类型）
  const filtered = useMemo(() => {
    return (templates || [])
      .filter((t) => t.type === curType)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [templates, curType]);

  // 排序模式下的列表
  const displayList = sortMode && sortOrder.length > 0 ? sortOrder : filtered;

  // --- Mutations ---
  const createMut = useMutation({
    mutationFn: (data: any) => createTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      Taro.showToast({ title: "模板创建成功", icon: "success" });
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => updateTemplate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      Taro.showToast({ title: "模板更新成功", icon: "success" });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      Taro.showToast({ title: "模板已删除", icon: "success" });
      setDeleteId(null);
    },
  });

  const reorderMut = useMutation({
    mutationFn: (ids: string[]) => reorderTemplates({ ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      Taro.showToast({ title: "排序已保存", icon: "success" });
      setSortMode(false);
      setSortOrder([]);
      refetch();
    },
  });

  // --- Helpers ---
  const resetForm = () => {
    const currentTypeTemplates = templates?.filter((t) => t.type === form.type) || [];
    const nextSortOrder = currentTypeTemplates.length + 1;
    setForm({
      name: "",
      type: curType,
      category_id: "",
      amount: "",
      note: "",
      merchant_name: "",
      latitude: "",
      longitude: "",
      location_name: "",
      poi_id: "",
      sort_order: nextSortOrder,
    });
    setShowPicker(false);
    setEditingId(null);
  };

  // 进入排序模式
  const handleEnterSortMode = () => {
    setSortOrder([...filtered]);
    setSortMode(true);
  };

  // 退出排序模式
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

  // 提交排序
  const handleSaveSort = () => {
    if (sortOrder.length === 0) return;
    const ids = sortOrder.map((t) => t.id);
    reorderMut.mutate(ids);
  };

  // 点击列表项 → 打开 Picker 编辑弹窗
  const handleEdit = (t: Template) => {
    setForm({
      name: t.name,
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
    setEditingId(t.id);
    setShowPicker(true);
  };

  // 点击悬浮按钮 → 打开 Picker 新增弹窗
  const handleAdd = () => {
    resetForm();
    setForm((p) => ({
      ...p,
      type: curType,
      category_id: "",
    }));
    setEditingId(null);
    setShowPicker(true);
  };

  // 执行模板 → 跳转到记一笔页面
  const handleExecute = async (t: Template) => {
    try {
      Taro.showLoading({ title: "加载中..." });
      const result = await executeTemplate(t.id);
      Taro.hideLoading();
      // 存储模板执行结果到 storage，供 AddTransaction 页面读取
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
      Taro.showToast({ title: err?.message || "执行模板失败", icon: "none" });
    }
  };

  // 位置选择确认
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

  const handleSave = () => {
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

  const typeOpts = ["expense", "income"];
  const catOpts = (cats || []).filter((c) => c.type === form.type);

  // LocationPicker 的初始位置
  const initialLocation =
    form.latitude && form.longitude
      ? {
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          locationName: form.location_name || "",
          address: form.location_name || "",
          poiId: form.poi_id || null,
        }
      : null;

  return (
    <PageLayout contentClassName="tpl-content">
      <PageHero
        eyebrow="模板管理"
        title={curType === "expense" ? "支出模板" : "收入模板"}
        meta={`${filtered.length} 个模板 · ${sortMode ? "排序模式" : "点击模板可编辑或执行"}`}
        tone="surface"
      />

      {/* Tab 切换：支出 / 收入 + 排序按钮 */}
      <View className="tpl-tabs-card">
        <View className="tpl-pill-tabs">
          <View
            className={`tpl-pill-tab ${tabIndex === 0 ? "tpl-pill-tab--active" : ""}`}
            onClick={() => {
              if (sortMode) handleCancelSortMode();
              setTabIndex(0);
            }}
          >
            <Text className="tpl-pill-tab__text">支出模板</Text>
          </View>
          <View
            className={`tpl-pill-tab ${tabIndex === 1 ? "tpl-pill-tab--active" : ""}`}
            onClick={() => {
              if (sortMode) handleCancelSortMode();
              setTabIndex(1);
            }}
          >
            <Text className="tpl-pill-tab__text">收入模板</Text>
          </View>
        </View>
        {!isLoading && filtered.length > 1 && (
          <View
            className={`tpl-sort-btn ${sortMode ? "tpl-sort-btn--active" : ""}`}
            onClick={sortMode ? handleCancelSortMode : handleEnterSortMode}
          >
            <Text>{sortMode ? "取消" : "排序"}</Text>
          </View>
        )}
      </View>

      {/* 排序模式提示条 */}
      {sortMode && (
        <View className="tpl-sort-hint">
          <Text>点击 ↑ / ↓ 调整顺序，完成后点击「保存排序」</Text>
          <View
            className={`tpl-sort-save ${reorderMut.isPending ? "tpl-sort-save--pending" : ""}`}
            onClick={handleSaveSort}
          >
            <Text>{reorderMut.isPending ? "保存中..." : "保存排序"}</Text>
          </View>
        </View>
      )}

      {/* Template List */}
      <AppSection title="模板列表" compact flush>
      {isLoading ? (
        <View className="tpl-list">
          <View className="tpl-loading-row" />
          <View className="tpl-loading-row" />
          <View className="tpl-loading-row" />
        </View>
      ) : filtered.length === 0 ? (
        <View className="tpl-empty">
          <EmptyState
            icon="template"
            title={`暂无${curType === "expense" ? "支出" : "收入"}模板`}
            description="点击右下角 ＋ 新建模板"
          />
        </View>
      ) : (
        <View className="tpl-list">
          {displayList.map((t, idx) => {
            const cat = cats?.find((c) => c.id === t.category_id);
            return (
              <View
                key={t.id}
                className={`tpl-card ${sortMode ? "tpl-card--sort" : ""}`}
                onClick={() => {
                  if (sortMode) return;
                  handleEdit(t);
                }}
              >
                <View className="tpl-card__head">
                  <CategoryIcon icon={cat?.icon} className="tpl-card__icon" />
                  <Text className="tpl-card__name">{t.name}</Text>
                </View>
                <View className="tpl-card__meta">
                  {cat && (
                    <Text className="tpl-card__meta-line">
                      分类：{cat.name}
                    </Text>
                  )}
                  {t.amount != null && t.amount > 0 && (
                    <Text className="tpl-card__meta-line">
                      金额：¥{Number(t.amount).toFixed(2)}
                    </Text>
                  )}
                  {t.note && (
                    <Text className="tpl-card__meta-line">备注：{t.note}</Text>
                  )}
                  {t.merchant_name && (
                    <Text className="tpl-card__meta-line">
                      商户：{t.merchant_name}
                    </Text>
                  )}
                  {t.location_name && (
                    <Text className="tpl-card__meta-line">
                      位置：{t.location_name}
                    </Text>
                  )}
                  <Text className="tpl-card__meta-line">排序：第 {idx + 1} 位</Text>
                </View>
                <View className="tpl-card__actions">
                  {sortMode ? (
                    <>
                      <View
                        className={`tpl-pill tpl-pill--sort ${idx === 0 ? "tpl-pill--disabled" : ""}`}
                        onClick={(e: any) => {
                          e.stopPropagation();
                          handleMoveUp(idx);
                        }}
                      >
                        <Text>↑ 上移</Text>
                      </View>
                      <View
                        className={`tpl-pill tpl-pill--sort ${idx === sortOrder.length - 1 ? "tpl-pill--disabled" : ""}`}
                        onClick={(e: any) => {
                          e.stopPropagation();
                          handleMoveDown(idx);
                        }}
                      >
                        <Text>↓ 下移</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View
                        className="tpl-pill tpl-pill--execute"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          handleExecute(t);
                        }}
                      >
                        <Text>执行</Text>
                      </View>
                      <View
                        className="tpl-pill tpl-pill--edit"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          handleEdit(t);
                        }}
                      >
                        <Text>编辑</Text>
                      </View>
                      <View
                        className="tpl-pill tpl-pill--delete"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          setDeleteId(t.id);
                        }}
                      >
                        <Text>删除</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
      </AppSection>

      {/* 悬浮新建按钮（非排序模式） */}
      {!sortMode && (
        <View className="tpl-fab" onClick={handleAdd}>
          <Text className="tpl-fab__icon">＋</Text>
        </View>
      )}

      {/* Picker 式编辑/新增弹窗 */}
      {showPicker && (
        <View className="tpl-mask" onClick={resetForm}>
          <View
            className="tpl-sheet"
            onClick={(e: any) => e.stopPropagation()}
          >
            <View className="tpl-sheet__header">
              <Text className="tpl-sheet__cancel" onClick={resetForm}>
                取消
              </Text>
              <Text className="tpl-sheet__title">
                {editingId ? "编辑模板" : "新建模板"}
              </Text>
              <Text
                className={`tpl-sheet__confirm ${
                  createMut.isPending || updateMut.isPending
                    ? "tpl-sheet__confirm--disabled"
                    : ""
                }`}
                onClick={handleSave}
              >
                {createMut.isPending || updateMut.isPending ? "保存中…" : "保存"}
              </Text>
            </View>

            <View className="tpl-sheet__body">
              <View className="tpl-form-row">
                <Text className="tpl-form-label">名称</Text>
                <Input
                  className="tpl-form-input"
                  placeholder="如：公司食堂午餐"
                  maxlength={20}
                  value={form.name}
                  onInput={(e: any) =>
                    setForm((p) => ({ ...p, name: e.detail.value }))
                  }
                />
              </View>

              <View className="tpl-picker-row">
                <Text className="tpl-picker-label">类型</Text>
                <Picker
                  mode="selector"
                  range={typeOpts.map((t) => (t === "expense" ? "支出" : "收入"))}
                  value={typeOpts.indexOf(form.type)}
                  onChange={(e: any) =>
                    setForm((p) => ({
                      ...p,
                      type: typeOpts[e.detail.value] as any,
                      category_id: "",
                    }))
                  }
                >
                  <View className="tpl-picker-item">
                    <Text
                      className={`tpl-picker-value tpl-picker-value--${
                        form.type === "expense" ? "expense" : "income"
                      }`}
                    >
                      {form.type === "expense" ? "支出" : "收入"}
                    </Text>
                    <Text className="tpl-picker-arrow">▸</Text>
                  </View>
                </Picker>
              </View>

              <View className="tpl-picker-row">
                <Text className="tpl-picker-label">分类</Text>
                <Picker
                  mode="selector"
                  range={
                    catOpts.length > 0
                      ? catOpts.map((c) => {
                          const ic = c.icon || "";
                          // Picker 只能渲染文本，自定义 URL 图标降级为 📌
                          const displayIcon = isIconUrl(ic) ? "📌" : ic;
                          return `${displayIcon} ${c.name}`;
                        })
                      : ["暂无分类"]
                  }
                  value={
                    catOpts.length > 0
                      ? catOpts.findIndex((c) => c.id === form.category_id)
                      : 0
                  }
                  onChange={(e: any) => {
                    if (catOpts.length > 0) {
                      const idx = Number(e.detail.value);
                      setForm((p) => ({
                        ...p,
                        category_id: catOpts[idx]?.id || "",
                      }));
                    }
                  }}
                >
                  <View className="tpl-picker-item">
                    <Text className="tpl-picker-value">
                      {form.category_id && catOpts.find((c) => c.id === form.category_id)
                        ? catOpts.find((c) => c.id === form.category_id)?.name || ""
                        : "选择分类"}
                    </Text>
                    <Text className="tpl-picker-arrow">▸</Text>
                  </View>
                </Picker>
              </View>

              <View className="tpl-form-row">
                <Text className="tpl-form-label">金额</Text>
                <Input
                  className="tpl-form-input"
                  placeholder="0.00"
                  type="digit"
                  value={form.amount}
                  onInput={(e: any) =>
                    setForm((p) => ({ ...p, amount: e.detail.value }))
                  }
                />
              </View>

              <View className="tpl-form-row">
                <Text className="tpl-form-label">备注</Text>
                <Input
                  className="tpl-form-input"
                  placeholder="添加备注（可选）"
                  value={form.note}
                  onInput={(e: any) =>
                    setForm((p) => ({ ...p, note: e.detail.value }))
                  }
                />
              </View>

              <View className="tpl-form-row">
                <Text className="tpl-form-label">商户</Text>
                <Input
                  className="tpl-form-input"
                  placeholder="如：星巴克、 Walmart（可选）"
                  value={form.merchant_name}
                  onInput={(e: any) =>
                    setForm((p) => ({ ...p, merchant_name: e.detail.value }))
                  }
                />
              </View>

              {/* 位置选择：使用高德坐标的 LocationPicker（与后端一致） */}
              <View className="tpl-form-row tpl-form-row--location">
                <Text className="tpl-form-label">位置</Text>
                <View
                  className="tpl-location-picker"
                  onClick={() => setShowLocationPicker(true)}
                >
                  <Text className="tpl-location-text">
                    {form.location_name || "点击选择位置"}
                  </Text>
                  <Text className="tpl-location-arrow">›</Text>
                </View>
              </View>

              {form.location_name && (
                <View className="tpl-location-coords">
                  <Text>
                    坐标：{form.latitude}, {form.longitude}
                  </Text>
                  <Text
                    className="tpl-location-clear"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        location_name: "",
                        latitude: "",
                        longitude: "",
                        poi_id: "",
                      }))
                    }
                  >
                    清除
                  </Text>
                </View>
              )}

              <View className="tpl-form-row">
                <Text className="tpl-form-label">商户 ID</Text>
                <Input
                  className="tpl-form-input"
                  placeholder="POI ID"
                  value={form.poi_id}
                  onInput={(e: any) =>
                    setForm((p) => ({ ...p, poi_id: e.detail.value }))
                  }
                />
              </View>
            </View>

            <View className="tpl-sheet__safe" />
          </View>
        </View>
      )}

      {/* 位置选择弹窗（高德坐标） */}
      {showLocationPicker && (
        <LocationPicker
          visible={showLocationPicker}
          initialLocation={initialLocation}
          onClose={() => setShowLocationPicker(false)}
          onConfirm={handleLocationConfirm}
        />
      )}

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        visible={!!deleteId}
        title="确认删除"
        message="确定要删除这个模板吗？"
        confirmText="确认删除"
        confirmLoading={deleteMut.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
      />
    </PageLayout>
  );
}
