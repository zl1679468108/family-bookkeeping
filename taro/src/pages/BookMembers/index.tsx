/**
 * BookMembers — 账本成员管理
 */
import { useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro, { getCurrentInstance } from "@tarojs/taro";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBookMembers,
  removeMember,
  inviteMember,
  checkOwner,
} from "../../services/booksApi";
import NavHeader from "../../components/NavHeader";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function BookMembers() {
  const router = getCurrentInstance().router;
  const bookId = (router?.params?.id as string) || "";
  const qc = useQueryClient();

  const [removeTarget, setRemoveTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["books", bookId, "members"],
    queryFn: () => fetchBookMembers(bookId),
    enabled: !!bookId,
  });

  const { data: ownerCheck } = useQuery({
    queryKey: ["books", bookId, "owner"],
    queryFn: () => checkOwner(bookId),
    enabled: !!bookId,
  });
  const isOwner = ownerCheck?.isOwner ?? false;

  const removeMut = useMutation({
    mutationFn: (userId: string) => removeMember(bookId, userId),
    onSuccess: () => {
      Taro.showToast({ title: "成员已移除", icon: "success" });
      setRemoveTarget(null);
      qc.invalidateQueries({ queryKey: ["books", bookId, "members"] });
    },
    onError: (err: any) => {
      Taro.showToast({ title: err.message || "移除失败", icon: "none" });
    },
  });

  const inviteMut = useMutation({
    mutationFn: (email: string) => inviteMember(bookId, email),
    onSuccess: () => {
      Taro.showToast({ title: "邀请已发送", icon: "success" });
      setInviteEmail("");
      setShowInvite(false);
      qc.invalidateQueries({ queryKey: ["books", bookId, "members"] });
    },
    onError: (err: any) => {
      Taro.showToast({ title: err.message || "邀请失败", icon: "none" });
    },
  });

  const handleBack = () => {
    Taro.navigateBack();
  };

  return (
    <View className="min-h-screen bg-bg flex flex-col">
      <NavHeader
        title="成员管理"
        leftContent={
          <View onClick={handleBack}>
            <Text style={{ fontSize: "32rpx", color: "var(--color-text)" }}>
              ←
            </Text>
          </View>
        }
      />

      <View style={{ padding: "24rpx" }}>
        {/* Invite section */}
        {isOwner && (
          <View
            style={{
              background: "var(--color-card)",
              borderRadius: "24rpx",
              padding: "24rpx",
              marginBottom: "24rpx",
              border: "1px solid var(--color-border)",
            }}
          >
            {showInvite ? (
              <View>
                <Text
                  style={{
                    fontSize: "28rpx",
                    fontWeight: 600,
                    marginBottom: "16rpx",
                  }}
                >
                  邀请成员
                </Text>
                <Input
                  style={{
                    padding: "20rpx",
                    borderRadius: "16rpx",
                    border: "1px solid var(--color-border)",
                    fontSize: "28rpx",
                    marginBottom: "16rpx",
                  }}
                  value={inviteEmail}
                  onInput={(e: any) => setInviteEmail(e.detail.value)}
                  placeholder="输入用户邮箱"
                  placeholderStyle="color: #999"
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
                    onClick={() => {
                      setShowInvite(false);
                      setInviteEmail("");
                    }}
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
                      opacity: inviteMut.isPending ? 0.6 : 1,
                    }}
                    onClick={() => {
                      if (inviteEmail.trim())
                        inviteMut.mutate(inviteEmail.trim());
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "28rpx",
                        color: "#fff",
                        fontWeight: 500,
                      }}
                    >
                      {inviteMut.isPending ? "邀请中..." : "确认邀请"}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View
                style={{
                  padding: "16rpx 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "16rpx",
                  backgroundColor: "var(--color-primary-bg)",
                }}
                onClick={() => setShowInvite(true)}
              >
                <Text
                  style={{
                    fontSize: "28rpx",
                    color: "var(--color-primary)",
                    fontWeight: 500,
                  }}
                >
                  + 邀请成员
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Members list */}
        {isLoading ? (
          <View
            style={{
              textAlign: "center",
              padding: "80rpx 0",
              color: "var(--color-text-secondary)",
            }}
          >
            <Text>加载中...</Text>
          </View>
        ) : (
          <View style={{ display: "flex", flexDirection: "column", gap: "16rpx" }}>
            {members.map((m: any) => (
              <View
                key={m.userId || m.id}
                style={{
                  background: "var(--color-card)",
                  borderRadius: "24rpx",
                  padding: "24rpx",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ display: "flex", alignItems: "center", gap: "20rpx" }}>
                  <View
                    style={{
                      width: "72rpx",
                      height: "72rpx",
                      borderRadius: "50%",
                      background: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: "32rpx", fontWeight: 600 }}>
                      {(m.username || m.email || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <View style={{ display: "flex", alignItems: "center", gap: "12rpx" }}>
                      <Text style={{ fontSize: "30rpx", fontWeight: 600 }}>
                        {m.username || "未命名用户"}
                      </Text>
                      {m.role === "owner" && (
                        <View
                          style={{
                            background: "var(--color-primary-bg)",
                            padding: "4rpx 12rpx",
                            borderRadius: "8rpx",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: "22rpx",
                              color: "var(--color-primary)",
                              fontWeight: 500,
                            }}
                          >
                            所有者
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: "24rpx",
                        color: "var(--color-text-secondary)",
                        marginTop: "4rpx",
                      }}
                    >
                      {m.email}
                    </Text>
                  </View>
                </View>

                {isOwner && m.role !== "owner" && (
                  <View
                    style={{
                      padding: "12rpx 24rpx",
                      borderRadius: "12rpx",
                      background: "var(--color-danger-bg)",
                    }}
                    onClick={() =>
                      setRemoveTarget({
                        userId: m.userId,
                        name: m.username || m.email,
                      })
                    }
                  >
                    <Text
                      style={{
                        fontSize: "26rpx",
                        color: "var(--color-danger)",
                      }}
                    >
                      移除
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {members.length === 0 && (
              <View
                style={{
                  textAlign: "center",
                  padding: "80rpx 0",
                  color: "var(--color-text-secondary)",
                }}
              >
                <Text>暂无成员</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <ConfirmDialog
        visible={!!removeTarget}
        title="确认移除"
        message={`确定要移除成员「${removeTarget?.name}」吗？`}
        confirmText="确认移除"
        confirmLoading={removeMut.isPending}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && removeMut.mutate(removeTarget.userId)}
      />
    </View>
  );
}
