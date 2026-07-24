/**
 * AddTransaction — 记一笔（增强版）
 * 参考 PC 端结构：类型 / 金额 / 分类 / 日期 / 品牌 / 备注 / 位置 / 图片 / 模板
 * 必填字段：金额(*) / 分类(*) / 日期(*)
 */
import { useState, useEffect } from "react";
import { View, ScrollView, Picker, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageContainer from "../../components/PageContainer";
import {
  getTransaction,
  deleteTransaction,
  createTransaction,
  updateTransaction,
} from "../../services/transactionsApi";
import { getTemplates } from "../../services/templatesApi";
import { useCategoryList } from "../../hooks/useCategories";
import { useSubmit, toastError } from "../../hooks/useSubmit";
import { buildTransactionPayload } from "./buildPayload";
import { uploadPendingReceipts } from "./uploadPendingReceipts";
import FieldRow from "../../components/form/FieldRow";
import SectionCard from "../../components/form/SectionCard";
import NoteField from "../../components/form/NoteField";
import LocationField, {
  LocationResult,
} from "../../components/form/LocationField";
import ImageUpload from "../../components/form/ImageUpload";
import { todayBeijing, toastSuccess, toastInfo, formatMoney } from "../../utils/format";
import { parseImageList } from "../../utils/parseImageList";
import "./index.scss";

interface Template {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  amount?: number;
  brand?: string;
  description?: string;
  note?: string;
  merchant_name?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  type: "expense" | "income";
}

const MAX_NOTE_LENGTH = 500;
const MAX_IMAGES = 10; // 与 PC 端记一笔保持一致

export default function AddTransaction() {
  const router = Taro.useRouter();
  const params = router.params as Record<string, string | undefined>;
  const editId = params.edit || "";
  const isEdit = !!editId;
  const urlType: "expense" | "income" =
    params.type === "income" ? "income" : "expense";

  // 旧版本用 Storage 传 editId，现已改为 URL query；清掉旧数据避免误进编辑模式
  useEffect(() => {
    Taro.removeStorageSync("edit_tx_id");
  }, []);

  const [type, setType] = useState<"expense" | "income">(urlType);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | number | "">("");
  const [date, setDate] = useState(todayBeijing());
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
      Taro.showLoading({ title: "加载中…", mask: true });
      getTransaction(Number(editId))
        .then((data: any) => {
          if (!data) return;
          setAmount(String(data.amount ?? ""));
          setCategoryId(
            typeof data.category === "object" && data.category
              ? data.category.id
              : (data.category ?? data.category_id ?? ""),
          );
          setType(data.type ?? "expense");
          const dateStr = data.date || "";
          setDate(dateStr.slice(0, 10));
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
        })
        .catch(() => {})
        .then(() => {
          // 用 .then 兜底替代 .finally，规避微信 regenerator 下偶发卡死
          Taro.hideLoading();
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
      setTemplates(data || []);
    }).catch(() => {});
  }, []);

  // 类型切换时，如果当前分类不属于新类型，清空
  // 编辑模式下不执行：已回显的分类是权威数据，避免异步时序误清空
  useEffect(() => {
    if (isEdit) return;
    if (categoryId) {
      const matched = categories.find(
        (c: any) => String(c.id) === String(categoryId),
      );
      if (!matched) setCategoryId("");
    }
  }, [type, categories, isEdit]); // eslint-disable-line

  const { run } = useSubmit();

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

  // 应用模板（与 PC 端一致：带出商户名与位置）
  const applyTemplate = (template: Template) => {
    setType(template.type);
    setAmount(String(template.amount ?? ""));
    setCategoryId(template.category_id);
    setBrand(template.merchant_name || template.brand || "");
    setNote(template.description || template.note || "");
    if (template.latitude !== undefined && template.longitude !== undefined) {
      setLocation({
        name: template.location_name || "",
        latitude: template.latitude,
        longitude: template.longitude,
      });
    }
    setSelectedTemplate(template);
    setShowTemplates(false);
    toastSuccess(`已应用模板：${template.name}`);
  };

  // 删除
  const handleDelete = async () => {
    if (!editId) return;
    Taro.showModal({
      title: "确认删除",
      content: "确定要删除这笔交易吗？",
      success: async (res) => {
        if (res.confirm) {
          try {
            Taro.showLoading({ title: "删除中..." });
            await deleteTransaction(Number(editId));
            Taro.hideLoading();
            toastSuccess("交易已删除");
            setTimeout(() => Taro.navigateBack(), 500);
          } catch {
            Taro.hideLoading();
            toastInfo("删除失败");
          }
        }
      },
    });
  };

  // 提交
  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toastInfo("请输入有效金额");
      return;
    }
    if (!categoryId) {
      toastInfo("请选择分类");
      return;
    }

    const payload = buildTransactionPayload({
      type,
      amount,
      categoryId,
      date,
      brand,
      note,
      location,
      savedImages,
      withSavedImages: isEdit,
    });

    run(async () => {
      // 1. 创建/更新交易
      let transactionId: number;
      if (isEdit) {
        await updateTransaction(Number(editId), payload);
        transactionId = Number(editId);
      } else {
        const result = await createTransaction(payload);
        transactionId = (result as any)?.id ?? 0;
      }

      // 2. 上传新图片（进度 loading 在 uploadPendingReceipts 内）
      let uploadedUrls: string[] = [];
      let failedCount = 0;
      if (pendingImages.length > 0 && transactionId) {
        const result = await uploadPendingReceipts(transactionId, pendingImages);
        uploadedUrls = result.uploadedUrls;
        failedCount = result.failedCount;
        if (failedCount > 0) {
          toastInfo(`${failedCount} 张图片上传失败，其余已保存`);
        }
      }

      // 3. 合并图片 URL 并更新交易
      if (uploadedUrls.length > 0) {
        const mergedUrls = [...savedImages, ...uploadedUrls];
        await updateTransaction(transactionId, {
          image_urls: JSON.stringify(mergedUrls),
        });
        setSavedImages(mergedUrls);
        setPendingImages([]);
      } else if (pendingImages.length > 0 && failedCount === pendingImages.length) {
        // 所有图片都上传失败了，保留 pendingImages 让用户重试
        toastInfo("图片上传失败，请检查网络后重试");
      } else if (pendingImages.length > 0) {
        // 部分成功或不需要更新，清空 pending
        setPendingImages([]);
      }

      toastSuccess(isEdit ? "交易已更新" : "交易已保存");
      setTimeout(() => Taro.navigateBack(), 600);
    }, "保存中…").catch((err: any) => {
      toastError(err, "保存失败");
    });
  };

  return (
    <>
    <PageContainer bottomSpace={180}>
      {/* 快捷方式 — 置顶 */}
      <SectionCard title="快捷方式">
        <FieldRow
          label="模板"
          variant="row"
          value={selectedTemplate?.name || ""}
          placeholder="选择模板快速记账"
          onClick={() => setShowTemplates(true)}
        />
      </SectionCard>

      {/* 账单信息 */}
      <SectionCard title="账单信息">
        {/* 类型 */}
        <Picker
          mode="selector"
          range={["支出", "收入"]}
          value={type === "income" ? 1 : 0}
          onChange={(e: any) => setType(e.detail.value === 1 ? "income" : "expense")}
        >
          <FieldRow label="类型" required variant="row" value={type === "income" ? "收入" : "支出"} />
        </Picker>

        {/* 金额 */}
        <FieldRow
          label="金额"
          required
          variant="input"
          inputValue={amount}
          inputPlaceholder="0.00"
          onInput={(v: string) => {
            const cleaned = v.replace(/[^0-9.]/g, "");
            const parts = cleaned.split(".");
            setAmount(
              parts[0] + (parts.length > 1 ? "." + (parts[1] || "").slice(0, 2) : "")
            );
          }}
          inputMaxlength={10}
        />

        {/* 分类 */}
        <FieldRow
          label="分类"
          required
          variant="row"
          value={currentCategory?.name || ""}
          placeholder="选择分类"
          onClick={handlePickCategory}
        />

        {/* 日期 */}
        <Picker
          mode="date"
          value={date}
          onChange={(e: any) => setDate(e.detail.value)}
        >
          <FieldRow label="日期" required variant="row" value={date} />
        </Picker>

        {/* 品牌 */}
        <FieldRow
          label="品牌"
          variant="input"
          inputValue={brand}
          inputPlaceholder="例如：雅诗兰黛、苹果"
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

      {/* 底部操作栏：固定吸底，与工作台其它模块（分类/模板编辑）保持一致；有返回即无需取消按钮 */}
      <View className="addtx-actions">
        {isEdit && (
          <View className="addtx-actions__delete" onClick={handleDelete}>
            <Text>删除此笔</Text>
          </View>
        )}
        <View
          className={`addtx-actions__save ${isEdit ? "" : "addtx-actions__save--full"}`}
          onClick={handleSubmit}
        >
          <Text>{isEdit ? "保存修改" : "确认添加"}</Text>
        </View>
      </View>
    </PageContainer>

    {/* 模板选择弹窗 */}
    {showTemplates && (
      <View className="template-mask" onClick={() => setShowTemplates(false)}>
        <View className="template-dialog" onClick={(e) => e.stopPropagation()}>
          <View className="template-header">
            <Text className="template-title">选择模板</Text>
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
                      {formatMoney(Number(template.amount ?? 0), { compact: false, showSign: true, sign: template.type === "income" ? "+" : "-" })}
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
