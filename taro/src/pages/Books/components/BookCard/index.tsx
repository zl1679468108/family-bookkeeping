/**
 * BookCard — 单个账本卡片
 * 三种状态：默认展示 / 重命名中 / 展开成员面板
 */
import { useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { fetchBookMembers, inviteMember } from "../../../../services/booksApi";
import { useManualQuery } from "../../../../hooks/useManualQuery";
import type { Book } from "../../../../types";
import { Button } from "../../../../components/ui";
import "./index.scss";

interface BookCardProps {
  book: Book;
  isActive: boolean;
  isDefault: boolean;
  onSwitch: (book: Book) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (book: Book) => void;
  onLeave: (book: Book) => void;
}

export default function BookCard({
  book,
  isActive,
  isDefault,
  onSwitch,
  onRename,
  onDelete,
  onLeave,
}: BookCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(book.name);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: members = [] } = useManualQuery({
    key: `book-members-${book.id}`,
    queryFn: () => fetchBookMembers(book.id),
    enabled: showMembers,
  });

  const [inviting, setInviting] = useState(false);
  const handleInvite = () => {
    if (!inviteEmail.trim() || inviting) return;
    Taro.hideKeyboard();
    setInviting(true);
    inviteMember(book.id, inviteEmail.trim())
      .then(() => {
        setInviteEmail("");
        setInviting(false);
        Taro.showToast({ title: "邀请已发送", icon: "success" });
      })
      .catch((err: any) => {
        Taro.showToast({
          title: err?.message || "邀请失败",
          icon: "error",
        });
        // 失败时关闭邀请输入，避免卡住
        setShowInvite(false);
        setInviteEmail("");
        setInviting(false);
      });
    setTimeout(() => { setInviting(false); setShowInvite(false); setInviteEmail(""); }, 4000);
  };

  return (
    <View className={`book-card ${isActive ? "book-card--active" : ""}`}>
      <View className="book-card__body">
        <View className="book-card__row">
          <Text className="book-card__icon">📒</Text>

          {renaming ? (
            <View className="book-card__rename-row">
              <Input
                className="book-card__rename-input"
                value={renameVal}
                onInput={(e: any) => setRenameVal(e.detail.value)}
                focus
                onConfirm={() => {
                  if (renameVal.trim()) {
                    onRename(book.id, renameVal.trim());
                    setRenaming(false);
                  }
                }}
              />
              <Text
                className="book-card__rename-save"
                onClick={() => {
                  if (renameVal.trim()) {
                    onRename(book.id, renameVal.trim());
                    setRenaming(false);
                  }
                }}
              >
                保存
              </Text>
              <Text
                className="book-card__rename-cancel"
                onClick={() => {
                  setRenaming(false);
                  setRenameVal(book.name);
                }}
              >
                取消
              </Text>
            </View>
          ) : (
            <View className="book-card__header">
              <View className="book-card__title-row">
                <Text className="book-card__title">{book.name}</Text>
                {isActive && (
                  <View className="book-card__badge book-card__badge--current">
                    <Text className="book-card__badge-text">当前</Text>
                  </View>
                )}
                {isDefault && (
                  <View className="book-card__badge book-card__badge--default">
                    <Text className="book-card__badge-text">默认</Text>
                  </View>
                )}
              </View>
              <Text className="book-card__date">
                {new Date(book.created_at).toLocaleDateString("zh-CN")}
              </Text>
            </View>
          )}
        </View>

        {!renaming && (
          <View className="book-card__actions">
            {!isActive && (
              <View className="book-card__action" onClick={() => onSwitch(book)}>
                <Text className="book-card__action-text">切换</Text>
              </View>
            )}
            <View
              className="book-card__action"
              onClick={() => {
                setRenaming(true);
                setRenameVal(book.name);
              }}
            >
              <Text className="book-card__action-text">重命名</Text>
            </View>
            <View
              className={`book-card__action ${showMembers ? "book-card__action--active" : ""}`}
              onClick={() => setShowMembers((v) => !v)}
            >
              <Text className="book-card__action-text">成员</Text>
            </View>
            <View
              className="book-card__action"
              onClick={() =>
                Taro.navigateTo({
                  url: `/pages/BookSettings/index?id=${book.id}`,
                })
              }
            >
              <Text className="book-card__action-text">设置</Text>
            </View>
            {!isDefault && (
              <View className="book-card__action" onClick={() => onDelete(book)}>
                <Text className="book-card__action-text book-card__action-text--danger">
                  删除
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Members Panel */}
      {showMembers && (
        <View className="book-card__members">
          {members.length === 0 ? (
            <Text className="book-card__members-empty">暂无成员</Text>
          ) : (
            members.map((m: any) => (
              <View key={m.id} className="book-card__member">
                <Text className="book-card__member-name">
                  {m.username || m.email}
                </Text>
                {m.role === "owner" && (
                  <View className="book-card__badge book-card__badge--current">
                    <Text className="book-card__badge-text">所有者</Text>
                  </View>
                )}
              </View>
            ))
          )}

          <View className="book-card__invite">
            {showInvite ? (
              <View className="book-card__invite-row">
                <Input
                  className="book-card__invite-input"
                  value={inviteEmail}
                  onInput={(e: any) => setInviteEmail(e.detail.value)}
                  placeholder="输入用户邮箱"
                  placeholderClass="book-card__invite-input-placeholder"
                  focus
                />
                <Button
                  variant="primary"
                  size="sm"
                  loading={inviting}
                  className="book-card__invite-btn"
                  onClick={handleInvite}
                >
                  {inviting ? "添加中" : "添加"}
                </Button>
                <View
                  className="book-card__action"
                  onClick={() => {
                    setShowInvite(false);
                    setInviteEmail("");
                  }}
                >
                  <Text className="book-card__action-text">取消</Text>
                </View>
              </View>
            ) : (
              <View
                className="book-card__action"
                onClick={() => setShowInvite(true)}
              >
                <Text className="book-card__action-text">+ 邀请成员</Text>
              </View>
            )}
          </View>

          {!isDefault && (
            <Text className="book-card__leave" onClick={() => onLeave(book)}>
              退出账本
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
