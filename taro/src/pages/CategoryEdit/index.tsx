/**
 * CategoryEdit — 分类新增/编辑页
 * 对齐 PC：名称 + 图标（emoji / 购物平台 SVG / 自定义上传）
 * 列表点击 → 本页（带 id=编辑；不带 id=新增）
 * 编辑模式下底部含「删除」按钮（ConfirmDialog 确认）
 */
import { useState, useEffect, useMemo } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import Taro, { getCurrentInstance } from "@tarojs/taro";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "../../components/PageContainer";
import ConfirmDialog from "../../components/ConfirmDialog";
import CategoryIcon from "../../components/CategoryIcon";
import { AppSection, PageHero } from "../../components/ui";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoriesApi";
import { uploadIcon, fetchCustomIcons, deleteIcon } from "../../services/iconsApi";
import {
  ensurePrivacyAuthorize,
  isPrivacyError,
  openPrivacySetting,
} from "../../utils/privacy";
import { EMOJI_PRESETS } from "../../utils/emojiPresets";
import {
  SHOPPING_PLATFORM_ICONS,
  renderPlatformIconSvg,
} from "../../utils/platformIcons";
import { useManualQuery } from "../../hooks/useManualQuery";
import { useSubmit, toastError } from "../../hooks/useSubmit";
import "./index.scss";

interface CustomIconItem {
  id: string;
  icon_url: string;
  icon_type: string;
}

type CatType = "expense" | "income";

export default function CategoryEdit() {
  const router = getCurrentInstance().router;
  const id = (router?.params?.id as string) || "";
  const typeParam = (router?.params?.type as CatType) || "expense";
  const isEdit = !!id;
  const qc = useQueryClient();

  const { data: categories = [], isLoading } = useManualQuery<any[]>({
    key: "categories",
    queryFn: () => fetchCategories(),
  });
  const existing = useMemo(
    () => (categories || []).find((c: any) => c.id === id),
    [categories, id],
  );

  const [form, setForm] = useState({ name: "", icon: "📌" });
  const [catType, setCatType] = useState<CatType>(typeParam);
  const [customIcons, setCustomIcons] = useState<CustomIconItem[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const { run } = useSubmit();

  // 初始化表单（编辑模式）
  useEffect(() => {
    if (isEdit && existing) {
      setForm({ name: existing.name, icon: existing.icon || "📌" });
      setCatType(existing.type);
    }
  }, [isEdit, existing]);

  // 编辑模式加载自定义图标
  const refreshCustomIcons = () => {
    fetchCustomIcons("category")
      .then((list: CustomIconItem[]) => setCustomIcons(list || []))
      .catch(() => setCustomIcons([]));
  };
  useEffect(() => {
    if (isEdit) refreshCustomIcons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const handleUploadCustomIcon = async () => {
    const ok = await ensurePrivacyAuthorize("选择图标需要访问您的相册");
    if (!ok) return;
    Taro.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    })
      .then((res) => {
        const path = res.tempFiles && res.tempFiles[0]?.tempFilePath;
        if (!path) return;
        run(async () => {
          const result: any = await uploadIcon(path, "category");
          const iconUrl = result?.icon_url || result?.url || "";
          if (iconUrl) {
            setForm({ ...form, icon: iconUrl });
            refreshCustomIcons();
            Taro.showToast({ title: "已添加到自定义", icon: "success" });
          } else {
            Taro.showToast({ title: "上传失败", icon: "none" });
          }
        }, "上传中…").catch((err: any) => {
      toastError(err, "上传失败");
    });
      })
      .catch((err: any) => {
        const msg = err?.errMsg || err?.message || "";
        if (msg.indexOf("cancel") !== -1) return;
        if (isPrivacyError(err)) {
          Taro.showToast({ title: "请先同意隐私协议", icon: "none" });
          openPrivacySetting();
          return;
        }
        Taro.showToast({ title: msg || "选择图片失败", icon: "none" });
      });
  };

  const handleDeleteCustomIcon = (iconId: string, e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    deleteIcon(iconId)
      .then(() => {
        refreshCustomIcons();
        Taro.showToast({ title: "已删除", icon: "success" });
      })
      .catch(() => Taro.showToast({ title: "删除失败", icon: "none" }));
  };

  // --- 提交/删除（手动 Promise 链，规避 Taro 下 useMutation 卡死）---
  const handleSave = () => {
    if (!form.name.trim()) {
      Taro.showToast({ title: "请输入名称", icon: "none" });
      return;
    }
    const payload = { name: form.name.trim(), icon: form.icon };
    run(async () => {
      const apiCall = isEdit
        ? updateCategory(id, payload)
        : createCategory({ ...payload, type: catType });
      await apiCall;
      qc.invalidateQueries({ queryKey: ["categories"] });
      Taro.showToast({ title: isEdit ? "分类已更新" : "分类已创建", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 500);
    }, "保存中…").catch((err: any) => {
      Taro.showToast({ title: err?.message || (isEdit ? "更新失败" : "创建失败"), icon: "none" });
    });
  };

  const handleDelete = () => {
    run(async () => {
      await deleteCategory(id);
      qc.invalidateQueries({ queryKey: ["categories"] });
      Taro.showToast({ title: "已删除", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 500);
    }, "删除中…").catch((err: any) => {
      Taro.showToast({ title: err?.message || "删除失败", icon: "none" });
      setShowDelete(false);
    });
  };

  const title = isEdit ? "编辑分类" : "新建分类";

  return (
    <PageContainer bottomSpace={180} loading={isLoading} loadingText="加载中…">
      <PageHero
        eyebrow={catType === "expense" ? "支出分类" : "收入分类"}
        title={title}
        meta={isEdit ? "修改名称或图标后保存" : "填写名称并选择图标"}
        tone="surface"
      />

      {/* 类型切换（新增时可选；编辑时沿用原类型） */}
      <AppSection title="分类类型" compact>
        <View className="catedit-type-tabs">
          <View
            className={`catedit-type-tab ${catType === "expense" ? "catedit-type-tab--active" : ""}`}
            onClick={() => setCatType("expense")}
          >
            <Text>支出</Text>
          </View>
          <View
            className={`catedit-type-tab ${catType === "income" ? "catedit-type-tab--active" : ""}`}
            onClick={() => setCatType("income")}
          >
            <Text>收入</Text>
          </View>
        </View>
      </AppSection>

      <AppSection title="基本信息" compact>
        <View className="catedit-form-row">
          <Text className="catedit-form-label">名称</Text>
          <Input
            className="catedit-form-input"
            placeholder="输入分类名称"
            maxlength={10}
            value={form.name}
            onInput={(e: any) => setForm((p) => ({ ...p, name: e.detail.value }))}
          />
        </View>
        <View className="catedit-form-row catedit-form-row--icon">
          <Text className="catedit-form-label">图标</Text>
          <View className="catedit-form-emoji-current">
            <CategoryIcon icon={form.icon} size={28} className="catedit-form-emoji-current__icon" />
          </View>
        </View>
      </AppSection>

      {/* emoji 选择 */}
      <AppSection title="表情图标" compact>
        <View className="catedit-emoji-grid">
          {EMOJI_PRESETS.map((e) => (
            <View
              key={e}
              className={`catedit-emoji-item ${form.icon === e ? "catedit-emoji-item--selected" : ""}`}
              onClick={() => setForm((p) => ({ ...p, icon: e }))}
            >
              <Text className="catedit-emoji-item__text">{e}</Text>
            </View>
          ))}
        </View>
      </AppSection>

      {/* 购物平台 SVG 图标 */}
      <AppSection title="购物与生活服务" compact>
        <View className="catedit-emoji-grid catedit-emoji-grid--platform">
          {SHOPPING_PLATFORM_ICONS.map((item) => {
            const val = `platform_${item.key}`;
            const selected = form.icon === val;
            return (
              <View
                key={val}
                className={`catedit-platform-item ${selected ? "catedit-platform-item--selected" : ""}`}
                onClick={() => setForm((p) => ({ ...p, icon: val }))}
              >
                <View className="catedit-platform-item__icon">
                  <Image
                    src={renderPlatformIconSvg(item.key, 22, selected ? "#2d9d8a" : "#1a1c19")}
                    mode="aspectFit"
                    style={{ width: "22px", height: "22px", display: "block" }}
                  />
                </View>
                <Text
                  className={`catedit-platform-item__label ${
                    selected ? "catedit-platform-item__label--selected" : ""
                  }`}
                >
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </AppSection>

      {/* 自定义图标 */}
      <AppSection title="自定义图标" compact>
        <View className="catedit-custom-icons">
          <View
            className="catedit-custom-icon-upload"
            onClick={handleUploadCustomIcon}
          >
            <Text>＋ 上传图标</Text>
          </View>
          {customIcons.map((item) => (
            <View
              key={item.id}
              className={`catedit-custom-icon-item ${form.icon === item.icon_url ? "catedit-custom-icon-item--selected" : ""}`}
              onClick={() => setForm((p) => ({ ...p, icon: item.icon_url }))}
            >
              <Image className="catedit-custom-icon-item__img" src={item.icon_url} mode="aspectFit" />
              <View
                className="catedit-custom-icon-item__del"
                onClick={(e: any) => handleDeleteCustomIcon(item.id, e)}
              >
                <Text>×</Text>
              </View>
            </View>
          ))}
          {customIcons.length === 0 && (
            <View className="catedit-custom-empty">
              <Text>还没有自定义图标，点击「＋ 上传图标」添加</Text>
            </View>
          )}
        </View>
      </AppSection>

      {/* 底部操作栏 */}
      <View className="catedit-actions">
        {isEdit && (
          <View
            className="catedit-actions__delete"
            onClick={() => setShowDelete(true)}
          >
            <Text>删除</Text>
          </View>
        )}
        <View
          className={`catedit-actions__save ${
            isEdit ? "" : "catedit-actions__save--full"
          }`}
          onClick={handleSave}
        >
          <Text>{isEdit ? "保存修改" : "创建分类"}</Text>
        </View>
      </View>

      <ConfirmDialog
        visible={showDelete}
        title="确认删除"
        message="确定要删除这个分类吗？"
        confirmText="确认删除"
        danger
        confirmLoading={false}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}
