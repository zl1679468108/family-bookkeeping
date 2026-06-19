/**
 * AddTransaction — 记一笔（增强版）
 * 参考 PC 端结构：类型 / 金额 / 分类 / 日期 / 品牌 / 备注 / 位置 / 图片 / 模板
 * 必填字段：金额(*) / 分类(*) / 日期(*)
 */
import { useState, useEffect } from "react";
import { View, ScrollView, Picker, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import {
  getTransaction,
  uploadReceipt,
} from "../../services/transactionsApi";
import { getTemplates } from "../../services/templatesApi";
import { useCategoryList } from "../../hooks/useCategories";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "../../hooks/useTransactions";
import TypeTabs from "../../components/form/TypeTabs";
import AmountCard from "../../components/form/AmountCard";
import FieldRow from "../../components/form/FieldRow";
import SectionCard from "../../components/form/SectionCard";
import NoteField from "../../components/form/NoteField";
import LocationField, {
  LocationResult,
} from "../../components/form/LocationField";
import ImageUpload from "../../components/form/ImageUpload";
import ActionButtons from "../../components/form/ActionButtons";
import "./index.scss";

interface Template {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  amount: number;
  brand?: string;
  description?: string;
  type: "expense" | "income";
}

const MAX_NOTE_LENGTH = 500;
const MAX_IMAGES = 5;

const parseImageList = (tx: any): string[] => {
  if (
    tx?.image_url_list &&
    Array.isArray(tx.image_url_list) &&
    tx.image_url_list.length > 0
  ) {
    return tx.image_url_list;
  }
  if (tx?.image_urls) {
    try {
      const parsed = JSON.parse(tx.image_urls);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      if (typeof tx.image_urls === "string" && tx.image_urls.includes(",")) {
        return tx.image_urls.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
  }
  return [];
};

export default function AddTransaction() {
  const router = Taro.useRouter();
  const params = router.params as Record<string, string | undefined>;
  const editId = params.edit || Taro.getStorageSync("edit_tx_id") || "";
  const isEdit = !!editId;
  const urlType: "expense" | "income" =
    params.type === "income" ? "income" : "expense";

  const createMut = useCreateTransaction();
  const updateMut = useUpdateTransaction();

  const [type, setType] = useState<"expense" | "income">(urlType);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | number | "">("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [brand, setBrand] = useState("");
  const [note, setNote] = useState("");
  const [savedImages, setSavedImages] = useState<string[]>([]);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const { categories = [] } = useCategoryList(type);
  const currentCategory: any = categories.find(
    (c: any) => String(c.id) === String(categoryId),
  );

  // 加载编辑数据
  useEffect(() => {
    if (isEdit) {
      getTransaction(Number(editId)).then((data: any) => {
        if (!data) return;
        setAmount(String(data.amount ?? ""));
        setCategoryId(
          typeof data.category === "object"
            ? data.category?.id
            : data.category_id,
        );
        setType(data.type ?? "expense");
        const dateStr = data.date || "";
        setDate(dateStr.slice(0, 10));
        setTime(dateStr.slice(11, 16) || new Date().toTimeString().slice(0, 5));
        setBrand(data.brand || "");
        setNote(data.description || "");
        if (data.location_name || data.latitude) {
          setLocation({
            name: data.location_name || "",
            latitude: data.latitude,
            longitude: data.longitude,
          });
        }
        setSavedImages(parseImageList(data));
      });
    }
  }, [isEdit, editId]);

  // 加载模板执行结果（从 TemplateManager 执行模板跳转过来）
  useEffect(() => {
    const templateResult = Taro.getStorageSync("templateExecuteResult");
    if (templateResult && !isEdit) {
      setType(templateResult.type || "expense");
      setAmount(String(templateResult.amount || ""));
      setCategoryId(templateResult.category_id || "");
      setBrand(templateResult.brand || "");
      setNote(templateResult.description || "");
      // 清除模板执行结果，避免下次进入时重复填充
      Taro.removeStorageSync("templateExecuteResult");
    }
  }, [isEdit]);

  // 加载模板列表
  useEffect(() => {
    getTemplates().then((data: any) => {
      setTemplates(data?.data || []);
    }).catch(() => {});
  }, []);

  // 类型切换时，如果当前分类不属于新类型，清空
  useEffect(() => {
    if (categoryId) {
      const matched = categories.find(
        (c: any) => String(c.id) === String(categoryId),
      );
      if (!matched) setCategoryId("");
    }
  }, [type, categories]); // eslint-disable-line

  const isSubmitting = createMut.isPending || updateMut.isPending;

  // 分类选择
  const handlePickCategory = () => {
    if (!categories.length) return;
    const list = categories.map((c: any) => c.name);
    Taro.showActionSheet({
      itemList: list as any,
    })
      .then((res: any) => {
        const cat = categories[res.tapIndex];
        if (cat) setCategoryId(cat.id);
      })
      .catch(() => {});
  };

  // 应用模板
  const applyTemplate = (template: Template) => {
    setType(template.type);
    setAmount(String(template.amount));
    setCategoryId(template.category_id);
    setBrand(template.brand || "");
    setNote(template.description || "");
    setSelectedTemplate(template);
    setShowTemplates(false);
    Taro.showToast({ title: `已应用模板: ${template.name}`, icon: "success" });
  };

  // 提交
  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Taro.showToast({ title: "请输入有效金额", icon: "none" });
      return;
    }
    if (!categoryId) {
      Taro.showToast({ title: "请选择分类", icon: "none" });
      return;
    }

    const payload: any = {
      type,
      amount: parseFloat(amount),
      category: categoryId,
      date: `${date} ${time}`,
      brand: brand || undefined,
      description: note || undefined,
      latitude: location?.latitude,
      longitude: location?.longitude,
      location_name: location?.name || undefined,
    };

    // 编辑模式下先保存已有的图片 URL
    if (isEdit && savedImages.length > 0) {
      payload.image_urls = JSON.stringify(savedImages);
    }

    Taro.showLoading({ title: "保存中..." });

    try {
      // 1. 创建/更新交易
      let transactionId: number;
      if (isEdit) {
        await updateMut.mutateAsync({ id: Number(editId), input: payload });
        transactionId = Number(editId);
      } else {
        const result = await createMut.mutateAsync(payload);
        transactionId = (result as any)?.id ?? 0;
      }

      // 2. 上传新图片
      let uploadedUrls: string[] = [];
      let failedCount = 0;
      if (pendingImages.length > 0 && transactionId) {
        Taro.showLoading({ title: `上传图片 0/${pendingImages.length}...` });
        for (let i = 0; i < pendingImages.length; i++) {
          const filePath = pendingImages[i];
          try {
            const res = await uploadReceipt(transactionId, filePath);
            if (res?.image_url) {
              uploadedUrls.push(res.image_url);
            } else {
              failedCount++;
              console.error("图片上传无返回 URL:", filePath);
            }
            Taro.showLoading({ title: `上传图片 ${i + 1}/${pendingImages.length}...` });
          } catch (err: any) {
            failedCount++;
            console.error("图片上传失败:", filePath, err);
          }
        }
        Taro.hideLoading();

        // 如果有图片上传失败，提示用户
        if (failedCount > 0) {
          Taro.showToast({
            title: `${failedCount} 张图片上传失败，其余已保存`,
            icon: "none",
          });
        }
      }

      // 3. 合并图片 URL 并更新交易
      if (uploadedUrls.length > 0) {
        const mergedUrls = [...savedImages, ...uploadedUrls];
        await updateMut.mutateAsync({
          id: transactionId,
          input: { image_urls: JSON.stringify(mergedUrls) },
        });
        setSavedImages(mergedUrls);
        setPendingImages([]);
      } else if (pendingImages.length > 0 && failedCount === pendingImages.length) {
        // 所有图片都上传失败了，保留 pendingImages 让用户重试
        Taro.showToast({
          title: "图片上传失败，请检查网络后重试",
          icon: "none",
        });
      } else if (pendingImages.length > 0) {
        // 部分成功或不需要更新，清空 pending
        setPendingImages([]);
      }

      Taro.hideLoading();
      Taro.showToast({
        title: isEdit ? "修改成功" : "添加成功",
        icon: "success",
      });
      setTimeout(() => Taro.navigateBack(), 600);
    } catch (err: any) {
      Taro.hideLoading();
      Taro.showToast({
        title: err?.message || "保存失败",
        icon: "none",
      });
    }
  };

  return (
    <>
    <ScrollView className="addtx" scrollY>
      <TypeTabs value={type} onChange={setType} />

      <AmountCard value={amount} onChange={setAmount} />

      <SectionCard title="快捷方式">
        <FieldRow
          label="模板"
          variant="row"
          value={selectedTemplate?.name || ""}
          placeholder="选择模板快速记账"
          onClick={() => setShowTemplates(true)}
        />
      </SectionCard>

      <SectionCard title="账单信息">
        <FieldRow
          label="分类"
          required
          variant="row"
          value={currentCategory?.name || ""}
          placeholder="选择分类"
          onClick={handlePickCategory}
        />
        <Picker
          mode="date"
          value={date}
          onChange={(e: any) => setDate(e.detail.value)}
        >
          <FieldRow label="日期" required variant="row" value={date} />
        </Picker>
        <Picker
          mode="time"
          value={time}
          onChange={(e: any) => setTime(e.detail.value)}
        >
          <FieldRow label="时间" required variant="row" value={time} />
        </Picker>
        <FieldRow
          label="品牌"
          variant="input"
          inputValue={brand}
          inputPlaceholder="雅诗兰黛 / 苹果 / 可不填"
          onInput={setBrand}
          inputMaxlength={100}
        />
      </SectionCard>

      <NoteField value={note} onChange={setNote} maxLength={MAX_NOTE_LENGTH} />

      <LocationField value={location} onChange={setLocation} />

      <ImageUpload
        savedImages={savedImages}
        pendingImages={pendingImages}
        onSavedChange={setSavedImages}
        onPendingChange={setPendingImages}
        maxImages={MAX_IMAGES}
      />

      <ActionButtons
        primaryText={isEdit ? "保存修改" : "确认添加"}
        secondaryText="取消"
        primaryLoading={isSubmitting}
        onPrimary={handleSubmit}
        onSecondary={() => Taro.navigateBack()}
      />

      <View className="addtx-safe" style="height: 60rpx;" />
    </ScrollView>

    {/* 模板选择弹窗 */}
    {showTemplates && (
      <View className="template-mask" onClick={() => setShowTemplates(false)}>
        <View className="template-dialog" onClick={(e) => e.stopPropagation()}>
          <View className="template-header">
            <Text className="template-title">选择记账模板</Text>
            <Text className="template-close" onClick={() => setShowTemplates(false)}>✕</Text>
          </View>
          <ScrollView className="template-list" scrollY>
            {templates.length === 0 ? (
              <View className="template-empty">
                <Text>暂无模板</Text>
              </View>
            ) : (
              templates.map((template) => (
                <View
                  key={template.id}
                  className={`template-item ${selectedTemplate?.id === template.id ? "selected" : ""}`}
                  onClick={() => applyTemplate(template)}
                >
                  <View className="template-info">
                    <Text className="template-name">{template.name}</Text>
                    <Text className="template-category">{template.category_name}</Text>
                  </View>
                  <View className="template-amount">
                    <Text className={template.type === "income" ? "income" : "expense"}>
                      {template.type === "income" ? "+" : "-"}¥{template.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    )}
    </>
  );
}
