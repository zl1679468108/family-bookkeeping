/**
 * BookMembers — 账本成员管理
 */
import { useState, useCallback } from "react";
import { View, Text, Input } from "@tarojs/components";
import {  getCurrentInstance  } from "@tarojs/taro";
import { useQueryClient } from "@tanstack/react-query";
import { useManualQuery } from "../../hooks/useManualQuery";
import { useSubmit, toastError } from "../../hooks/useSubmit";
import {
  fetchBookMembers,
  removeMember,
  inviteMember,
  checkOwner,
  createInvitation,
} from "../../services/booksApi";
import ConfirmDialog from "../../components/ConfirmDialog";
import PageContainer from "../../components/PageContainer";
import { toastSuccess, toastInfo } from "../../utils/toast";
import { bookMemberRoleLabel, isBookOwnerRole } from "../../utils/roles";
import { userDisplayName, userInitial } from "../../utils/userDisplay";
import { ACTION_LOADING, ACTION_CANCEL } from "../../utils/actionCopy"
import {
  CONFIRM_REMOVE_TITLE,
  CONFIRM_REMOVE_TEXT,
  confirmRemoveMember,
} from "../../utils/confirmCopy";
import { SUCCESS_INVITE_COPIED, SUCCESS_INVITE_SENT, SUCCESS_MEMBER_REMOVED } from "../../utils/successCopy";
import { FORM_PEER_EMAIL_PLACEHOLDER, FORM_EMAIL_REQUIRED } from "../../utils/formCopy";
import { validateEmail } from "../../utils/validation";
import { copyToClipboard } from "../../utils/clipboard";
import { ERROR_GENERATE_FAILED, ERROR_REMOVE_FAILED, ERROR_INVITE_FAILED } from "../../utils/errorCopy";
import { EMPTY_NO_MEMBERS } from "../../utils/emptyCopy";

interface Member {
  id: string;
  email: string;
  username?: string;
  role: "owner" | "member";
}

export default function BookMembers() {
  const router = getCurrentInstance().router;
  const bookId = (router?.params?.id as string) || "";
  const qc = useQueryClient();
  const { run } = useSubmit();

  const [removeTarget, setRemoveTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const handleGenerateCode = () => {
    run(async () => {
      const res = await createInvitation(bookId);
      setInviteCode(res.code);
      void copyToClipboard(res.code);
      toastSuccess(SUCCESS_INVITE_COPIED);
    }, "生成中…").catch((err: any) => {
      toastError(err, ERROR_GENERATE_FAILED);
    });
  };

  const { data: members = [], isLoading, refetch: refetchMembers } = useManualQuery<Member[]>({
    key: `bookMembers-${bookId}`,
    queryFn: () => fetchBookMembers(bookId),
    enabled: !!bookId,
  });

  const { data: ownerCheck, isLoading: ownerLoading, refetch: refetchOwner } = useManualQuery({
    key: `bookOwner-${bookId}`,
    queryFn: () => checkOwner(bookId),
    enabled: !!bookId,
  });
  const isOwner = ownerCheck?.isOwner ?? false;

  /* 下拉刷新 */
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([refetchMembers(), refetchOwner()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchMembers, refetchOwner]);

  const handleRemove = () => {
    if (!removeTarget) return;
    run(async () => {
      await removeMember(bookId, removeTarget.userId);
      toastSuccess(SUCCESS_MEMBER_REMOVED);
      setRemoveTarget(null);
      qc.invalidateQueries({ queryKey: ["books", bookId, "members"] });
    }, "移除中…").catch((err: any) => {
      toastError(err, ERROR_REMOVE_FAILED);
      setRemoveTarget(null);
    });
  };

  const handleInvite = () => {
    const emailErr = validateEmail(inviteEmail, { emptyMessage: FORM_EMAIL_REQUIRED });
    if (emailErr) {
      toastInfo(emailErr);
      return;
    }
    run(async () => {
      await inviteMember(bookId, inviteEmail.trim());
      toastSuccess(SUCCESS_INVITE_SENT);
      setInviteEmail("");
      setShowInvite(false);
      qc.invalidateQueries({ queryKey: ["books", bookId, "members"] });
    }, "发送中…").catch((err: any) => {
      toastError(err, ERROR_INVITE_FAILED);
      setShowInvite(false);
    });
  };

  return (
    <PageContainer
      loading={isLoading || ownerLoading}
      loadingText={ACTION_LOADING}
      loadingVariant="list"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <View style={{ padding: "0" }}>
        {/* Invite section */}
        {isOwner && (
          <View
            style={{
              background: "var(--srfSoft)",
              borderRadius: "24rpx",
              padding: "24rpx",
              marginBottom: "24rpx",
              border: "1px solid var(--bd)",
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
                    border: "1px solid var(--bd)",
                    fontSize: "28rpx",
                    marginBottom: "16rpx",
                  }}
                  value={inviteEmail}
                  onInput={(e: any) => setInviteEmail(e.detail.value)}
                  placeholder={FORM_PEER_EMAIL_PLACEHOLDER}
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
                      border: "1px solid var(--bd)",
                    }}
                    onClick={() => {
                      setShowInvite(false);
                      setInviteEmail("");
                    }}
                  >
                    <Text style={{ fontSize: "28rpx" }}>{ACTION_CANCEL}</Text>
                  </View>
                  <View
                  style={{
                    flex: 1,
                    padding: "20rpx 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12rpx",
                    borderRadius: "16rpx",
                    backgroundColor: "var(--pr)",
                  }}
                  onClick={handleInvite}
                >
                    <Text
                      style={{
                        fontSize: "28rpx",
                        color: "#fff",
                        fontWeight: 500,
                      }}
                    >
                      发送邀请
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ display: "flex", flexDirection: "column", gap: "16rpx" }}>
                <View
                  style={{
                    padding: "16rpx 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "16rpx",
                    backgroundColor: "var(--prBg)",
                  }}
                  onClick={() => setShowInvite(true)}
                >
                  <Text
                    style={{
                      fontSize: "28rpx",
                      color: "var(--pr)",
                      fontWeight: 500,
                    }}
                  >
                    + 邀请成员
                  </Text>
                </View>

                <View
                  style={{
                    padding: "16rpx 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12rpx",
                    borderRadius: "16rpx",
                    backgroundColor: "var(--prBg)",
                  }}
                  onClick={handleGenerateCode}
                >
                  <Text
                    style={{
                      fontSize: "28rpx",
                      color: "var(--pr)",
                      fontWeight: 500,
                    }}
                  >
                    🔗 生成邀请码
                  </Text>
                </View>

                {inviteCode && (
                  <View
                    style={{
                      background: "var(--srfSoft)",
                      borderRadius: "24rpx",
                      padding: "24rpx",
                      border: "1px solid var(--bd)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16rpx",
                    }}
                  >
                    <Text style={{ fontSize: "22rpx", color: "var(--fg3)" }}>
                      邀请码已生成（已复制到剪贴板）
                    </Text>
                    <View
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "24rpx",
                        background: "var(--bg)",
                        borderRadius: "16rpx",
                        border: "2rpx dashed var(--pr)",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: "36rpx",
                          fontWeight: 700,
                          letterSpacing: "4rpx",
                          color: "var(--pr)",
                          fontFamily: "monospace",
                        }}
                      >
                        {inviteCode}
                      </Text>
                      <View
                        style={{
                          padding: "10rpx 28rpx",
                          borderRadius: "100rpx",
                          backgroundColor: "var(--pr)",
                          boxShadow: "0 4rpx 14rpx rgba(45, 157, 138, 0.25)",
                        }}
                        onClick={() => { void copyToClipboard(inviteCode) }}
                      >
                        <Text style={{ fontSize: "24rpx", color: "#fff", fontWeight: 500 }}>
                          复制
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: "22rpx", color: "var(--fg3)" }}>
                      将以下邀请码分享给他人，对方在「加入账本」中输入即可加入账本
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Members list */}
        {(
          <View style={{ display: "flex", flexDirection: "column", gap: "16rpx" }}>
            {members.map((m: any) => {
              const roleLabel = bookMemberRoleLabel(m.role);
              const isOwnerRole = isBookOwnerRole(m.role);
              return (
              <View
                key={m.userId || m.id}
                style={{
                  background: "var(--srfSoft)",
                  borderRadius: "24rpx",
                  padding: "24rpx",
                  border: "1px solid var(--bd)",
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
                      background: "var(--pr)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: "32rpx", fontWeight: 600 }}>
                      {userInitial(m)}
                    </Text>
                  </View>
                  <View>
                    <View style={{ display: "flex", alignItems: "center", gap: "12rpx" }}>
                      <Text style={{ fontSize: "30rpx", fontWeight: 600 }}>
                        {m.username || "未命名用户"}
                      </Text>
                      <View
                        style={{
                          background: isOwnerRole ? "var(--prBg)" : "var(--bd)",
                          padding: "4rpx 12rpx",
                          borderRadius: "8rpx",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: "22rpx",
                            color: isOwnerRole ? "var(--pr)" : "var(--fg3)",
                            fontWeight: 500,
                          }}
                        >
                          {roleLabel}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        fontSize: "24rpx",
                        color: "var(--fg3)",
                        marginTop: "4rpx",
                      }}
                    >
                      {m.email}
                    </Text>
                  </View>
                </View>

                {isOwner && !isBookOwnerRole(m.role) && (
                  <View
                    style={{
                      padding: "12rpx 24rpx",
                      borderRadius: "12rpx",
                      background: "var(--expBg)",
                    }}
                    onClick={() =>
                      setRemoveTarget({
                        userId: m.userId,
                        name: userDisplayName(m),
                      })
                    }
                  >
                    <Text
                      style={{
                        fontSize: "26rpx",
                        color: "var(--exp)",
                      }}
                    >
                      移除
                    </Text>
                  </View>
                )}
              </View>
            );
            })}

            {members.length === 0 && (
              <View
                style={{
                  textAlign: "center",
                  padding: "80rpx 0",
                  color: "var(--fg3)",
                }}
              >
                <Text>{EMPTY_NO_MEMBERS}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <ConfirmDialog
        visible={!!removeTarget}
        title={CONFIRM_REMOVE_TITLE}
        message={confirmRemoveMember(removeTarget?.name || "")}
        confirmText={CONFIRM_REMOVE_TEXT}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
      />
    </PageContainer>
  );
}
