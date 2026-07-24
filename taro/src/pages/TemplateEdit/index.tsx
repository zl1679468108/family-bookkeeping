/**
 * TemplateEdit — 模板新增/编辑页
 * 对齐 PC：名称 / 类型 / 分类 / 金额 / 备注 / 位置（高德坐标）
 * 列表点击 → 本页（带 id=编辑；不带 id=新增）
 * 编辑模式下底部含「删除」按钮（ConfirmDialog 确认）
 */
import { useState, useEffect, useMemo } from "react";
import { View, Text, Input, Picker } from "@tarojs/components";
import Taro, { getCurrentInstance } from "@tarojs/taro";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "../../components/PageContainer";
import ConfirmDialog from "../../components/ConfirmDialog";
import { AppSection, PageHero, Button, StickyActionBar } from "../../components/ui";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../../services/templatesApi";
import { useCategories } from "../../hooks/useCategories";
import { useManualQuery } from "../../hooks/useManualQuery";
import { useSubmit, toastError } from "../../hooks/useSubmit";
import { transactionTypeLabel } from "../../utils/transactionType";
import { isIconUrl } from "../../utils/renderCategoryIcon";
import LocationPicker, { LocationResult } from "../../components/LocationPicker";
import Icon, { ICON_COLOR } from "../../components/Icon";
import "./index.scss";
import { toastSuccess, toastInfo } from "../../utils/toast";
import { ACTION_DELETING, ACTION_LOADING, ACTION_SAVING } from "../../utils/actionCopy";
import {
  CONFIRM_DELETE_TITLE,
  CONFIRM_DELETE_TEXT,
  confirmDeleteThis,
} from "../../utils/confirmCopy";
import { successEntityDeleted, successEntityUpsert } from "../../utils/successCopy";
import { FORM_TEMPLATE_NAME_REQUIRED, FORM_CATEGORY_REQUIRED } from "../../utils/formCopy";

type TplType = "expense" | "income";

export default function TemplateEdit() {
  const router = getCurrentInstance().router;
  const id = (router?.params?.id as string) || "";
  const typeParam = (router?.params?.type as TplType) || "expense";
  const isEdit = !!id;
  const qc = useQueryClient();
  const { run } = useSubmit();

  const { data: cats } = useCategories();

  const { data: templates = [], isLoading } = useManualQuery<any[]>({
    key: "templates",
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
        latitude: existing.latitude ? String(existing.latitude) : "",
        longitude: existing.longitude ? String(existing.longitude) : "",
        location_name: existing.location_name || "",
        poi_id: existing.poi_id || "",
        sort_order: existing.sort_order || 0,
      });
    } else {
      const sameTypeCount = (templates || []).filter((t: any) => t.type === typeParam).length;
      setForm((p) => ({
        ...p,
        type: typeParam,
        sort_order: sameTypeCount + 1,
      }));
    }
  }, [isEdit, existing, typeParam, templates]);

  // --- 保存/删除 ---
  const handleSave = () => {
    if (!form.name.trim()) {
      toastInfo(FORM_TEMPLATE_NAME_REQUIRED);
      return;
    }
    if (!form.category_id) {
      toastInfo(FORM_CATEGORY_REQUIRED);
      return;
    }
    const data: any = {
      name: form.name.trim(),
      type: form.type,
      category_id: form.category_id,
      sort_order: form.sort_order,
    };
    if (form.amount) data.amount = parseFloat(form.amount);
    if (form.note.trim()) data.note = form.note.trim();
    if (form.location_name.trim()) data.location_name = form.location_name.trim();
    if (form.poi_id) data.poi_id = form.poi_id;
    if (form.latitude) data.latitude = parseFloat(form.latitude);
    if (form.longitude) data.longitude = parseFloat(form.longitude);

    run(async () => {
      if (isEdit) {
        await updateTemplate(id, data);
      } else {
        await createTemplate(data);
      }
      qc.invalidateQueries({ queryKey: ["templates"] });
      toastSuccess(successEntityUpsert("模板", isEdit));
      setTimeout(() => Taro.navigateBack(), 500);
    }, ACTION_SAVING).catch((err: any) => {
      toastError(err, isEdit ? "更新失败" : "创建失败");
    });
  };

  const handleDelete = () => {
    run(async () => {
      await deleteTemplate(id);
      qc.invalidateQueries({ queryKey: ["templates"] });
      toastSuccess(successEntityDeleted("模板"));
      setTimeout(() => Taro.navigateBack(), 500);
    }, ACTION_DELETING).catch((err: any) => {
      toastError(err, "删除失败");
      setShowDelete(false);
    });
  };

  const typeOpts = ["expense", "income"];
  const typeDisplayRange = ["选择类型", ...typeOpts.map((t) => transactionTypeLabel(t))];
  const catOpts = (cats || []).filter((c: any) => c.type === form.type);
  const selectedCat = (cats || []).find((c: any) => c.id === form.category_id);

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

  const clearLocation = () =>
    setForm((p) => ({
      ...p,
      location_name: "",
      latitude: "",
      longitude: "",
      poi_id: "",
    }));

  const title = isEdit ? "编辑模板" : "新建模板";

  const formatCategoryLabel = (cat: any) => {
    if (!cat) return "选择分类";
    const icon = cat.icon || "";
    const displayIcon = isIconUrl(icon) ? "📌" : icon;
    return `${displayIcon} ${cat.name}`;
  };

  const formatTypeLabel = (type: string) => {
    if (type === "expense") return "支出";
    if (type === "income") return "收入";
    return "选择类型";
  };

  return (
    <PageContainer bottomSpace={180} loading={isLoading} loadingText={ACTION_LOADING}>
      <PageHero
        eyebrow={form.type ? `${transactionTypeLabel(form.type)}模板` : "模板"}
        title={title}
        meta={isEdit ? "修改后保存" : "填写模板信息"}
        tone="surface"
      />

      <AppSection title="模板信息" compact>
        <View className="tpl-field">
          <Text className="tpl-label tpl-label--required">模板名称</Text>
          <Input
            className="tpl-input"
            placeholder="如：公司食堂午餐"
            maxlength={20}
            value={form.name}
            onInput={(e: any) => setForm((p) => ({ ...p, name: e.detail.value }))}
          />
        </View>

        <View className="tpl-row">
          <View className="tpl-field tpl-field--half">
            <Text className="tpl-label tpl-label--required">类型</Text>
            <Picker
              mode="selector"
              range={typeDisplayRange}
              value={form.type ? typeOpts.indexOf(form.type) + 1 : 0}
              onChange={(e: any) => {
                const idx = Number(e.detail.value);
                setForm((p) => ({
                  ...p,
                  type: idx === 0 ? ("" as TplType) : (typeOpts[idx - 1] as TplType),
                  category_id: "",
                }));
              }}
            >
              <View className="tpl-picker">
                <View className="tpl-picker-value-wrap">
                  <Text
                    className={`tpl-picker-value ${
                      form.type
                        ? `tpl-picker-value--${form.type}`
                        : "tpl-picker-value--placeholder"
                    }`}
                  >
                    {formatTypeLabel(form.type)}
                  </Text>
                </View>
                {!!form.type && (
                  <View
                    className="tpl-picker-clear"
                    // @ts-ignore
                    catchClick={() =>
                      setForm((p) => ({ ...p, type: "" as TplType, category_id: "" }))
                    }
                  >
                    <Text>×</Text>
                  </View>
                )}
                <Text className="tpl-picker-chevron">▼</Text>
              </View>
            </Picker>
          </View>

          <View className="tpl-field tpl-field--half">
            <Text className="tpl-label tpl-label--required">分类</Text>
            <Picker
              mode="selector"
              range={
                catOpts.length > 0
                  ? catOpts.map((c: any) => formatCategoryLabel(c))
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
              <View className="tpl-picker">
                <View className="tpl-picker-value-wrap">
                  <Text
                    className={`tpl-picker-value ${
                      selectedCat ? "" : "tpl-picker-value--placeholder"
                    }`}
                  >
                    {formatCategoryLabel(selectedCat)}
                  </Text>
                </View>
                {!!selectedCat && (
                  <View
                    className="tpl-picker-clear"
                    // @ts-ignore
                    catchClick={() => setForm((p) => ({ ...p, category_id: "" }))}
                  >
                    <Text>×</Text>
                  </View>
                )}
                <Text className="tpl-picker-chevron">▼</Text>
              </View>
            </Picker>
          </View>
        </View>

        <View className="tpl-field">
          <Text className="tpl-label">金额</Text>
          <View className="tpl-input-wrap">
            <Text className="tpl-input-prefix">¥</Text>
            <Input
              className="tpl-input--amount"
              placeholder="0.00"
              type="digit"
              value={form.amount}
              onInput={(e: any) => setForm((p) => ({ ...p, amount: e.detail.value }))}
            />
          </View>
        </View>

        <View className="tpl-field">
          <Text className="tpl-label">备注</Text>
          <Input
            className="tpl-input"
            placeholder="添加备注（可选）"
            value={form.note}
            onInput={(e: any) => setForm((p) => ({ ...p, note: e.detail.value }))}
          />
        </View>

        <View className="tpl-field">
          <Text className="tpl-label">位置信息</Text>
          {form.location_name ? (
            <View className="tpl-location-card">
              <Text className="tpl-location-card__name">{form.location_name}</Text>
              <Text className="tpl-location-card__coords">
                {form.latitude}, {form.longitude}
              </Text>
              <View className="tpl-location-card__actions">
                <Text
                  className="tpl-location-card__action"
                  onClick={() => setShowLocationPicker(true)}
                >
                  修改
                </Text>
                <Text className="tpl-location-card__divider">|</Text>
                <Text className="tpl-location-card__action tpl-location-card__action--danger" onClick={clearLocation}>
                  清除
                </Text>
              </View>
            </View>
          ) : (
            <View className="tpl-location-btn" onClick={() => setShowLocationPicker(true)}>
              <Icon name="location" size={36} color={ICON_COLOR.primary} />
              <Text className="tpl-location-btn__text">选择位置</Text>
            </View>
          )}
        </View>

        {!isEdit && (
          <View className="tpl-field">
            <Text className="tpl-label">排序</Text>
            <Input
              className="tpl-input tpl-input--num"
              placeholder="0"
              type="digit"
              value={String(form.sort_order)}
              onInput={(e: any) =>
                setForm((p) => ({ ...p, sort_order: parseInt(e.detail.value, 10) || 0 }))
              }
            />
          </View>
        )}
      </AppSection>

      {/* 底部操作栏 */}
      <StickyActionBar row>
        {isEdit && (
          <Button variant="danger" size="lg" block onClick={() => setShowDelete(true)}>
            删除
          </Button>
        )}
        <Button variant="primary" size="lg" block onClick={handleSave}>
          {isEdit ? "更新" : "创建"}
        </Button>
      </StickyActionBar>

      {/* 位置选择弹窗 */}
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

      <ConfirmDialog
        visible={showDelete}
        title={CONFIRM_DELETE_TITLE}
        message={confirmDeleteThis("模板")}
        confirmText={CONFIRM_DELETE_TEXT}
        danger
        confirmLoading={false}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}
