/**
 * BookCard — 单个账本卡片
 * 三种状态：默认展示 / 重命名中 / 展开成员面板
 */
import { useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchBookMembers, inviteMember } from "../../../../services/booksApi";
import type { Book } from "../../../../types";
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

  const { data: members = [] } = useQuery({
    queryKey: ["books", "members", book.id],
    queryFn: () => fetchBookMembers(book.id),
    enabled: showMembers,
  });

  const inviteMut = useMutation({
    mutationFn: ({ email }: { email: string }) => inviteMember(book.id, email),
    onSuccess: () => setInviteEmail(""),
  });

  return (
    <View className={`book-card ${isActive ? "book-card--active" : ""}`}>
      <View className="p-3">
        <View className="flex items-center gap-2">
          <Text style={{ fontSize: "40rpx" }}>📒</Text>

          {renaming ? (
            <View className="flex-1 flex gap-1 items-center">
              <Input
                className="flex-1 px-2 book-card-input"
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
                className="text-xs text-primary font-semibold"
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
                className="text-xs text-secondary"
                onClick={() => {
                  setRenaming(false);
                  setRenameVal(book.name);
                }}
              >
                取消
              </Text>
            </View>
          ) : (
            <View className="flex-1">
              <View className="flex items-center gap-1">
                <Text className="text-sm font-semibold">{book.name}</Text>
                {isActive && (
                  <View className="book-card-badge book-card-badge--current">
                    <Text className="text-xs text-primary">当前</Text>
                  </View>
                )}
                {isDefault && (
                  <View className="book-card-badge">
                    <Text className="text-xs text-hint">默认</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs text-hint mt-1">
                {new Date(book.created_at).toLocaleDateString("zh-CN")}
              </Text>
            </View>
          )}
        </View>

        {!renaming && (
          <View className="flex gap-1 mt-2">
            {!isActive && (
              <View className="book-card-action" onClick={() => onSwitch(book)}>
                <Text className="text-xs">切换</Text>
              </View>
            )}
            <View
              className="book-card-action"
              onClick={() => {
                setRenaming(true);
                setRenameVal(book.name);
              }}
            >
              <Text className="text-xs">重命名</Text>
            </View>
            <View
              className={`book-card-action ${showMembers ? "book-card-action--active" : ""}`}
              onClick={() => setShowMembers((v) => !v)}
            >
              <Text className="text-xs">成员</Text>
            </View>
            {!isDefault && (
              <View className="book-card-action" onClick={() => onDelete(book)}>
                <Text className="text-xs text-danger">删除</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Members Panel */}
      {showMembers && (
        <View className="book-card-members">
          {members.length === 0 ? (
            <Text className="text-xs text-hint">暂无成员</Text>
          ) : (
            members.map((m: any) => (
              <View
                key={m.id}
                className="flex justify-between items-center py-1"
              >
                <Text className="text-sm">{m.username || m.email}</Text>
                {m.role === "owner" && (
                  <View className="book-card-badge book-card-badge--owner">
                    <Text className="text-xs text-primary">所有者</Text>
                  </View>
                )}
              </View>
            ))
          )}

          <View className="book-card-invite mt-2">
            {showInvite ? (
              <View className="flex gap-1">
                <Input
                  className="flex-1 px-2 book-card-input book-card-input--small"
                  value={inviteEmail}
                  onInput={(e: any) => setInviteEmail(e.detail.value)}
                  placeholder="输入用户邮箱"
                  placeholderClass="text-hint"
                  focus
                />
                <View
                  className="book-card-invite-btn"
                  onClick={() => {
                    if (inviteEmail.trim())
                      inviteMut.mutate({ email: inviteEmail.trim() });
                  }}
                >
                  <Text className="text-xs text-white">
                    {inviteMut.isPending ? "..." : "添加"}
                  </Text>
                </View>
                <View
                  className="book-card-action"
                  onClick={() => {
                    setShowInvite(false);
                    setInviteEmail("");
                  }}
                >
                  <Text className="text-xs">取消</Text>
                </View>
              </View>
            ) : (
              <View
                className="book-card-action"
                onClick={() => setShowInvite(true)}
              >
                <Text className="text-xs">+ 邀请成员</Text>
              </View>
            )}
          </View>

          {!isDefault && (
            <Text
              className="text-xs text-danger mt-2"
              onClick={() => onLeave(book)}
            >
              退出账本
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
