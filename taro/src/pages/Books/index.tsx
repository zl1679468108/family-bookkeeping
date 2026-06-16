/**
 * Books — 账本管理
 * 对齐 PC：账本列表、切换账本（二次确认）、新增、编辑、删除
 * 样式：白色圆角卡片 + 悬浮 FAB + Sheet 底部弹窗
 * 选中状态：通过 BookContext 判断，给当前使用的账本加 active 高亮边框
 * 图标：通过 getBookIconText(book.icon) 渲染 emoji（与 PC 端 key 定义对齐）
 */
import { useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import PageLayout from "../../components/PageLayout";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";
import { apiGet, apiPost, apiPut, apiDelete } from "../../services/api";
import { useManualQuery } from "../../hooks/useManualQuery";
import { useBookContext } from "../../context/BookContext";
import { BOOK_ICONS, getBookIconText } from "../../utils/bookIcons";
import "./index.scss";

interface Book {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  owner_id?: string;
  is_default?: boolean;
  icon?: string; // PC 端 key（'default' 'home' 'family' 等）或 emoji
}

export default function BooksPage() {
  const qc = useQueryClient();
  const { currentBook, switchBook } = useBookContext();

  // 新增/编辑弹窗
  const [showSheet, setShowSheet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: "default", // 使用 PC 端的 key
  });

  // 删除确认
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 切换账本确认
  const [switchTarget, setSwitchTarget] = useState<Book | null>(null);

  // --- 数据请求 ---
  const { data: books, isLoading, refetch } = useManualQuery<Book[]>({
    key: "books",
    queryFn: () => apiGet<Book[]>("/books"),
  });

  const createMut = useMutation({
    mutationFn: (data: { name: string; description?: string; icon?: string }) =>
      apiPost<Book>("/books", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      Taro.showToast({ title: "已创建", icon: "success" });
      handleClose();
      refetch();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; description?: string; icon?: string };
    }) => apiPut<Book>(`/books/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      Taro.showToast({ title: "已更新", icon: "success" });
      handleClose();
      refetch();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiDelete(`/books/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      Taro.showToast({ title: "已删除", icon: "success" });
      setDeleteId(null);
      refetch();
    },
  });

  const handleAdd = () => {
    setForm({ name: "", description: "", icon: "default" });
    setEditingId(null);
    setShowSheet(true);
  };

  const handleEdit = (book: Book) => {
    setForm({
      name: book.name,
      description: book.description || "",
      icon: book.icon || "default",
    });
    setEditingId(book.id);
    setShowSheet(true);
  };

  const handleClose = () => {
    setShowSheet(false);
    setEditingId(null);
    setForm({ name: "", description: "", icon: "default" });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      Taro.showToast({ title: "请输入账本名称", icon: "none" });
      return;
    }
    const data: { name: string; description?: string; icon?: string } = {
      name: form.name.trim(),
      icon: form.icon || "default",
    };
    if (form.description && form.description.trim()) {
      data.description = form.description.trim();
    }
    if (editingId) {
      updateMut.mutate({ id: editingId, data });
    } else {
      createMut.mutate(data);
    }
  };

  // 点击卡片：若非当前账本，弹出二次确认切换
  const handleCardTap = (book: Book) => {
    if (currentBook && String(currentBook.id) === String(book.id)) return;
    setSwitchTarget(book);
  };

  // 确认切换
  const handleConfirmSwitch = () => {
    if (!switchTarget) return;
    switchBook(switchTarget);
    Taro.setStorageSync("currentBookId", switchTarget.id);
    qc.invalidateQueries();
    Taro.showToast({
      title: `已切换到「${switchTarget.name}」`,
      icon: "success",
    });
    setSwitchTarget(null);
  };

  const saving = createMut.isPending || updateMut.isPending;
  const currentId = currentBook?.id;

  return (
    <PageLayout contentClassName="bk-content">
      {isLoading ? (
        <View className="bk-list">
          <View className="bk-loading-row" />
          <View className="bk-loading-row" />
          <View className="bk-loading-row" />
        </View>
      ) : !books || books.length === 0 ? (
        <View className="bk-empty">
          <EmptyState
            icon="📒"
            title="暂无账本"
            description="点击右下角 ＋ 新建账本"
          />
        </View>
      ) : (
        <View className="bk-list">
          {books.map((book) => {
            const isActive = String(currentId) === String(book.id);
            return (
              <View
                key={book.id}
                className={`bk-card ${isActive ? "bk-card--active" : ""}`}
                onClick={() => handleCardTap(book)}
              >
                <View className="bk-card__head">
                  <Text className="bk-card__emoji">
                    {getBookIconText(book.icon)}
                  </Text>
                  <Text className="bk-card__name">{book.name}</Text>
                  {isActive && (
                    <Text className="bk-tag bk-tag--active">当前</Text>
                  )}
                  {book.is_default && !isActive && (
                    <Text className="bk-tag bk-tag--default">默认</Text>
                  )}
                </View>
                {book.description && (
                  <Text className="bk-card__meta-line">
                    简介：{book.description}
                  </Text>
                )}
                {book.created_at && (
                  <Text className="bk-card__meta-line">
                    创建于{" "}
                    {new Date(book.created_at).toLocaleDateString("zh-CN")}
                  </Text>
                )}
                <View className="bk-card__actions">
                  <View
                    className="bk-pill bk-pill--edit"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      handleEdit(book);
                    }}
                  >
                    <Text>编辑</Text>
                  </View>
                  {!book.is_default && (
                    <View
                      className="bk-pill bk-pill--delete"
                      onClick={(e: any) => {
                        e.stopPropagation();
                        setDeleteId(book.id);
                      }}
                    >
                      <Text>删除</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 悬浮新建按钮 */}
      <View className="bk-fab" onClick={handleAdd}>
        <Text className="bk-fab__icon">＋</Text>
      </View>

      {/* Sheet 弹窗（新增/编辑） */}
      {showSheet && (
        <View className="bk-mask" onClick={handleClose}>
          <View className="bk-sheet" onClick={(e: any) => e.stopPropagation()}>
            <View className="bk-sheet__header">
              <Text className="bk-sheet__cancel" onClick={handleClose}>
                取消
              </Text>
              <Text className="bk-sheet__title">
                {editingId ? "编辑账本" : "新建账本"}
              </Text>
              <Text
                className={`bk-sheet__confirm ${
                  saving ? "bk-sheet__confirm--disabled" : ""
                }`}
                onClick={handleSave}
              >
                {saving ? "保存中…" : "保存"}
              </Text>
            </View>

            <View className="bk-sheet__body">
              <View className="bk-form-row">
                <Text className="bk-form-label">名称</Text>
                <Input
                  className="bk-form-input"
                  placeholder="如：日常开销"
                  maxlength={20}
                  value={form.name}
                  onInput={(e: any) =>
                    setForm((p) => ({ ...p, name: e.detail.value }))
                  }
                />
              </View>

              {/* 图标选择网格（与 PC 端 keys 对齐） */}
              <View className="bk-form-row">
                <Text className="bk-form-label">图标</Text>
                <Text className="bk-form-emoji-current">
                  {getBookIconText(form.icon)}
                </Text>
              </View>
              <View className="bk-emoji-grid">
                {BOOK_ICONS.map((item) => {
                  const isSelected = form.icon === item.key;
                  return (
                    <View
                      key={item.key}
                      className={`bk-emoji-item ${
                        isSelected ? "bk-emoji-item--selected" : ""
                      }`}
                      onClick={() =>
                        setForm((p) => ({ ...p, icon: item.key }))
                      }
                    >
                      <Text className="bk-emoji-item__emoji">
                        {getBookIconText(item.key)}
                      </Text>
                      <Text className="bk-emoji-item__label">{item.label}</Text>
                    </View>
                  );
                })}
              </View>

              <View className="bk-form-row">
                <Text className="bk-form-label">简介</Text>
                <Input
                  className="bk-form-input"
                  placeholder="可选：简短描述"
                  maxlength={50}
                  value={form.description}
                  onInput={(e: any) =>
                    setForm((p) => ({ ...p, description: e.detail.value }))
                  }
                />
              </View>
            </View>

            <View className="bk-sheet__safe" />
          </View>
        </View>
      )}

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        visible={!!deleteId}
        title="确认删除"
        message="确定要删除这个账本吗？"
        confirmText="确认删除"
        danger
        confirmLoading={deleteMut.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
      />

      {/* 切换账本确认弹窗（danger=false，使用 primary 绿色按钮） */}
      <ConfirmDialog
        visible={!!switchTarget}
        title="切换账本"
        message={`确定要切换到「${switchTarget?.name || ""}」吗？`}
        confirmText="确认切换"
        danger={false}
        onCancel={() => setSwitchTarget(null)}
        onConfirm={handleConfirmSwitch}
      />
    </PageLayout>
  );
}
