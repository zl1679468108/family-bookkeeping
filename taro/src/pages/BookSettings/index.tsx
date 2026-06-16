/**
 * BookSettings — 账本设置
 */
import { useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro, { getCurrentInstance } from "@tarojs/taro";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBooks,
  renameBook,
  deleteBook,
  checkOwner,
} from "../../services/booksApi";
import ConfirmDialog from "../../components/ConfirmDialog";
import PageLayout from "../../components/PageLayout";

export default function BookSettings() {
  const router = getCurrentInstance().router;
  const bookId = (router?.params?.id as string) || "";
  const qc = useQueryClient();

  const [renameValue, setRenameValue] = useState("");
  const [showRename, setShowRename] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: books = [] } = useQuery({
    queryKey: ["books"],
    queryFn: fetchBooks,
  });

  const currentBook = books.find((b: any) => b.id === bookId);

  const { data: ownerCheck } = useQuery({
    queryKey: ["books", bookId, "owner"],
    queryFn: () => checkOwner(bookId),
    enabled: !!bookId,
  });
  const isOwner = ownerCheck?.isOwner ?? false;

  const renameMut = useMutation({
    mutationFn: (name: string) => renameBook(bookId, name),
    onSuccess: () => {
      Taro.showToast({ title: "名称已更新", icon: "success" });
      setShowRename(false);
      qc.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (err: any) => {
      Taro.showToast({ title: err.message || "重命名失败", icon: "none" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteBook(bookId),
    onSuccess: () => {
      Taro.showToast({ title: "账本已删除", icon: "success" });
      qc.invalidateQueries({ queryKey: ["books"] });
      setTimeout(() => {
        Taro.navigateBack();
      }, 500);
    },
    onError: (err: any) => {
      Taro.showToast({ title: err.message || "删除失败", icon: "none" });
    },
  });

  if (!currentBook) {
    return (
      <PageLayout contentClassName="bs-content">
        <View
          style={{
            textAlign: "center",
            padding: "80rpx 0",
            color: "var(--color-text-secondary)",
          }}
        >
          <Text>账本不存在</Text>
        </View>
      </PageLayout>
    );
  }

  const cardStyle: any = {
    background: "var(--color-card)",
    borderRadius: "24rpx",
    padding: "32rpx",
    marginBottom: "24rpx",
    border: "1px solid var(--color-border)",
  };

  const sectionTitleStyle: any = {
    fontSize: "30rpx",
    fontWeight: 600,
    marginBottom: "20rpx",
  };

  const infoTextStyle: any = {
    fontSize: "26rpx",
    color: "var(--color-text-secondary)",
    marginBottom: "12rpx",
  };

  const btnStyle: any = {
    padding: "16rpx 32rpx",
    borderRadius: "16rpx",
    background: "var(--color-subtle)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "20rpx",
  };

  const btnTextStyle: any = {
    fontSize: "26rpx",
    color: "var(--color-text)",
  };

  return (
    <PageLayout contentClassName="bs-content">
      <View style={{ padding: "24rpx 32rpx" }}>
        {/* 账本信息 */}
        <View style={cardStyle}>
          <Text style={sectionTitleStyle}>账本信息</Text>
          <Text style={infoTextStyle}>名称：{currentBook.name}</Text>
          <Text style={infoTextStyle}>
            创建于{" "}
            {new Date(currentBook.created_at).toLocaleDateString("zh-CN")}
          </Text>
          {isOwner && (
            <View
              style={btnStyle}
              onClick={() => {
                setRenameValue(currentBook.name);
                setShowRename(true);
              }}
            >
              <Text style={btnTextStyle}>修改名称</Text>
            </View>
          )}
        </View>

        {/* 成员管理 */}
        {isOwner && (
          <View style={cardStyle}>
            <Text style={sectionTitleStyle}>成员管理</Text>
            <View
              style={{
                ...btnStyle,
                background: "var(--color-primary-bg)",
              }}
              onClick={() =>
                Taro.navigateTo({
                  url: `/pages/BookMembers/index?id=${bookId}`,
                })
              }
            >
              <Text style={{ ...btnTextStyle, color: "var(--color-primary)" }}>
                管理成员
              </Text>
            </View>
          </View>
        )}

        {/* 危险操作 */}
        {isOwner && (
          <View
            style={{
              ...cardStyle,
              border: "1px solid var(--color-danger)",
            }}
          >
            <Text
              style={{
                ...sectionTitleStyle,
                color: "var(--color-danger)",
              }}
            >
              危险操作
            </Text>
            <View
              style={{
                ...btnStyle,
                background: "var(--color-danger-bg)",
              }}
              onClick={() => setShowDelete(true)}
            >
              <Text style={{ ...btnTextStyle, color: "var(--color-danger)" }}>
                删除账本
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Rename dialog */}
      {showRename && (
        <View
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(44,36,22,0.35)",
          }}
          onClick={() => setShowRename(false)}
        >
          <View
            style={{
              background: "#fff",
              borderRadius: "28rpx",
              margin: "0 32rpx",
              padding: "40rpx",
              maxWidth: "600rpx",
              width: "100%",
            }}
            onClick={(e: any) => e.stopPropagation()}
          >
            <Text
              style={{
                fontSize: "30rpx",
                fontWeight: 600,
                display: "block",
                marginBottom: "24rpx",
              }}
            >
              修改账本名称
            </Text>
            <Input
              style={{
                padding: "20rpx",
                borderRadius: "16rpx",
                border: "1px solid var(--color-border)",
                fontSize: "28rpx",
                marginBottom: "32rpx",
              }}
              value={renameValue}
              onInput={(e: any) => setRenameValue(e.detail.value)}
              placeholder="输入新名称"
              placeholderStyle="color: #999"
              focus
            />
            <View style={{ display: "flex", gap: "16rpx" }}>
              <View
                style={{
                  flex: 1,
                  padding: "20rpx 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "16rpx",
                  border: "1px solid var(--color-border)",
                }}
                onClick={() => setShowRename(false)}
              >
                <Text style={{ fontSize: "28rpx" }}>取消</Text>
              </View>
              <View
                style={{
                  flex: 1,
                  padding: "20rpx 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "16rpx",
                  backgroundColor: "var(--color-primary)",
                  opacity:
                    renameMut.isPending || !renameValue.trim() ? 0.6 : 1,
                }}
                onClick={() => {
                  if (renameValue.trim())
                    renameMut.mutate(renameValue.trim());
                }}
              >
                <Text
                  style={{ fontSize: "28rpx", color: "#fff", fontWeight: 500 }}
                >
                  {renameMut.isPending ? "保存中..." : "保存"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

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
