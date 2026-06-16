/**
 * AddTransaction — 记一笔
 * 参考 PC 端结构：类型 / 金额 / 分类 / 日期 / 品牌 / 备注 / 位置 / 图片
 * 必填字段：金额(*) / 分类(*) / 日期(*)
 */
import { useState, useEffect } from "react";
import { View, ScrollView, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getTransaction } from "../../services/transactionsApi";
import { useCategories } from "../../hooks/useCategories";
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
  const [brand, setBrand] = useState("");
  const [note, setNote] = useState("");
  const [savedImages, setSavedImages] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationResult | null>(null);

  const { categories = [] } = useCategories(type, true);
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
        setDate((data.date || "").slice(0, 10));
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

  // 类型切换时，如果当前分类不属于新类型，清空
  useEffect(() => {
    if (categoryId) {
      const matched = categories.find(
        (c: any) => String(c.id) === String(categoryId),
      );
      if (!matched) setCategoryId("");
    }
  }, [type, categories]); // eslint-disable-line

  const isSubmitting = createMut.isLoading || updateMut.isLoading;

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

  // 提交
  const handleSubmit = () => {
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
      date,
      brand: brand || undefined,
      description: note || undefined,
      latitude: location?.latitude,
      longitude: location?.longitude,
      location_name: location?.name || undefined,
    };

    const submit = isEdit
      ? updateMut.mutateAsync({ id: Number(editId), payload })
      : createMut.mutateAsync(payload);

    Taro.showLoading({ title: "保存中..." });
    submit
      .then(() => {
        Taro.hideLoading();
        Taro.showToast({
          title: isEdit ? "修改成功" : "添加成功",
          icon: "success",
        });
        setTimeout(() => Taro.navigateBack(), 600);
      })
      .catch((err: any) => {
        Taro.hideLoading();
        Taro.showToast({
          title: err?.message || "保存失败",
          icon: "none",
        });
      });
  };

  return (
    <ScrollView className="addtx" scrollY>
      <TypeTabs value={type} onChange={setType} />

      <AmountCard value={amount} onChange={setAmount} />

      <SectionCard>
        {/* 分类：点击 ActionSheet 选择 */}
        <FieldRow
          label="分类"
          required
          variant="row"
          value={currentCategory?.name || ""}
          placeholder="选择分类"
          onClick={handlePickCategory}
        />
        {/* 日期：Picker */}
        <Picker
          mode="date"
          value={date}
          onChange={(e: any) => setDate(e.detail.value)}
        >
          <FieldRow label="日期" required variant="row" value={date} />
        </Picker>
        {/* 品牌：输入框 */}
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
        images={savedImages}
        onChange={setSavedImages}
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
  );
}
