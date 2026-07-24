/**
 * Books — 账本管理
 * 列表 + 账本详情 Sheet（成员/邀请/邀请码/编辑/删除）+ 新建 + 使用邀请码加入
 * 点击账本卡片 → 弹出底部详情 Sheet（含所有管理操作）
 */
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import PageContainer from "../../components/PageContainer";
import { Button, EmptyState, FooterActions } from "../../components/ui";
import ConfirmDialog from "../../components/ConfirmDialog";
import SheetHeader from "../../components/SheetHeader";
import {
  fetchBooks,
  fetchBookMembers,
  inviteMember,
  createInvitation,
  deleteBook,
  removeMember,
  joinByInvitation,
} from "../../services/booksApi";
import { useManualQuery } from "../../hooks/useManualQuery";
import { useSubmit, toastError } from "../../hooks/useSubmit";
import { useBookContext } from "../../context/BookContext";
import { useAuth } from "../../context/AuthContext";
import { renderBookIconSvg } from "../../utils/bookIcons";
import type { Book } from "../../types";
import "./index.scss";
import { toastSuccess, toastInfo } from "../../utils/toast";
import { bookMemberRoleLabel, isBookOwnerRole } from "../../utils/roles";
import { INVITE_CODE_HELP_LABEL, INVITE_CODE_HELP_BODY } from "../../utils/inviteCopy";
import { userDisplayName } from "../../utils/userDisplay";
import { ACTION_DELETING, ACTION_LOADING } from "../../utils/actionCopy";
import {
  CONFIRM_REMOVE_TITLE,
  confirmDeleteBook,
  confirmRemoveMember,
} from "../../utils/confirmCopy";
import { FORM_ALREADY_CURRENT_BOOK, FORM_EMAIL_REQUIRED, FORM_INVITE_CODE_MIN, FORM_PEER_EMAIL_PLACEHOLDER } from "../../utils/formCopy";
import {
  SUCCESS_JOINED,
  SUCCESS_INVITE_SENT,
  SUCCESS_INVITE_CODE_GENERATED,
  SUCCESS_INVITE_COPIED,
  SUCCESS_MEMBER_REMOVED,
  successEntityDeleted,
  successSwitchedBook,
} from "../../utils/successCopy";
import { copyToClipboard } from "../../utils/clipboard";
import { entityCreateButton } from "../../utils/entityCopy";
import { DELETE_FAILED } from "../../utils/uploadCopy";
import { ERROR_JOIN_FAILED, ERROR_INVITE_EMAIL, ERROR_GENERATE_FAILED, ERROR_REMOVE_FAILED } from "../../utils/errorCopy";
import Icon, { ICON_COLOR } from "../../components/Icon";

type BookRow = Book & { is_default?: boolean };

interface Member {
  id: string;
  email: string;
  username?: string;
  role: "owner" | "member";
}

const isCustomIcon = (val: string | undefined): boolean =>
  !!val && (val.startsWith("http://") || val.startsWith("https://"));

// 格式化北京时间字符串为可读日期
const fmtDate = (s: string) => {
  if (!s) return "";
  try {
    const d = new Date(s);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return s;
  }
};

export default function BooksPage() {
  const { currentBook, switchBook } = useBookContext();
  const { user } = useAuth();
  const { run } = useSubmit();

  // --- 使用邀请码加入 ---
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  // 键盘高度：输入框聚焦时软键盘会盖住底部页脚，需把弹窗抬到键盘上方
  const [kbdHeight, setKbdHeight] = useState(0);

  const handleJoinSubmit = () => {
    const code = joinCode.trim();
    if (code.length < 4) {
      toastInfo(FORM_INVITE_CODE_MIN);
      return;
    }
    run(async () => {
      await joinByInvitation(code.toUpperCase());
      setShowJoinSheet(false);
      setJoinCode("");
      toastSuccess(SUCCESS_JOINED);
      refetch();
    }, "加入中…").catch((err: any) => {
      toastError(err, ERROR_JOIN_FAILED);
    });
  };

  const closeJoinSheet = useCallback(() => {
    setShowJoinSheet(false);
    setJoinCode("");
  }, []);

  // 打开 sheet 时强制重置状态，防止上次异常残留；并监听键盘高度把页脚抬到键盘上方
  useEffect(() => {
    if (!showJoinSheet) return;
    setJoinCode("");
    const onKbd = (res: any) => setKbdHeight(res?.height || 0);
    Taro.onKeyboardHeightChange(onKbd);
    return () => {
      Taro.offKeyboardHeightChange(onKbd);
      setKbdHeight(0);
    };
  }, [showJoinSheet]);

  // --- 数据请求 ---
  const { data: books, isLoading, refetch } = useManualQuery<BookRow[]>({
    key: "books",
    queryFn: () => fetchBooks(),
  });

  /* 首次显示已由 useManualQuery 的 mount effect 请求过，若已拿到数据则跳过，避免重复请求 */
  const isFirstShow = useRef(true);
  useDidShow(() => {
    if (isFirstShow.current) {
      isFirstShow.current = false;
      if ((books || []).length > 0) return;
    }
    refetch();
  });

  /* 下拉刷新 */
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // --- 账本详情 Sheet ---
  const [detailBook, setDetailBook] = useState<BookRow | null>(null);
  const [detailMode, setDetailMode] = useState<"info" | "invite" | "inviteCode">("info");

  // 成员列表（使用 useManualQuery：Taro 下 useQuery enabled 激活不可靠）
  const {
    data: members,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useManualQuery<Member[]>({
    key: `bookMembers-${detailBook?.id || "none"}-${detailMode}`,
    queryFn: () => fetchBookMembers(detailBook!.id),
    enabled: !!detailBook && detailMode === "info",
  });

  // Owner 检查：直接比对 owner_id，避免多余 API 且与 PC 行为一致
  const isOwner = useMemo(
    () => !!detailBook?.owner_id && detailBook.owner_id === user?.id,
    [detailBook?.owner_id, user?.id],
  );

  // 打开详情
  const handleCardTap = useCallback((book: BookRow) => {
    setDetailBook(book);
    setDetailMode("info");
  }, []);

  const closeDetail = () => {
    setDetailBook(null);
    setDetailMode("info");
    setInviteEmail("");
    setInviteCodeData(null);
  };

  // --- 邀请成员 ---
  const [inviteEmail, setInviteEmail] = useState("");

  const handleInviteSubmit = () => {
    const email = inviteEmail.trim();
    if (!email) {
      toastInfo(FORM_EMAIL_REQUIRED);
      return;
    }
    run(async () => {
      await inviteMember(detailBook!.id, email);
      toastSuccess(SUCCESS_INVITE_SENT);
      setInviteEmail("");
      setDetailMode("info");
      refetchMembers();
      refetch(); // 刷新列表（成员数可能变化）
    }, "发送中…").catch((err: any) => {
      toastError(err, ERROR_INVITE_EMAIL);
      setInviteEmail("");
      setDetailMode("info");
    });
  };

  // --- 生成邀请码 ---
  const [inviteCodeData, setInviteCodeData] = useState<{
    code: string;
    expires_at: string;
    book_name: string;
  } | null>(null);

  const handleGenerateCode = () => {
    run(async () => {
      const data = await createInvitation(detailBook!.id);
      setInviteCodeData(data);
      toastSuccess(SUCCESS_INVITE_CODE_GENERATED);
    }, "生成中…").catch((err: any) => {
      toastError(err, ERROR_GENERATE_FAILED);
    });
  };

  const handleCopyCode = async () => {
    if (inviteCodeData?.code) {
      await copyToClipboard(inviteCodeData.code);
      toastSuccess(SUCCESS_INVITE_COPIED);
    }
  };

  // --- 删除账本 ---
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingBook, setDeletingBook] = useState<BookRow | null>(null);
  const [switchTarget, setSwitchTarget] = useState<BookRow | null>(null);
  const [removingMember, setRemovingMember] = useState<Member | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const handleDelete = () => {
    const target = deletingBook || detailBook;
    if (!target) return;
    run(async () => {
      await deleteBook(target.id);
      toastSuccess(successEntityDeleted("账本"));
      setDeletingBook(null);
      closeDetail();
      refetch();
    }, ACTION_DELETING).catch((err: any) => {
      toastError(err, DELETE_FAILED);
      setDeletingBook(null);
    });
  };

  const handleRemoveMember = () => {
    if (!removingMember || !detailBook) return;
    run(async () => {
      await removeMember(detailBook.id, removingMember.id);
      toastSuccess(SUCCESS_MEMBER_REMOVED);
      setRemovingMember(null);
      setShowRemoveConfirm(false);
      refetchMembers();
      refetch();
    }, "移除中…").catch((err: any) => {
      toastError(err, ERROR_REMOVE_FAILED);
      setRemovingMember(null);
      setShowRemoveConfirm(false);
    });
  };

  // --- 切换 / 新建 ---
  const handleSwitch = (book: BookRow) => {
    if (currentBook && String(currentBook.id) === String(book.id)) {
      toastInfo(FORM_ALREADY_CURRENT_BOOK);
      return;
    }
    switchBook(book);
    toastSuccess(successSwitchedBook(book.name));
  };

  const handleConfirmSwitch = () => {
    if (switchTarget) {
      handleSwitch(switchTarget);
      setSwitchTarget(null);
    }
  };

  const handleAdd = () => {
    Taro.navigateTo({ url: "/pages/BookSettings/index" });
  };

  const handleEdit = () => {
    if (!detailBook) return;
    closeDetail();
    setTimeout(() => {
      Taro.navigateTo({
        url: `/pages/BookSettings/index?id=${detailBook.id}`,
        success: (res) => {
          res.eventChannel?.emit("bookData", detailBook);
        },
      });
    }, 300);
  };

  const currentId = currentBook?.id;

  return (
    <PageContainer
      contentClassName="bk-content"
      loading={isLoading}
      loadingText={ACTION_LOADING}
      loadingVariant="cards"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      {/* ====== 页面顶部栏 ====== */}
      <View className="bk-page-header">
        <View /> {/* 左侧占位 */}
        <View className="bk-page-actions">
          <Button variant="outline" size="sm" onClick={() => setShowJoinSheet(true)}>
            使用邀请码加入
          </Button>
          <Button variant="primary" size="sm" onClick={handleAdd}>
            {entityCreateButton("账本", "+")}
          </Button>
        </View>
      </View>

      {/* ====== 账本列表（双列网格）====== */}
      {!books || books.length === 0 ? (
        <View className="bk-empty">
          <EmptyState description="暂无账本，点击右上角新建" />
        </View>
      ) : (
        <View className="bk-grid">
          {books.map((book) => {
            const isActive = String(currentId) === String(book.id);
            return (
              <View
                key={book.id}
                className={`bk-card ${isActive ? "bk-card--active" : ""}`}
                onClick={() => handleCardTap(book)}
              >
                {/* 图标 + 名称 */}
                <View className="bk-card__head">
                  <View className="bk-card__icon-wrap">
                    {isCustomIcon(book.icon) ? (
                      <Text>图</Text>
                    ) : (
                      <Image
                        src={renderBookIconSvg(book.icon, 28, "#1a1c19")}
                        mode="aspectFit"
                        style={{ width: "28px", height: "28px", display: "block" }}
                      />
                    )}
                  </View>
                  <Text className="bk-card__name">{book.name}</Text>
                </View>

                {/* 统计行：成员数 + 交易数 */}
                <View className="bk-card__stats">
                  <Text className="bk-card__stat">{book.member_count ?? 0} 成员</Text>
                  <Text className="bk-card__stat">{book.txn_count ?? 0} 笔交易</Text>
                </View>

                {/* 分割线 */}
                <View className="bk-card__divider" />

                {book.description && (
                  <Text className="bk-card__meta-line">{book.description}</Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* ====== 使用邀请码加入 Sheet ====== */}
      {showJoinSheet && (
        <View className="bk-mask" onClick={closeJoinSheet}>
          <View
            className="bk-sheet"
            style={kbdHeight ? { paddingBottom: `${kbdHeight}px` } : undefined}
            onClick={(e: any) => e.stopPropagation()}
          >
            <SheetHeader title="使用邀请码加入账本" onClose={closeJoinSheet} />

            <View className="bk-sheet__body">
              <View className="bk-form-row">
                <Text className="bk-form-label bk-form-label--required">邀请码</Text>
                <Input
                  className="bk-form-input"
                  placeholder="例如 A3F8K2"
                  maxlength={32}
                  value={joinCode}
                  onInput={(e: any) => setJoinCode(e.detail.value.toUpperCase())}
                />
              </View>
              <View className="bk-join-hint">
                <Text>
                  <Text className="bk-join-hint__bold">{INVITE_CODE_HELP_LABEL}</Text>
                  {INVITE_CODE_HELP_BODY}
                </Text>
              </View>
            </View>

            <View className="bk-sheet__footer">
              <FooterActions align="stretch">
                <Button variant="default" size="lg" block onClick={closeJoinSheet}>
                  取消
                </Button>
                <Button variant="primary" size="lg" block onClick={handleJoinSubmit}>
                  加入账本
                </Button>
              </FooterActions>
            </View>

            <View className="bk-sheet__safe" />
          </View>
        </View>
      )}

      {/* ====== 账本详情 Sheet ====== */}
      {detailBook && (
        <View className="bk-mask" onClick={closeDetail}>
          <View className="bk-detail-sheet" onClick={(e: any) => e.stopPropagation()}>
          {/* 自定义详情 Sheet Header：与 PC 端 GlobalModal 一致，标题居左、关闭居右 */}
          <View className="bk-detail-header">
            <View className="bk-detail-header__left">
              {detailMode !== "info" && (
                <View className="bk-detail-header__back" onClick={() => setDetailMode("info")}>
                  <Text>←</Text>
                </View>
              )}
              <Text className="bk-detail-header__title" numberOfLines={1}>
                {detailMode === "info"
                  ? "账本详情"
                  : detailMode === "invite"
                    ? "邀请成员"
                    : "邀请码"}
              </Text>
            </View>
            <View className="bk-detail-header__close" onClick={closeDetail}>
              <Icon name="close" size={32} color={ICON_COLOR.muted} />
            </View>
          </View>

          <View className="bk-detail-body">
              {/* ---- 基础信息模式 ---- */}
              {detailMode === "info" && (
                <>
                  {/* 账本信息头部 */}
                  <View className="bk-detail-info">
                    <View className="bk-detail-emoji">
                      {isCustomIcon(detailBook.icon) ? (
                        <Text style={{ fontSize: "36rpx" }}>图</Text>
                      ) : (
                        <Image
                          src={renderBookIconSvg(detailBook.icon, 40, "#1a1c19")}
                          mode="aspectFit"
                          style={{ width: "40px", height: "40px", display: "block" }}
                        />
                      )}
                    </View>
                    <View className="bk-detail-meta">
                      <Text className="bk-detail-name">{detailBook.name}</Text>
                      {detailBook.description && (
                        <Text className="bk-detail-desc">{detailBook.description}</Text>
                      )}
                    </View>
                  </View>

                  {/* 统计信息 */}
                  <View className="bk-detail-stats">
                    <View className="bk-detail-stat-item">
                      <Text className="bk-detail-stat-label">成员</Text>
                      <Text className="bk-detail-stat-value">{detailBook.member_count ?? 0} 人</Text>
                    </View>
                    <View className="bk-detail-stat-item">
                      <Text className="bk-detail-stat-label">交易笔数</Text>
                      <Text className="bk-detail-stat-value">{detailBook.txn_count ?? 0} 笔</Text>
                    </View>
                  </View>
                  <View className="bk-detail-stats">
                    <View className="bk-detail-stat-item">
                      <Text className="bk-detail-stat-label">创建时间</Text>
                      <Text className="bk-detail-stat-value">{fmtDate(detailBook.created_at)}</Text>
                    </View>
                    <View className="bk-detail-stat-item">
                      <Text className="bk-detail-stat-label">更新时间</Text>
                      <Text className="bk-detail-stat-value">{fmtDate(detailBook.updated_at)}</Text>
                    </View>
                  </View>
                  <View className="bk-detail-stats">
                    <View className="bk-detail-stat-item bk-detail-stat-item--full">
                      <Text className="bk-detail-stat-label">账主 ID</Text>
                      <Text className="bk-detail-stat-value bk-detail-stat-value--mono">{detailBook.owner_id ?? "-"}</Text>
                    </View>
                  </View>

                  {/* 分隔线 */}
                  <View className="bk-detail-divider" />

                  {/* 成员列表 */}
                  <Text className="bk-detail-section-title">成员明细</Text>
                  {membersLoading ? (
                    <View className="bk-member-skeleton">
                      <View className="bk-member-skeleton__item" />
                      <View className="bk-member-skeleton__item" />
                      <View className="bk-member-skeleton__item" />
                    </View>
                  ) : !members || members.length === 0 ? (
                    <Text className="bk-detail-empty">暂无成员</Text>
                  ) : (
                    <View className="bk-member-list">
                      {(members as Member[]).map((m) => (
                        <View key={m.id} className="bk-member-item">
                          <View className="bk-member-info">
                            <Text className="bk-member-name">{userDisplayName(m)}</Text>
                            <Text className="bk-member-email">{m.email}</Text>
                          </View>
                          <View className="bk-member-role">
                            <Text
                              className={`bk-member-role-tag ${isBookOwnerRole(m.role) ? "bk-member-role-tag--owner" : ""}`}
                            >
                              {bookMemberRoleLabel(m.role)}
                            </Text>
                            {isOwner && !isBookOwnerRole(m.role) && m.id !== user?.id && (
                              <View
                                className="bk-member-remove"
                                onClick={() => {
                                  setRemovingMember(m);
                                  setShowRemoveConfirm(true);
                                }}
                              >
                                <Icon name="close" size={28} color={ICON_COLOR.muted} />
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* ---- 邀请成员模式 ---- */}
              {detailMode === "invite" && (
                <View className="bk-invite-form">
                  <View className="bk-form-row">
                    <Text className="bk-form-label bk-form-label--required">邮箱地址</Text>
                    <Input
                      className="bk-form-input bk-form-input--underlined"
                      placeholder={FORM_PEER_EMAIL_PLACEHOLDER}
                      value={inviteEmail}
                      onInput={(e: any) => setInviteEmail(e.detail.value)}
                      type="text"
                    />
                  </View>
                </View>
              )}

              {/* ---- 生成邀请码模式 ---- */}
              {detailMode === "inviteCode" && (
                <>
                  {!inviteCodeData ? (
                    <View className="bk-invite-generate">
                      <Text className="bk-invite-generate__hint">
                        将以下邀请码分享给他人，对方在「加入账本」中输入邀请码即可加入账本
                      </Text>
                      <Button
                        variant="primary"
                        size="md"
                        block
                        className="bk-invite-generate__btn"
                        onClick={handleGenerateCode}
                      >
                        生成邀请码
                      </Button>
                    </View>
                  ) : (
                    <View className="bk-invite-code-result">
                      <View className="bk-invite-code-card">
                        <View className="bk-invite-code-box">
                          <Text className="bk-invite-code">{inviteCodeData.code}</Text>
                          <View className="bk-invite-code-copy" onClick={handleCopyCode}>
                            <Text className="bk-invite-code-copy__label">复制邀请码</Text>
                          </View>
                        </View>
                        <Text className="bk-invite-hint">
                          有效期至：{fmtDate(inviteCodeData.expires_at)}
                        </Text>
                        <Text className="bk-invite-tip">
                          将以下邀请码分享给他人，对方在「加入账本」中输入邀请码即可加入账本
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* 操作按钮区 — 与 PC 端 GlobalModal footer 一致：邀请/邀请码/编辑/删除/切换 */}
            {detailMode === "info" && (
              <View className="bk-detail-actions bk-detail-actions--sticky">
                {isOwner ? (
                  <>
                    <Button variant="default" size="md" onClick={() => setDetailMode("invite")}>
                      邀请成员
                    </Button>
                    <Button variant="default" size="md" onClick={() => setDetailMode("inviteCode")}>
                      生成邀请码
                    </Button>
                    <Button variant="default" size="md" onClick={handleEdit}>
                      编辑
                    </Button>
                    {detailBook.name !== "默认账本" && (
                      <Button
                        variant="danger"
                        size="md"
                        onClick={() => {
                          if (detailBook) {
                            setDeletingBook(detailBook);
                            closeDetail();
                            setShowDeleteConfirm(true);
                          }
                        }}
                      >
                        删除
                      </Button>
                    )}
                  </>
                ) : (
                  <Button variant="default" size="md" onClick={handleEdit}>
                    查看详情
                  </Button>
                )}
                {currentBook && String(currentBook.id) !== String(detailBook?.id) && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setSwitchTarget(detailBook!);
                      closeDetail();
                    }}
                  >
                    切换到此账本
                  </Button>
                )}
              </View>
            )}

            {detailMode === "invite" && (
              <View className="bk-detail-actions bk-detail-actions--sticky bk-detail-actions--single">
                <Button variant="primary" size="md" block onClick={handleInviteSubmit}>
                  发送邀请
                </Button>
              </View>
            )}

            {detailMode === "inviteCode" && (
              <View className="bk-detail-safe" />
            )}

            <View className="bk-detail-safe" />
          </View>
        </View>
      )}

      {/* 切换账本确认弹窗 */}
      {switchTarget && (
        <View className="bk-switch-mask" onClick={() => setSwitchTarget(null)}>
          <View className="bk-switch-dialog" onClick={(e: any) => e.stopPropagation()}>
            <Text className="bk-switch-title">切换账本</Text>
            <Text className="bk-switch-desc">
              切换到账本 <Text className="bk-switch-name">{switchTarget.name}</Text>{" "}
              后，以下模块数据将切换为该账本的维度：
            </Text>
            <View className="bk-switch-list">
              <View className="bk-switch-item">
                <Text className="bk-switch-label">首页</Text>
                <Text className="bk-switch-text"> — 收支概览与预算进度</Text>
              </View>
              <View className="bk-switch-item">
                <Text className="bk-switch-label">流水</Text>
                <Text className="bk-switch-text"> — 交易记录列表</Text>
              </View>
              <View className="bk-switch-item">
                <Text className="bk-switch-label">工作台</Text>
                <Text className="bk-switch-text"> — 账本 / 分类 / 模板 / 预算</Text>
              </View>
              <View className="bk-switch-item">
                <Text className="bk-switch-label">我的</Text>
                <Text className="bk-switch-text"> — 个人设置与账本入口</Text>
              </View>
            </View>
            <Text className="bk-switch-current">当前账本：{currentBook?.name}</Text>
            <View className="bk-switch-actions">
              <FooterActions align="stretch">
                <Button variant="default" size="lg" block onClick={() => setSwitchTarget(null)}>
                  取消
                </Button>
                <Button variant="primary" size="lg" block onClick={handleConfirmSwitch}>
                  确认切换
                </Button>
              </FooterActions>
            </View>
          </View>
        </View>
      )}

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="删除账本"
        message={confirmDeleteBook(deletingBook?.name || detailBook?.name || "该账本")}
        confirmText="删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingBook(null);
        }}
      />

      {/* 移除成员确认弹窗 */}
      <ConfirmDialog
        visible={showRemoveConfirm}
        title={CONFIRM_REMOVE_TITLE}
        message={confirmRemoveMember(userDisplayName(removingMember))}
        confirmText="移除"
        danger
        onConfirm={handleRemoveMember}
        onCancel={() => {
          setShowRemoveConfirm(false);
          setRemovingMember(null);
        }}
      />
    </PageContainer>
  );
}
