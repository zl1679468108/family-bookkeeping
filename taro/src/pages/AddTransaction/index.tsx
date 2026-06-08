/**
 * AddTransaction — V3.0 安静记账页
 */
import { useState, useCallback, useMemo, useEffect } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useQuery } from "@tanstack/react-query";
import { getTransaction } from "../../services/transactionsApi";
import { useCategories } from "../../hooks/useCategories";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "../../hooks/useTransactions";
import { fmtDate } from "../../utils/format";
import SegmentedControl from "../../components/SegmentedControl";
import NavHeader from "../../components/NavHeader";
import DatePicker from "./components/DatePicker";
import NumberPad from "./components/NumberPad";
import LocationPicker from "./components/LocationPicker";
import type { Category, LocationInfo } from "../../types";
import { ApiError } from "../../services/api";
import "./index.scss";

export default function AddTransaction() {
  const router = Taro.useRouter();
  const params = router.params as Record<string, string | undefined>;
  const editId = params.edit || "";
  const isEdit = !!editId;
  const urlType = params.type as "expense" | "income" | undefined;
  const urlCategory = params.category || "";

  const createMut = useCreateTransaction();
  const updateMut = useUpdateTransaction();

  const [type, setType] = useState<"expense" | "income">(
    urlType === "expense" || urlType === "income" ? urlType : "expense",
  );
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState("");
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: categories = [] } = useCategories(type);
  const filteredCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  const { data: editData } = useQuery({
    queryKey: ["transaction", editId],
    queryFn: () => getTransaction(Number(editId)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (editData) {
      setType(editData.type);
      setAmount(String(editData.amount));
      setDate(new Date(editData.date));
      setNote(editData.description || "");
      const locData = editData as any;
      if (locData.latitude && locData.longitude) {
        setLocation({
          name: locData.location_name || "",
          address: "",
          lat: locData.latitude,
          lng: locData.longitude,
        });
      }
    }
  }, [editData]);

  useEffect(() => {
    if (editData && categories.length > 0) {
      const cat = categories.find(
        (c) => c.id === ((editData as any).category_id || editData.category),
      );
      if (cat) setSelectedCategory(cat);
    } else if (!isEdit && urlCategory && categories.length > 0) {
      const cat = categories.find((c) => c.id === urlCategory);
      if (cat) setSelectedCategory(cat);
    }
  }, [editData, categories, urlCategory, isEdit]);

  useEffect(() => {
    if (!selectedCategory && filteredCategories.length > 0 && !isEdit) {
      setSelectedCategory(filteredCategories[0]);
    }
  }, [filteredCategories, selectedCategory, isEdit]);

  const handleNumInput = useCallback((char: string) => {
    setAmount((prev) => {
      if (char === "." && prev.includes(".")) return prev;
      if (char === "." && prev === "") return "0.";
      if (prev.includes(".") && prev.split(".")[1].length >= 2) return prev;
      if (prev.replace(".", "").length >= 9) return prev;
      return prev + char;
    });
  }, []);

  const handleDelete = useCallback(
    () => setAmount((prev) => prev.slice(0, -1)),
    [],
  );

  const handleClose = useCallback(() => {
    Taro.navigateBack().catch(() => {
      Taro.switchTab({ url: "/pages/Home/index" });
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("请输入有效金额");
      return;
    }
    if (!selectedCategory) {
      setError("请选择分类");
      return;
    }
    setError("");
    setSubmitting(true);
    const payload = {
      amount: numAmount,
      category: selectedCategory.id,
      type,
      date: date.toISOString(),
      description: note || undefined,
      location_name: location?.name,
      location_lat: location?.lat,
      location_lng: location?.lng,
    };
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: Number(editId), input: payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      handleClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "操作失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }, [
    amount,
    selectedCategory,
    type,
    date,
    note,
    location,
    isEdit,
    editId,
    createMut,
    updateMut,
  ]);

  const formattedAmount = amount ? `¥${amount}` : "¥0";

  return (
    <View className="add-transaction-page min-h-screen bg-bg flex flex-col">
      {/* Nav bar */}
      <NavHeader
        title={isEdit ? "编辑记录" : "记一笔"}
        leftContent={
          <View className="nav-close-btn" onClick={handleClose}>
            <Text className="nav-close-text">✕</Text>
          </View>
        }
        rightContent={
          !isEdit ? (
            <Text
              className="nav-template-link"
              onClick={() =>
                Taro.navigateTo({ url: "/pages/TemplateManager/index" })
              }
            >
              模板
            </Text>
          ) : undefined
        }
      />

      {/* Type switch */}
      <View className="px-4 mt-4">
        <SegmentedControl
          options={["支出", "收入"]}
          value={type === "expense" ? 0 : 1}
          onChange={(index) => {
            setType(index === 0 ? "expense" : "income");
            setSelectedCategory(null);
          }}
        />
      </View>

      {/* Amount display */}
      <View className="amount-display text-center">
        <Text className={`amount-value ${amount ? "" : "text-hint"}`}>
          {formattedAmount}
        </Text>
        {error ? <Text className="amount-error">{error}</Text> : null}
      </View>

      {/* Category grid — 5 columns */}
      <View className="px-4">
        <Text className="section-label">选择分类</Text>
        <View className="category-grid-5">
          {filteredCategories.map((cat) => {
            const isSelected = cat.id === selectedCategory?.id;
            const bgClass =
              type === "expense" ? "cat-item--expense" : "cat-item--income";
            return (
              <View
                key={cat.id}
                className={`cat-item ${isSelected ? `${bgClass} cat-item--selected` : "bg-card tappable-card"}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  setError("");
                }}
              >
                <Text className="cat-emoji">{cat.icon}</Text>
                <Text
                  className={`cat-name ${isSelected ? "font-semibold" : "text-secondary"}`}
                >
                  {cat.name}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Detail rows */}
      <View className="detail-section px-4">
        <DatePicker value={date} onChange={setDate}>
          <View className="detail-row flex justify-between items-center border-b">
            <Text className="text-secondary text-md">日期</Text>
            <Text className="text-md font-semibold">{fmtDate(date)}</Text>
          </View>
        </DatePicker>

        <View className="detail-row">
          <Input
            className="detail-input"
            value={note}
            onInput={(e) => setNote(e.detail.value)}
            placeholder="添加备注..."
            placeholderClass="text-hint"
            maxlength={100}
          />
        </View>

        <View
          className="detail-row flex justify-between items-center"
          onClick={() => setShowLocationPicker(true)}
        >
          <Text className={`text-md ${location?.name ? "" : "text-hint"}`}>
            {location?.name || "地图选点 📍"}
          </Text>
          <Text className="text-hint text-sm">▸</Text>
        </View>
      </View>

      {/* NumberPad */}
      <View className="numberpad-wrapper">
        <NumberPad
          onInput={handleNumInput}
          onDelete={handleDelete}
          onConfirm={handleSubmit}
          confirmDisabled={submitting || !amount}
        />
      </View>

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={(loc) => {
          setLocation({
            name: loc.locationName,
            address: "",
            lat: loc.latitude,
            lng: loc.longitude,
          });
          setShowLocationPicker(false);
        }}
      />
    </View>
  );
}
