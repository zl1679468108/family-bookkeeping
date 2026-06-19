/**
 * BookSettings — 账本设置
 * 对齐 PC：账本信息（名称、描述、图标）、成员管理、所有权转移、删除账本
 */
import { useState } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import Taro, { getCurrentInstance } from "@tarojs/taro";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageLayout from "../../components/PageLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import { AppSection, MenuList, PageHero } from "../../components/ui";
import { BOOK_ICONS, renderBookIconSvg } from "../../utils/bookIcons";

const isCustomIcon = (val: string): boolean =>
  !!val && (val.startsWith("http://") || val.startsWith("https://"));
import {
  fetchBooks,
  updateBook,
  deleteBook,
  checkOwner,
  fetchBookMembers,
  transferOwner,
} from "../../services/booksApi";
import "./index.scss";

export default function BookSettings() {
  const router = getCurrentInstance().router;
  const bookId = (router?.params?.id as string) || "";
  const qc = useQueryClient();

  // ===== UI 状态 =====
  // 编辑账本信息（名称/描述/图标）
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIcon, setEditIcon] = useState("");

  // 转移所有权
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferPassword, setTransferPassword] = useState("");

  // 删除确认
  const [showDelete, setShowDelete] = useState(false);

  // ===== 数据 =====
  const { data: books = [] } = useQuery({
    queryKey: ["books"],
    queryFn: fetchBooks,
  });

  const currentBook: any = books.find((b: any) => b.id === bookId);

  const { data: ownerCheck } = useQuery({
    queryKey: ["books", bookId, "owner"],
    queryFn: () => checkOwner(bookId),
    enabled: !!bookId,
  });
  const isOwner = ownerCheck?.isOwner ?? false;

  const { data: members = [] } = useQuery({
    queryKey: ["books", bookId, "members"],
    queryFn: () => fetchBookMembers(bookId),
    enabled: !!bookId && isOwner,
  });

  // ===== Mutations =====
  const updateMut = useMutation({
    mutationFn: (data: { name?: string; description?: string; icon?: string }) =>
      updateBook(bookId, data),
    onSuccess: () => {
      Taro.showToast({ title: "已保存", icon: "success" });
      setShowEditSheet(false);
      qc.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (err: any) => {
      Taro.showToast({ title: err.message || "保存失败", icon: "none" });
    },
  });

  const transferMut = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      transferOwner(bookId, email, password),
    onSuccess: () => {
      Taro.showToast({ title: "所有权已转移", icon: "success" });
      setShowTransfer(false);
      qc.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (err: any) => {
      Taro.showToast({ title: err.message || "转移失败", icon: "none" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteBook(bookId),
    onSuccess: () => {
      Taro.showToast({ title: "账本已删除", icon: "success" });
      qc.invalidateQueries({ queryKey: ["books"] });
      setTimeout(() => Taro.navigateBack(), 500);
    },
    onError: (err: any) => {
      Taro.showToast({ title: err.message || "删除失败", icon: "none" });
    },
  });

  // ===== 打开编辑弹窗 =====
  const handleOpenEdit = () => {
    setEditName(currentBook?.name || "");
    setEditDescription(currentBook?.description || "");
    setEditIcon(currentBook?.icon || "default");
    setShowEditSheet(true);
  };

  const handleSubmitEdit = () => {
    if (!editName.trim()) {
      Taro.showToast({ title: "请输入名称", icon: "none" });
      return;
    }
    updateMut.mutate({
      name: editName.trim(),
      description: editDescription.trim(),
      icon: editIcon,
    });
  };

  const handleSubmitTransfer = () => {
    if (!transferEmail.trim()) {
      Taro.showToast({ title: "请输入新成员邮箱", icon: "none" });
      return;
    }
    if (!transferPassword) {
      Taro.showToast({ title: "请输入密码验证", icon: "none" });
      return;
    }
    transferMut.mutate({
      email: transferEmail.trim(),
      password: transferPassword,
    });
  };

  // ===== 渲染 =====
  if (!currentBook) {
    return (
      <PageLayout contentClassName="bs-content">
        <View className="bs-empty">
          <Text>账本不存在</Text>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout contentClassName="bs-content">
      <PageHero
        title={currentBook.name}
        value={isOwner ? "拥有者" : "成员"}
        meta={`${currentBook.description || "未填写描述"} · 创建于 ${new Date(currentBook.created_at).toLocaleDateString("zh-CN")}`}
        tone="surface"
        aside={
          <View className="bs-hero-icon">
            {isCustomIcon(currentBook.icon) ? (
              <Text className="bs-card__icon-text">图</Text>
            ) : (
              <Image
                src={renderBookIconSvg(currentBook.icon, 32, "#2d9d8a")}
                mode="aspectFit"
                style={{ width: "32px", height: "32px", display: "block" }}
              />
            )}
          </View>
        }
      />

      {isOwner && (
        <MenuList
          items={[
            {
              label: "编辑账本信息",
              icon: "edit",
              onClick: handleOpenEdit,
            },
          ]}
        />
      )}

      {isOwner && (
        <AppSection title="成员管理" subtitle={`${members.length} 位成员正在使用这个账本`}>
          <MenuList
            className="bs-inner-menu"
            items={[
              {
                label: "管理成员",
                icon: "profile",
                right: <Text className="bs-info-row__value">{members.length} 人 ›</Text>,
                onClick: () =>
                  Taro.navigateTo({ url: `/pages/BookMembers/index?id=${bookId}` }),
              },
            ]}
          />
        </AppSection>
      )}

      {isOwner && (
        <MenuList
          items={[
            {
              label: "转移所有权",
              icon: "profile",
              onClick: () => setShowTransfer(true),
            },
            {
              label: "删除账本",
              icon: "delete",
              danger: true,
              onClick: () => setShowDelete(true),
            },
          ]}
        />
      )}

      {/* ===== 编辑账本信息 Sheet ===== */}
      {showEditSheet && (
        <View className="bs-mask" onClick={() => setShowEditSheet(false)}>
          <View className="bs-sheet" onClick={(e: any) => e.stopPropagation()}>
            <View className="bs-sheet__header">
              <Text className="bs-sheet__cancel" onClick={() => setShowEditSheet(false)}>
                取消
              </Text>
              <Text className="bs-sheet__title">编辑账本信息</Text>
              <Text
                className={`bs-sheet__confirm ${
                  updateMut.isPending ? "bs-sheet__confirm--disabled" : ""
                }`}
                onClick={handleSubmitEdit}
              >
                {updateMut.isPending ? "保存中…" : "保存"}
              </Text>
            </View>

            <View className="bs-sheet__body">
              {/* 名称 */}
              <View className="bs-form-row">
                <Text className="bs-form-label">名称</Text>
                <Input
                  className="bs-form-input"
                  placeholder="请输入账本名称"
                  maxlength={30}
                  value={editName}
                  onInput={(e: any) => setEditName(e.detail.value)}
                />
              </View>

              {/* 描述 */}
              <View className="bs-form-row">
                <Text className="bs-form-label">描述</Text>
                <Input
                  className="bs-form-input"
                  placeholder="选填，简要说明这个账本的用途"
                  maxlength={100}
                  value={editDescription}
                  onInput={(e: any) => setEditDescription(e.detail.value)}
                />
              </View>

              {/* 图标（SVG 线条风格，与 PC 端一致） */}
              <View className="bs-form-row bs-form-row--stack">
                <Text className="bs-form-label">图标</Text>
                <View className="bs-emoji-grid">
                  {BOOK_ICONS.map((item: any) => {
                    const isSelected = editIcon === item.key;
                    return (
                      <View
                        key={item.key}
                        className={`bs-emoji-item ${
                          isSelected ? "bs-emoji-item--selected" : ""
                        }`}
                        onClick={() => setEditIcon(item.key)}
                      >
                        <View className="bs-emoji-item__icon">
                          <Image
                            src={renderBookIconSvg(
                              item.key,
                              20,
                              isSelected ? "#2d9d8a" : "#1a1c19",
                            )}
                            mode="aspectFit"
                            style={{ width: "20px", height: "20px", display: "block" }}
                          />
                        </View>
                        <Text
                          className={`bs-emoji-item__label ${
                            isSelected ? "bs-emoji-item__label--selected" : ""
                          }`}
                        >
                          {item.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            <View className="bs-sheet__safe" />
          </View>
        </View>
      )}

      {/* ===== 转移所有权 Sheet ===== */}
      {showTransfer && (
        <View className="bs-mask" onClick={() => setShowTransfer(false)}>
          <View className="bs-sheet" onClick={(e: any) => e.stopPropagation()}>
            <View className="bs-sheet__header">
              <Text className="bs-sheet__cancel" onClick={() => setShowTransfer(false)}>
                取消
              </Text>
              <Text className="bs-sheet__title">转移所有权</Text>
              <Text
                className={`bs-sheet__confirm ${
                  transferMut.isPending ? "bs-sheet__confirm--disabled" : ""
                }`}
                onClick={handleSubmitTransfer}
              >
                {transferMut.isPending ? "提交中…" : "确认"}
              </Text>
            </View>

            <View className="bs-sheet__body">
              <View className="bs-warn-box">
                <Text className="bs-warn-box__text">
                  转移后您将变为普通成员，新拥有者将拥有账本的全部管理权限
                </Text>
              </View>

              <View className="bs-form-row">
                <Text className="bs-form-label">新拥有者邮箱</Text>
                <Input
                  className="bs-form-input"
                  placeholder="请输入该成员的账号邮箱"
                  value={transferEmail}
                  onInput={(e: any) => setTransferEmail(e.detail.value)}
                />
              </View>

              <View className="bs-form-row">
                <Text className="bs-form-label">您的密码</Text>
                <Input
                  className="bs-form-input"
                  password
                  placeholder="输入密码以验证身份"
                  value={transferPassword}
                  onInput={(e: any) => setTransferPassword(e.detail.value)}
                />
              </View>
            </View>

            <View className="bs-sheet__safe" />
          </View>
        </View>
      )}

      {/* ===== 删除确认 ===== */}
      <ConfirmDialog
        visible={showDelete}
        title="确认删除"
        message="确定要删除该账本吗？账本内所有交易记录将被清除，此操作不可恢复。"
        confirmText="确认删除"
        confirmLoading={deleteMut.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => deleteMut.mutate()}
      />
    </PageLayout>
  );
}
