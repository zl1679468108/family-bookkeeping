/**
 * TemplateEdit — 模板新增/编辑页
 * 对齐 PC：名称 / 类型 / 分类 / 金额 / 备注 / 商户 / 位置（高德坐标）
 * 列表点击 → 本页（带 id=编辑；不带 id=新增）
 * 编辑模式下底部含「删除」按钮（ConfirmDialog 确认）
 */
import { useState, useEffect, useMemo } from "react";
import { View, Text, Input, Picker } from "@tarojs/components";
import Taro, { getCurrentInstance } from "@tarojs/taro";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageLayout from "../../components/PageLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import CategoryIcon from "../../components/CategoryIcon";
import LocationPicker, { LocationResult } from "../../components/LocationPicker";
import { AppSection, PageHero, Spinner } from "../../components/ui";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../../services/templatesApi";
import { useCategories } from "../../hooks/useCategories";
import { isIconUrl } from "../../utils/renderCategoryIcon";
import "./index.scss";

type TplType = "expense" | "income";

export default function TemplateEdit() {
  const router = getCurrentInstance().router;
  const id = (router?.params?.id as string) || "";
  const typeParam = (router?.params?.type as TplType) || "expense";
  const isEdit = !!id;
  const qc = useQueryClient();

  const { data: cats } = useCategories();

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: getTemplates,
  });
  const existing = useMemo(
    () => (templates || []).find((t: any) => t.id === id),
    [templates, id],
  );

  const [form, setForm] = useState({
    name: "",
    type: "expense" as TplType,
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
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (isEdit && existing) {
      setForm({
        name: existing.name,
        type: existing.type,
        category_id: existing.category_id || "",
        amount: existing.amount ? String(existing.amount) : "",
        note: existing.note || "",
        merchant_name: existing.merchant_name || "",
        latitude: existing.latitude ? String(existing.latitude) : "",
        longitude: existing.longitude ? String(existing.longitude) : "",
        location_name: existing.location_name || "",
        poi_id: existing.poi_id || "",
        sort_order: existing.sort_order || 0,
      });
    } else {
      setForm((p) => ({ ...p, type: typeParam }));
    }
  }, [isEdit, existing, typeParam]);

  // --- Mutations ---
  const createMut = useMutation({
    mutationFn: (data: any) => createTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      Taro.showToast({ title: "模板已创建", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 500);
    },
    onError: (err: any) => Taro.showToast({ title: err?.message || "创建失败", icon: "none" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => updateTemplate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      Taro.showToast({ title: "模板已更新", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 500);
    },
    onError: (err: any) => Taro.showToast({ title: err?.message || "更新失败", icon: "none" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      Taro.showToast({ title: "模板已删除", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 500);
    },
    onError: (err: any) => {
      Taro.showToast({ title: err?.message || "删除失败", icon: "none" });
      setShowDelete(false);
    },
  });

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

    if (isEdit) {
      updateMut.mutate({ id, data });
    } else {
      createMut.mutate(data);
    }
  };

  const typeOpts = ["expense", "income"];
  const catOpts = (cats || []).filter((c: any) => c.type === form.type);
  const selectedCat = (cats || []).find((c: any) => c.id === form.category_id);

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

  const saving = createMut.isPending || updateMut.isPending;
  const title = isEdit ? "编辑模板" : "新建模板";

  return (
    <PageLayout contentClassName="tpledit-content">
      <PageHero
        eyebrow={form.type === "expense" ? "支出模板" : "收入模板"}
        title={title}
        meta={isEdit ? "修改后保存" : "填写模板信息"}
        tone="surface"
      />

      <AppSection title="模板信息" compact>
        <View className="tpledit-form-row">
          <Text className="tpledit-form-label">模板名称</Text>
          <Input
            className="tpledit-form-input"
            placeholder="如：公司食堂午餐"
            maxlength={20}
            value={form.name}
            onInput={(e: any) => setForm((p) => ({ ...p, name: e.detail.value }))}
          />
        </View>

        <View className="tpledit-picker-row">
          <Text className="tpledit-picker-label">类型</Text>
          <Picker
            mode="selector"
            range={typeOpts.map((t) => (t === "expense" ? "支出" : "收入"))}
            value={typeOpts.indexOf(form.type)}
            onChange={(e: any) =>
              setForm((p) => ({
                ...p,
                type: typeOpts[e.detail.value] as TplType,
                category_id: "",
              }))
            }
          >
            <View className="tpledit-picker-item">
              <Text
                className={`tpledit-picker-value tpledit-picker-value--${
                  form.type === "expense" ? "expense" : "income"
                }`}
              >
                {form.type === "expense" ? "支出" : "收入"}
              </Text>
              <Text className="tpledit-picker-arrow">▸</Text>
            </View>
          </Picker>
        </View>

        <View className="tpledit-picker-row">
          <Text className="tpledit-picker-label">分类</Text>
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
            value={
              catOpts.length > 0
                ? catOpts.findIndex((c: any) => c.id === form.category_id)
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
            <View className="tpledit-picker-item">
              <Text className="tpledit-picker-value">
                {selectedCat ? selectedCat.name : "选择分类"}
              </Text>
              <Text className="tpledit-picker-arrow">▸</Text>
            </View>
          </Picker>
        </View>

        {selectedCat && (
          <View className="tpledit-cat-preview">
            <CategoryIcon icon={selectedCat.icon} className="tpledit-cat-preview__icon" />
            <Text className="tpledit-cat-preview__name">{selectedCat.name}</Text>
          </View>
        )}

        <View className="tpledit-form-row">
          <Text className="tpledit-form-label">金额</Text>
          <Input
            className="tpledit-form-input"
            placeholder="0.00"
            type="digit"
            value={form.amount}
            onInput={(e: any) => setForm((p) => ({ ...p, amount: e.detail.value }))}
          />
        </View>

        <View className="tpledit-form-row">
          <Text className="tpledit-form-label">备注</Text>
          <Input
            className="tpledit-form-input"
            placeholder="添加备注（可选）"
            value={form.note}
            onInput={(e: any) => setForm((p) => ({ ...p, note: e.detail.value }))}
          />
        </View>

        <View className="tpledit-form-row">
          <Text className="tpledit-form-label">商户</Text>
          <Input
            className="tpledit-form-input"
            placeholder="如：星巴克（可选）"
            value={form.merchant_name}
            onInput={(e: any) => setForm((p) => ({ ...p, merchant_name: e.detail.value }))}
          />
        </View>

        <View className="tpledit-form-row tpledit-form-row--location">
          <Text className="tpledit-form-label">位置信息</Text>
          <View className="tpledit-location-picker" onClick={() => setShowLocationPicker(true)}>
            <Text className="tpledit-location-text">
              {form.location_name || "点击选择位置"}
            </Text>
            <Text className="tpledit-location-arrow">›</Text>
          </View>
        </View>

        {form.location_name && (
          <View className="tpledit-location-coords">
            <Text>
              坐标：{form.latitude}, {form.longitude}
            </Text>
            <Text
              className="tpledit-location-clear"
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
      </AppSection>

      {/* 底部操作栏 */}
      <View className="tpledit-actions">
        {isEdit && (
          <View
            className={`tpledit-actions__delete ${deleteMut.isPending ? "tpledit-actions__delete--pending" : ""}`}
            onClick={() => setShowDelete(true)}
          >
            <Text>删除</Text>
          </View>
        )}
        <View
          className={`tpledit-actions__save ${saving ? "tpledit-actions__save--disabled ui-spin-row" : ""} ${
            isEdit ? "" : "tpledit-actions__save--full"
          }`}
          onClick={saving ? undefined : handleSave}
        >
          {saving && <Spinner />}
          <Text>{saving ? "保存中..." : isEdit ? "更新" : "创建"}</Text>
        </View>
      </View>

      {/* 位置选择弹窗 */}
      {showLocationPicker && (
        <LocationPicker
          visible={showLocationPicker}
          initialLocation={initialLocation}
          onClose={() => setShowLocationPicker(false)}
          onConfirm={handleLocationConfirm}
        />
      )}

      <ConfirmDialog
        visible={showDelete}
        title="确认删除"
        message="确定要删除这个模板吗？"
        confirmText="确认删除"
        danger
        confirmLoading={deleteMut.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => deleteMut.mutate(id)}
      />
    </PageLayout>
  );
}
