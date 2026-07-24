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
import { getErrorMessage } from "../../utils/errorMessage";
import { toastSuccess, toastInfo } from "../../utils/toast";
import { ACTION_DELETING, ACTION_LOADING, ACTION_SAVING, saveOrCreateLabel, ACTION_CREATE_CATEGORY, ACTION_DELETE, ACTION_UPLOADING_ELLIPSIS } from "../../utils/actionCopy"
import { getThemeTokenHex } from "../../utils/themeTokens"
import { useTheme } from "../../context/ThemeContext"
import {
  CONFIRM_DELETE_TITLE,
  CONFIRM_DELETE_TEXT,
  confirmDeleteThis,
} from "../../utils/confirmCopy";
import { SUCCESS_DELETED, successEntityUpsert, SUCCESS_ADDED_TO_CUSTOM } from "../../utils/successCopy";
import { categoryTypeTabLabel } from "../../utils/transactionType";
import { FORM_PRIVACY_REQUIRED, FORM_CATEGORY_NAME_PLACEHOLDER } from "../../utils/formCopy";
import { buildCategoryPayload, validateCategoryName } from "../../utils/categoryPayload";
import { entityFormTitle, ENTITY_CATEGORY } from "../../utils/entityCopy";
import { UPLOAD_FAILED, DELETE_FAILED, IMAGE_SELECT_FAILED, PRIVACY_ALBUM_FOR_ICON } from "../../utils/uploadCopy";
import { failEntityUpsert } from "../../utils/errorCopy";
import Icon, { ICON_COLOR } from "../../components/Icon";
import { SECTION_CATEGORY_TYPE, SECTION_BASIC_INFO, SECTION_EMOJI_ICONS, SECTION_SHOPPING_ICONS, SECTION_CUSTOM_ICONS } from "../../utils/sectionCopy";
import { FIELD_NAME, FIELD_ICON } from "../../utils/fieldCopy";

interface CustomIconItem {
  id: string;
  icon_url: string;
  icon_type: string;
}

type CatType = "expense" | "income";

export default function CategoryEdit() {
  const { isDark } = useTheme();
  const themeHex = getThemeTokenHex(isDark);
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
    const ok = await ensurePrivacyAuthorize(PRIVACY_ALBUM_FOR_ICON);
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
            toastSuccess(SUCCESS_ADDED_TO_CUSTOM);
          } else {
            toastInfo(UPLOAD_FAILED);
          }
        }, ACTION_UPLOADING_ELLIPSIS).catch((err: any) => {
      toastError(err, UPLOAD_FAILED);
    });
      })
      .catch((err: any) => {
        const msg = getErrorMessage(err, "");
        if (msg.indexOf("cancel") !== -1) return;
        if (isPrivacyError(err)) {
          toastInfo(FORM_PRIVACY_REQUIRED);
          openPrivacySetting();
          return;
        }
        toastInfo(msg || IMAGE_SELECT_FAILED);
      });
  };

  const handleDeleteCustomIcon = (iconId: string, e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    deleteIcon(iconId)
      .then(() => {
        refreshCustomIcons();
        toastSuccess(SUCCESS_DELETED);
      })
      .catch(() => toastInfo(DELETE_FAILED));
  };

  // --- 提交/删除（手动 Promise 链，规避 Taro 下 useMutation 卡死）---
  const handleSave = () => {
    const nameErr = validateCategoryName(form.name);
    if (nameErr) {
      toastInfo(nameErr);
      return;
    }
    const payload = buildCategoryPayload(
      { name: form.name, icon: form.icon, type: catType },
      { includeType: !isEdit },
    );
    run(async () => {
      const apiCall = isEdit
        ? updateCategory(id, payload)
        : createCategory(payload as import("@family-bookkeeping/shared-types").CreateCategoryInput);
      await apiCall;
      qc.invalidateQueries({ queryKey: ["categories"] });
      toastSuccess(successEntityUpsert(ENTITY_CATEGORY, isEdit));
      setTimeout(() => Taro.navigateBack(), 500);
    }, ACTION_SAVING).catch((err: any) => {
      toastError(err, failEntityUpsert(isEdit));
    });
  };

  const handleDelete = () => {
    run(async () => {
      await deleteCategory(id);
      qc.invalidateQueries({ queryKey: ["categories"] });
      toastSuccess(SUCCESS_DELETED);
      setTimeout(() => Taro.navigateBack(), 500);
    }, ACTION_DELETING).catch((err: any) => {
      toastError(err, DELETE_FAILED);
      setShowDelete(false);
    });
  };

  const title = entityFormTitle(ENTITY_CATEGORY, isEdit);

  return (
    <PageContainer bottomSpace={180} loading={isLoading} loadingText={ACTION_LOADING}>
      <PageHero
        eyebrow={categoryTypeTabLabel(catType)}
        title={title}
        meta={isEdit ? "修改名称或图标后保存" : "填写名称并选择图标"}
        tone="surface"
      />

      {/* 类型切换（新增时可选；编辑时沿用原类型） */}
      <AppSection title={SECTION_CATEGORY_TYPE} compact>
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

      <AppSection title={SECTION_BASIC_INFO} compact>
        <View className="catedit-form-row">
          <Text className="catedit-form-label">{FIELD_NAME}</Text>
          <Input
            className="catedit-form-input"
            placeholder={FORM_CATEGORY_NAME_PLACEHOLDER}
            maxlength={10}
            value={form.name}
            onInput={(e: any) => setForm((p) => ({ ...p, name: e.detail.value }))}
          />
        </View>
        <View className="catedit-form-row catedit-form-row--icon">
          <Text className="catedit-form-label">{FIELD_ICON}</Text>
          <View className="catedit-form-emoji-current">
            <CategoryIcon icon={form.icon} size={28} className="catedit-form-emoji-current__icon" />
          </View>
        </View>
      </AppSection>

      {/* emoji 选择 */}
      <AppSection title={SECTION_EMOJI_ICONS} compact>
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
      <AppSection title={SECTION_SHOPPING_ICONS} compact>
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
                    src={renderPlatformIconSvg(item.key, 22, selected ? themeHex.pr : themeHex.fg)}
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
      <AppSection title={SECTION_CUSTOM_ICONS} compact>
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
                <Icon name="close" size={28} color={ICON_COLOR.muted} />
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
            <Text>{ACTION_DELETE}</Text>
          </View>
        )}
        <View
          className={`catedit-actions__save ${
            isEdit ? "" : "catedit-actions__save--full"
          }`}
          onClick={handleSave}
        >
          <Text>{saveOrCreateLabel(isEdit, ACTION_CREATE_CATEGORY)}</Text>
        </View>
      </View>

      <ConfirmDialog
        visible={showDelete}
        title={CONFIRM_DELETE_TITLE}
        message={confirmDeleteThis("分类")}
        confirmText={CONFIRM_DELETE_TEXT}
        danger
        confirmLoading={false}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}