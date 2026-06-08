/**
 * TemplateManager — v3.0 模板管理页
 * 对齐 PC：创建/编辑/删除模板，预填类型/分类/备注/位置
 */
import { useState } from "react";
import { View, Text, Input, Picker, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";
import { apiGet, apiPost, apiPut, apiDelete } from "../../services/api";
import { useCategories } from "../../hooks/useCategories";
import { useManualQuery } from "../../hooks/useManualQuery";
import "./index.scss";

interface Template {
  id: string;
  name: string;
  type: "expense" | "income";
  category_id?: string;
  note?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  poi_id?: string | null;
}

export default function TemplateManager() {
  const qc = useQueryClient();
  const { data: cats } = useCategories();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "expense" as "expense" | "income",
    category_id: "",
    note: "",
    location_name: "",
  });

  const { data: templates, isLoading } = useManualQuery<Template[]>({
    key: "templates",
    queryFn: () => apiGet<Template[]>("/templates"),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => apiPost("/templates", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      Taro.showToast({ title: "模板创建成功", icon: "success" });
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => apiPut(`/templates/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      Taro.showToast({ title: "模板更新成功", icon: "success" });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiDelete(`/templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      Taro.showToast({ title: "模板已删除", icon: "success" });
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      type: "expense",
      category_id: "",
      note: "",
      location_name: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (t: Template) => {
    setForm({
      name: t.name,
      type: t.type,
      category_id: t.category_id || "",
      note: t.note || "",
      location_name: t.location_name || "",
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      Taro.showToast({ title: "请输入模板名称", icon: "none" });
      return;
    }
    const data: any = { name: form.name.trim(), type: form.type };
    if (form.category_id) data.category_id = form.category_id;
    if (form.note.trim()) data.note = form.note.trim();
    if (form.location_name.trim())
      data.location_name = form.location_name.trim();

    if (editingId) {
      updateMut.mutate({ id: editingId, data });
    } else {
      createMut.mutate(data);
    }
  };

  const typeOpts = ["expense", "income"];
  const catOpts = (cats || []).filter((c) => c.type === form.type);

  return (
    <View className="min-h-screen bg-bg flex flex-col">
      {/* Form */}
      {showForm && (
        <View className="card-padded mb-2 mx-3 mt-3">
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

          <View className="flex gap-2 mb-2">
            <View className="flex-1">
              <Text className="text-xs text-hint mb-1">类型</Text>
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
                <View className="tpl-select">
                  {form.type === "expense" ? "支出" : "收入"} ▾
                </View>
              </Picker>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-hint mb-1">分类</Text>
              <Picker
                mode="selector"
                range={catOpts.map((c) => `${c.icon} ${c.name}`)}
                value={catOpts.findIndex((c) => c.id === form.category_id)}
                onChange={(e: any) =>
                  setForm((p) => ({
                    ...p,
                    category_id: catOpts[e.detail.value]?.id || "",
                  }))
                }
              >
                <View className="tpl-select">
                  {form.category_id
                    ? `${catOpts.find((c) => c.id === form.category_id)?.icon || ""} ${catOpts.find((c) => c.id === form.category_id)?.name || ""}`
                    : "选择分类 ▾"}
                </View>
              </Picker>
            </View>
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
            <Text className="tpl-form-label">位置</Text>
            <Input
              className="tpl-form-input"
              placeholder="位置名称（可选）"
              value={form.location_name}
              onInput={(e: any) =>
                setForm((p) => ({ ...p, location_name: e.detail.value }))
              }
            />
          </View>

          <View className="flex gap-2 mt-3">
            <View
              className="btn-secondary flex-1"
              style={{ padding: "20rpx 0" }}
              onClick={resetForm}
            >
              取消
            </View>
            <View
              className="btn-primary flex-1"
              style={{ padding: "20rpx 0" }}
              onClick={handleSave}
            >
              {createMut.isPending || updateMut.isPending
                ? "保存中…"
                : editingId
                  ? "更新模板"
                  : "创建模板"}
            </View>
          </View>
        </View>
      )}

      {/* Template List */}
      <ScrollView className="flex-1" scrollY>
        <View className="px-3 pt-2 pb-safe">
          {/* New Template Button */}
          <View className="flex justify-end mb-2">
            <Text
              className="text-sm text-primary font-semibold tappable"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              ＋ 新建模板
            </Text>
          </View>

          {isLoading ? (
            <View className="flex flex-col gap-2">
              <View
                className="skeleton"
                style={{ height: "100rpx", borderRadius: "14rpx" }}
              />
              <View
                className="skeleton"
                style={{ height: "100rpx", borderRadius: "14rpx" }}
              />
            </View>
          ) : !templates?.length ? (
            <EmptyState
              icon="📋"
              title="暂无模板"
              description="点击上方「＋ 新建」创建模板"
            />
          ) : (
            templates.map((t) => (
              <View key={t.id} className="tpl-item">
                <View className="tpl-item-body">
                  <Text className="tpl-item-icon">📋</Text>
                  <View className="flex-1 ml-2">
                    <Text className="tpl-item-name">{t.name}</Text>
                    <View className="flex gap-1 mt-1">
                      <Text
                        className={`tag ${t.type === "expense" ? "tag-inactive" : "tag-inactive"}`}
                        style={{ fontSize: "18rpx", padding: "2rpx 10rpx" }}
                      >
                        {t.type === "expense" ? "支出" : "收入"}
                      </Text>
                      {t.note && (
                        <Text className="text-xs text-hint">{t.note}</Text>
                      )}
                    </View>
                  </View>
                </View>
                <View className="tpl-item-actions">
                  <Text
                    className="text-xs text-primary font-semibold"
                    onClick={() => handleEdit(t)}
                  >
                    编辑
                  </Text>
                  <Text
                    className="text-xs text-danger font-semibold ml-2"
                    onClick={() => setDeleteId(t.id)}
                  >
                    删除
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={!!deleteId}
        title="确认删除"
        message="确定要删除这个模板吗？"
        confirmText="确认删除"
        confirmLoading={deleteMut.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
      />
    </View>
  );
}
