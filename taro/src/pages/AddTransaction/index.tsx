/**
 * AddTransaction V4 — 安静记账页
 * 设计稿对齐：金额输入区、分类网格、表单行、保存按钮
 * 使用系统原生键盘，支持模板选择
 */
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { View, Text, Input, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getTransaction } from "../../services/transactionsApi";
import { useCategories } from "../../hooks/useCategories";
import { useManualQuery } from "../../hooks/useManualQuery";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "../../hooks/useTransactions";
import { fmtDate } from "../../utils/format";
import { API_BASE_URL } from "../../services/api";
import SegmentedControl from "../../components/SegmentedControl";
import NavHeader from "../../components/NavHeader";
import DatePicker from "./components/DatePicker";
import LocationPicker from "./components/LocationPicker";
import type { Category, LocationInfo } from "../../types";
import { ApiError } from "../../services/api";
import "./index.scss";

export default function AddTransaction() {
  const router = Taro.useRouter();
  const params = router.params as Record<string, string | undefined>;
  // 支持两种编辑入口：1. navigateTo 带 edit 参数 2. switchTab 后从 storage 读取
  const editId = params.edit || Taro.getStorageSync("edit_tx_id") || "";
  const isEdit = !!editId;
  const urlType = params.type as "expense" | "income" | undefined;
  const urlCategory = params.category || "";

  // 清除 storage 中的 edit 标记
  useEffect(() => {
    if (!params.edit && editId) {
      const timer = setTimeout(() => Taro.removeStorageSync("edit_tx_id"), 500);
      return () => clearTimeout(timer);
    }
  }, []);

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
  const [showTemplateSheet, setShowTemplateSheet] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* 表单重置（从编辑态切换到新建态时使用） */
  const resetForm = useCallback(() => {
    setType("expense");
    setAmount("");
    setSelectedCategory(null);
    setDate(new Date());
    setNote("");
    setLocation(null);
    setError("");
  }, []);

  const prevEditIdRef = useRef(editId);

  /* 每次页面显示时，检查是否应从编辑态重置为新建态 */
  Taro.useDidShow(() => {
    const storageEditId = Taro.getStorageSync("edit_tx_id") || "";
    const currentEditId = params.edit || storageEditId;
    // 上一次有 editId，这一次没有 → 从编辑态切换到了新建态，重置表单
    if (!currentEditId && prevEditIdRef.current) {
      resetForm();
    }
    prevEditIdRef.current = currentEditId;
    // 如果 storage 里还有残留，清掉
    if (!params.edit && storageEditId) {
      Taro.removeStorageSync("edit_tx_id");
    }
  });

  // 全部分类（不按 type 过滤，用于模板查找）
  const { data: allCategories = [] } = useCategories();
  // 当前类型的分类（用于分类网格）
  const { data: categories = [] } = useCategories(type);
  const filteredCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  // 模板数据
  const { data: templates = [] } = useManualQuery<any[]>({
    key: "templates",
    queryFn: async () => {
      try {
        const token = Taro.getStorageSync("auth_token");
        const bookId = Taro.getStorageSync("current_book_id");
        const res = await Taro.request({
          url: `${API_BASE_URL}/templates`,
          header: {
            Authorization: token ? `Bearer ${token}` : "",
            "x-book-id": bookId || "",
          },
        });
        return (res.data as any)?.data || [];
      } catch {
        return [];
      }
    },
    enabled: true,
  });

  const { data: editData } = useManualQuery({
    key: `transaction-${editId}`,
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
          address: locData.location_address || "",
          lat: locData.latitude,
          lng: locData.longitude,
          poiId: locData.poi_id || null,
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

  const handleClose = useCallback(() => {
    Taro.navigateBack().catch(() => {
      Taro.switchTab({ url: "/pages/Home/index" });
    });
  }, []);

  // 应用模板 — 使用全部分类查找，不依赖当前 type 的过滤结果
  const applyTemplate = useCallback(
    (tpl: any) => {
      const tplType = tpl.type || "expense";
      setType(tplType);
      setNote(tpl.description || "");
      // 模板有金额就用模板金额，否则清空让用户输入
      setAmount(tpl.amount ? String(tpl.amount) : "");
      if (tpl.category || tpl.category_id) {
        const catId = tpl.category_id || tpl.category;
        const cat = allCategories.find((c: Category) => c.id === catId);
        if (cat) setSelectedCategory(cat);
      }
      setShowTemplateSheet(false);
    },
    [allCategories],
  );

  const handleSubmit = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Taro.showToast({ title: "请输入有效金额", icon: "none" });
      setError("请输入有效金额");
      return;
    }
    if (!selectedCategory) {
      Taro.showToast({ title: "请选择分类", icon: "none" });
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
      location_address: location?.address,
      location_lat: location?.lat,
      location_lng: location?.lng,
      poi_id: location?.poiId,
    };
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: Number(editId), input: payload });
        Taro.showToast({ title: "修改成功", icon: "success" });
      } else {
        await createMut.mutateAsync(payload);
        Taro.showToast({ title: "保存成功", icon: "success" });
      }
      handleClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "操作失败，请重试";
      Taro.showToast({ title: msg, icon: "none" });
      setError(msg);
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
    handleClose,
  ]);

  return (
    <View className="add-page min-h-screen bg-bg flex flex-col">
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
              onClick={() => setShowTemplateSheet(true)}
            >
              模板
            </Text>
          ) : undefined
        }
      />

      <ScrollView className="flex-1" scrollY>
        {/* Type switch */}
        <View className="add-type-wrap">
          <SegmentedControl
            options={["支出", "收入"]}
            value={type === "expense" ? 0 : 1}
            onChange={(index) => {
              setType(index === 0 ? "expense" : "income");
              setSelectedCategory(null);
            }}
          />
        </View>

        {/* Amount input — 系统原生键盘 */}
        <View className="add-amount-area">
          <View className="add-amount-row">
            <Text className="add-currency">¥</Text>
            <Input
              className="add-amount-input"
              type="digit"
              value={amount}
              placeholder="0"
              placeholderClass="add-amount-placeholder"
              onInput={(e: any) => {
                let val = e.detail.value;
                // 限制两位小数
                if (val.includes(".") && val.split(".")[1]?.length > 2) return;
                // 限制长度
                if (val.replace(".", "").length > 9) return;
                setAmount(val);
                setError("");
              }}
              focus
              adjustPosition
            />
          </View>
          <View className="add-amount-line" />
          {error ? <Text className="add-error">{error}</Text> : null}
        </View>

        {/* Category grid — 5 columns */}
        <View className="add-cat-section">
          <Text className="add-section-label">选择分类</Text>
          <View className="add-cat-grid">
            {filteredCategories.map((cat) => {
              const isSelected = cat.id === selectedCategory?.id;
              return (
                <View
                  key={cat.id}
                  className={`cat-item ${isSelected ? "cat-item--selected" : ""}`}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setError("");
                  }}
                >
                  <Text className="cat-emoji">{cat.icon}</Text>
                  <Text
                    className={`cat-name ${isSelected ? "cat-name--active" : ""}`}
                  >
                    {cat.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Detail form */}
        <View className="add-detail-section">
          <View className="card">
            <DatePicker value={date} onChange={setDate}>
              <View className="form-row add-form-row">
                <Text className="form-label">日期</Text>
                <Text className="form-value">
                  {fmtDate(date)}
                  <Text className="form-chevron">▾</Text>
                </Text>
              </View>
            </DatePicker>

            <View className="form-row add-form-row">
              <Text className="form-label">备注</Text>
              <Input
                className="form-input"
                value={note}
                onInput={(e: any) => setNote(e.detail.value)}
                placeholder="午餐外卖..."
                placeholderClass="text-hint"
                maxlength={100}
              />
            </View>

            <View
              className="form-row add-form-row"
              style={{ borderBottom: "none" }}
              onClick={() => setShowLocationPicker(true)}
            >
              <Text className="form-label">位置</Text>
              <View className="form-value-col">
                <Text className="form-value">
                  {location?.name || "选择位置"}
                  <Text className="form-chevron">▸</Text>
                </Text>
                {location?.lat && location?.lng ? (
                  <Text className="form-value-sub">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </Text>
                ) : null}
                {location?.address && location.address !== location.name ? (
                  <Text className="form-value-sub">{location.address}</Text>
                ) : null}
                {location?.poiId ? (
                  <Text className="form-value-sub">POI: {location.poiId}</Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* Save button */}
        <View className="add-save-wrap">
          <View
            className={`btn-primary ${submitting || !amount ? "opacity-50" : ""}`}
            onClick={handleSubmit}
          >
            <Text className="text-white font-semibold">
              {submitting
                ? "保存中..."
                : isEdit
                  ? "✓ 保存修改"
                  : "✓ 保存交易"}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Template bottom sheet */}
      {showTemplateSheet && (
        <View
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowTemplateSheet(false)}
        >
          <View
            className="add-template-sheet animate-slide-up"
            onClick={(e: any) => e.stopPropagation()}
          >
            <Text className="add-template-title">选择模板</Text>
            <ScrollView className="add-template-list" scrollY>
              {templates.length === 0 ? (
                <View className="py-5 text-center">
                  <Text className="text-sm text-hint">暂无模板</Text>
                </View>
              ) : (
                templates.map((tpl: any) => (
                  <View
                    key={tpl.id}
                    className="add-template-item"
                    onClick={() => applyTemplate(tpl)}
                  >
                    <View className="flex items-center gap-3">
                      <View className="add-template-icon">
                        <Text className="add-template-emoji">
                          {tpl.category_icon || "📌"}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium">
                          {tpl.description || tpl.name || "未命名模板"}
                        </Text>
                        <Text className="text-xs text-hint mt-1">
                          {tpl.category_name || ""}
                          {tpl.amount ? ` · ¥${tpl.amount}` : ""}
                        </Text>
                      </View>
                    </View>
                    <Text
                      className={`add-template-type ${tpl.type === "income" ? "add-template-type--income" : "add-template-type--expense"}`}
                    >
                      {tpl.type === "income" ? "收入" : "支出"}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
            <View className="btn-secondary mt-3" onClick={() => setShowTemplateSheet(false)}>
              <Text className="text-sm">取消</Text>
            </View>
          </View>
        </View>
      )}

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={(loc) => {
          setLocation({
            name: loc.locationName,
            address: loc.address || loc.locationName,
            lat: loc.latitude,
            lng: loc.longitude,
            poiId: loc.poiId,
          });
          setShowLocationPicker(false);
        }}
      />
    </View>
  );
}
