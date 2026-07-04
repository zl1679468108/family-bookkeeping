/**
 * Books — 账本管理 v2
 * 对齐 PC：账本列表、切换账本、新增、编辑、删除 + 成员管理（邀请/生成邀请码/移除成员）
 */
import { useState } from "react";
import { View, Text, Input, ScrollView, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import PageLayout from "../../components/PageLayout";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";
import { AppSection, PageHero } from "../../components/ui";
import { apiGet, apiPost, apiPut, apiDelete, setStoredBookId } from "../../services/api";
import {
  fetchBookMembers,
  inviteMember,
  createInvitation,
  removeMember,
  leaveBook,
  joinByInvitation,
} from "../../services/booksApi";
import { useManualQuery } from "../../hooks/useManualQuery";
import { useBookContext } from "../../context/BookContext";
import { BOOK_ICONS, renderBookIconSvg } from "../../utils/bookIcons";
import { uploadIcon } from "../../services/iconsApi";
import type { Book } from "../../types";
import "./index.scss";

// Backend may return is_default flag; extend the base Book type for this page
type BookRow = Book & { is_default?: boolean };

export default function BooksPage() {
  const qc = useQueryClient();
  const { currentBook, switchBook } = useBookContext();

  // 新增/编辑弹窗
  const [showSheet, setShowSheet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: "default", // 使用 PC 端的 key；也可能是自定义图标 URL
  });
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // 自定义图标上传（与 PC 端一致：上传到 /icons，得到 URL 后保存到 icon 字段）
  const handleUploadCustomIcon = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    })
      .then((res) => {
        const path = res.tempFilePaths && res.tempFilePaths[0];
        if (!path) return;
        setUploadingIcon(true);
        uploadIcon(path, "book")
          .then((result: any) => {
            const url = result?.icon_url || result?.url;
            if (url) {
              setForm((p) => ({ ...p, icon: url }));
              Taro.showToast({ title: "图标已上传", icon: "success" });
            } else {
              Taro.showToast({ title: "上传失败", icon: "none" });
            }
          })
          .catch(() => {
            Taro.showToast({ title: "上传失败", icon: "none" });
          })
          .finally(() => setUploadingIcon(false));
      })
      .catch(() => {});
  };

  // 判断当前 icon 是否为 URL（自定义图标）
  const isCustomIcon = (val: string | undefined): boolean =>
    !!val && (val.startsWith("http://") || val.startsWith("https://"));

  // 删除确认
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 账本详情弹窗
  const [detailBook, setDetailBook] = useState<BookRow | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // 邀请成员
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  // 邀请码展示
  const [inviteCode, setInviteCode] = useState("");
  const [showInviteCode, setShowInviteCode] = useState(false);

  // 移除成员确认
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [removeMemberName, setRemoveMemberName] = useState("");

  // 离开账本确认
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveBookId, setLeaveBookId] = useState<string | null>(null);

  // 使用邀请码加入
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  // 加入 Mutation
  const joinMut = useMutation({
    mutationFn: (code: string) => joinByInvitation(code),
    onSuccess: () => {
      Taro.showToast({ title: "已加入账本", icon: "success" });
      setShowJoinSheet(false);
      setJoinCode("");
      refetch();
    },
    onError: () => {
      Taro.showToast({ title: "邀请码无效或已过期", icon: "none" });
    },
  });

  const handleJoinSubmit = () => {
    const code = joinCode.trim();
    if (!code) {
      Taro.showToast({ title: "请输入邀请码", icon: "none" });
      return;
    }
    joinMut.mutate(code);
  };

  // --- 数据请求 ---
  const { data: books, isLoading, refetch } = useManualQuery<BookRow[]>({
    key: "books",
    queryFn: () => apiGet<BookRow[]>("/books"),
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

  const handleEdit = (book: BookRow) => {
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

  // 点击卡片 → 打开详情弹窗
  const handleCardTap = (book: BookRow) => {
    setDetailBook(book);
    setShowDetail(true);
    setMembersLoading(true);
    fetchBookMembers(book.id)
      .then((data) => {
        setMembers(data || []);
      })
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false));
  };

  // 打开切换账本确认
  const handleOpenSwitch = (book: BookRow) => {
    if (currentBook && String(currentBook.id) === String(book.id)) {
      Taro.showToast({ title: "当前已是该账本", icon: "none" });
      return;
    }
    switchBook(book);
    // T-H11: 统一使用 setStoredBookId()，与 api.ts 中的 getStoredBookId() 共用 key
    qc.invalidateQueries();
    Taro.showToast({
      title: `已切换到「${book.name}」`,
      icon: "success",
    });
  };

  // 生成邀请码
  const inviteCodeMut = useMutation({
    mutationFn: (bookId: string) => createInvitation(bookId),
    onSuccess: (data) => {
      setInviteCode(data.code);
      setShowInviteCode(true);
    },
    onError: () => {
      Taro.showToast({ title: "生成邀请码失败", icon: "none" });
    },
  });

  // 邀请成员
  const inviteMut = useMutation({
    mutationFn: ({ bookId, email }: { bookId: string; email: string }) =>
      inviteMember(bookId, email),
    onSuccess: () => {
      Taro.showToast({ title: "邀请已发送", icon: "success" });
      setInviteEmail("");
      setShowInviteSheet(false);
      // 刷新成员列表
      if (detailBook) {
        fetchBookMembers(detailBook.id).then(setMembers).catch(() => {});
      }
    },
    onError: () => {
      Taro.showToast({ title: "邀请失败", icon: "none" });
    },
  });

  // 移除成员
  const removeMut = useMutation({
    mutationFn: ({ bookId, userId }: { bookId: string; userId: string }) =>
      removeMember(bookId, userId),
    onSuccess: () => {
      Taro.showToast({ title: "成员已移除", icon: "success" });
      setRemoveMemberId(null);
      if (detailBook) {
        fetchBookMembers(detailBook.id).then(setMembers).catch(() => {});
      }
    },
    onError: () => {
      Taro.showToast({ title: "移除失败", icon: "none" });
    },
  });

  // 离开账本
  const leaveMut = useMutation({
    mutationFn: (bookId: string) => leaveBook(bookId),
    onSuccess: () => {
      Taro.showToast({ title: "已退出账本", icon: "success" });
      setShowLeaveConfirm(false);
      setLeaveBookId(null);
      refetch();
    },
    onError: () => {
      Taro.showToast({ title: "退出失败", icon: "none" });
    },
  });

  const saving = createMut.isPending || updateMut.isPending;
  const currentId = currentBook?.id;

  return (
    <PageLayout contentClassName="bk-content">
      <PageHero
        eyebrow="账本管理"
        title={currentBook?.name || "所有账本"}
        meta={currentBook ? "管理当前账本、成员和邀请" : "创建、切换和加入家庭账本"}
        tone="surface"
      />

      <AppSection title="账本列表" compact flush>
      {isLoading ? (
        <View className="bk-list">
          <View className="bk-loading-row" />
          <View className="bk-loading-row" />
          <View className="bk-loading-row" />
        </View>
      ) : !books || books.length === 0 ? (
        <View className="bk-empty">
          <EmptyState
            icon="book"
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
                  <View className="bk-card__icon-wrap">
                    {isCustomIcon(book.icon) ? (
                      <Text>图</Text>
                    ) : (
                      <Image
                        src={renderBookIconSvg(book.icon, 28, "#2d9d8a")}
                        mode="aspectFit"
                        style={{ width: "28px", height: "28px", display: "block" }}
                      />
                    )}
                  </View>
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
      </AppSection>

      {/* 悬浮按钮组：新建账本 + 使用邀请码加入 */}
      <View className="bk-fab-wrap">
        <View className="bk-fab bk-fab--join" onClick={() => setShowJoinSheet(true)}>
          <Text className="bk-fab__icon bk-fab__icon--join">邀</Text>
          <Text className="bk-fab__label">使用邀请码加入</Text>
        </View>
        <View className="bk-fab" onClick={handleAdd}>
          <Text className="bk-fab__icon">＋</Text>
        </View>
      </View>

      {/* 使用邀请码加入 Sheet */}
      {showJoinSheet && (
        <View className="bk-mask" onClick={() => setShowJoinSheet(false)}>
          <View className="bk-sheet" onClick={(e: any) => e.stopPropagation()}>
            <View className="bk-sheet__header">
              <Text className="bk-sheet__cancel" onClick={() => setShowJoinSheet(false)}>取消</Text>
              <Text className="bk-sheet__title">使用邀请码加入</Text>
              <Text
                className={`bk-sheet__confirm ${joinMut.isPending ? "bk-sheet__confirm--disabled" : ""}`}
                onClick={handleJoinSubmit}
              >
                {joinMut.isPending ? "加入中…" : "加入"}
              </Text>
            </View>

            <View className="bk-sheet__body">
              <View className="bk-form-row">
                <Text className="bk-form-label">邀请码</Text>
                <Input
                  className="bk-form-input"
                  placeholder="请输入邀请码"
                  maxlength={32}
                  value={joinCode}
                  onInput={(e: any) => setJoinCode(e.detail.value)}
                />
              </View>
              <View className="bk-join-hint">
                <Text>向账本管理员索取邀请码，加入后即可在该账本中记账</Text>
              </View>
            </View>

            <View className="bk-sheet__safe" />
          </View>
        </View>
      )}

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
              {/* 1. 名称 —— 对齐 PC：账本名称 */}
              <View className="bk-form-row">
                <Text className="bk-form-label">名称</Text>
                <Input
                  className="bk-form-input"
                  placeholder="如：家庭账本"
                  maxlength={50}
                  value={form.name}
                  onInput={(e: any) =>
                    setForm((p) => ({ ...p, name: e.detail.value }))
                  }
                />
              </View>

              {/* 2. 描述 —— 对齐 PC：描述（可选） */}
              <View className="bk-form-row">
                <Text className="bk-form-label">描述</Text>
                <Input
                  className="bk-form-input"
                  placeholder="简单介绍一下这个账本"
                  maxlength={200}
                  value={form.description}
                  onInput={(e: any) =>
                    setForm((p) => ({ ...p, description: e.detail.value }))
                  }
                />
              </View>

              {/* 3. 图标 —— 对齐 PC：预设 SVG 线条图标 + 自定义上传 */}
              <View className="bk-form-row">
                <Text className="bk-form-label">图标</Text>
                <View className="bk-form-emoji-current">
                  {isCustomIcon(form.icon) ? (
                    <Text>图</Text>
                  ) : (
                    <Image
                      src={renderBookIconSvg(form.icon, 20, "#1a1c19")}
                      mode="aspectFit"
                      style={{ width: "20px", height: "20px", display: "block" }}
                    />
                  )}
                </View>
              </View>

              {/* 3.1 预设 SVG 图标网格（与 PC 端 16 个一致） */}
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
                      <View className="bk-emoji-item__emoji">
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
                        className={`bk-emoji-item__label ${
                          isSelected ? "bk-emoji-item__label--selected" : ""
                        }`}
                      >
                        {item.label}
                      </Text>
                    </View>
                  );
                })}

                {/* 3.2 自定义图标上传 */}
                <View
                  className={`bk-custom-icon-item ${
                    isCustomIcon(form.icon) ? "bk-custom-icon-item--selected" : ""
                  }`}
                  onClick={handleUploadCustomIcon}
                >
                  {isCustomIcon(form.icon) ? (
                    <View className="bk-custom-icon-item__img-wrap">
                      <Text className="bk-custom-icon-item__img-text">图</Text>
                    </View>
                  ) : (
                    <Text className="bk-custom-icon-item__upload">
                      {uploadingIcon ? "上传中…" : "＋ 上传"}
                    </Text>
                  )}
                  <Text className="bk-emoji-item__label">自定义</Text>
                </View>
              </View>
            </View>

            <View className="bk-sheet__safe" />
          </View>
        </View>
      )}

      {/* 账本详情弹窗（底部 Sheet） */}
      {showDetail && detailBook && (
        <View className="bk-mask" onClick={() => setShowDetail(false)}>
          <View className="bk-detail-sheet" onClick={(e: any) => e.stopPropagation()}>
            <View className="bk-detail-header">
              <Text className="bk-detail-cancel" onClick={() => setShowDetail(false)}>
                关闭
              </Text>
              <Text className="bk-detail-title">账本详情</Text>
              <View className="bk-detail-spacer" />
            </View>

            <ScrollView className="bk-detail-body" scrollY>
              {/* 账本信息 */}
              <View className="bk-detail-info">
                <View className="bk-detail-emoji">
                  {isCustomIcon(detailBook.icon) ? (
                    <Text>图</Text>
                  ) : (
                    <Image
                      src={renderBookIconSvg(detailBook.icon, 36, "#2d9d8a")}
                      mode="aspectFit"
                      style={{ width: "36px", height: "36px", display: "block" }}
                    />
                  )}
                </View>
                <View className="bk-detail-meta">
                  <Text className="bk-detail-name">{detailBook.name}</Text>
                  {detailBook.description && (
                    <Text className="bk-detail-desc">{detailBook.description}</Text>
                  )}
                  <Text className="bk-detail-sub">
                    {members.length} 人 · 创建于{" "}
                    {new Date(detailBook.created_at).toLocaleDateString("zh-CN")}
                  </Text>
                </View>
              </View>

              {/* 操作按钮区 */}
              <View className="bk-detail-actions">
                <View
                  className="bk-detail-btn"
                  onClick={() => {
                    setShowDetail(false);
                    handleEdit(detailBook);
                  }}
                >
                  <Text>编辑</Text>
                </View>
                <View
                  className="bk-detail-btn"
                  onClick={() => {
                    setShowInviteSheet(true);
                  }}
                >
                  <Text>邀请成员</Text>
                </View>
                <View
                  className={`bk-detail-btn ${inviteCodeMut.isPending ? "bk-detail-btn--pending" : ""}`}
                  onClick={() => {
                    if (detailBook.id) inviteCodeMut.mutate(detailBook.id);
                  }}
                >
                  <Text>
                    {inviteCodeMut.isPending ? "生成中..." : "生成邀请码"}
                  </Text>
                </View>
                {currentBook && String(currentBook.id) !== String(detailBook.id) && (
                  <View
                    className="bk-detail-btn bk-detail-btn--primary"
                    onClick={() => {
                      setShowDetail(false);
                      handleOpenSwitch(detailBook);
                    }}
                  >
                    <Text>切换到此账本</Text>
                  </View>
                )}
                {!detailBook.is_default && (
                  <View
                    className="bk-detail-btn bk-detail-btn--danger"
                    onClick={() => {
                      setShowDetail(false);
                      setDeleteId(detailBook.id);
                    }}
                  >
                    <Text>删除账本</Text>
                  </View>
                )}
                <View
                  className="bk-detail-btn bk-detail-btn--secondary"
                  onClick={() => {
                    setShowDetail(false);
                    setLeaveBookId(detailBook.id);
                    setShowLeaveConfirm(true);
                  }}
                >
                  <Text>退出账本</Text>
                </View>
              </View>

              {/* 成员列表 */}
              <View className="bk-detail-section">
                <Text className="bk-detail-section-title">成员列表</Text>
                {membersLoading ? (
                  <Text className="bk-detail-loading">加载中…</Text>
                ) : members.length === 0 ? (
                  <Text className="bk-detail-empty">暂无成员信息</Text>
                ) : (
                  <View className="bk-member-list">
                    {members.map((m: any) => {
                      const isOwner = m.role === "owner" || m.id === detailBook.owner_id;
                      return (
                        <View key={m.id || m.user_id} className="bk-member-item">
                          <View className="bk-member-info">
                            <Text className="bk-member-avatar">
                              {(m.username || m.email || "成").charAt(0).toUpperCase()}
                            </Text>
                            <View>
                              <Text className="bk-member-name">
                                {m.username || m.email || "成员"}
                              </Text>
                              <Text className="bk-member-role">
                                {isOwner ? "账主" : "成员"}
                              </Text>
                            </View>
                          </View>
                          {!isOwner && (
                            <View
                              className="bk-member-remove"
                              onClick={() => {
                                setRemoveMemberId(m.id || m.user_id);
                                setRemoveMemberName(m.username || m.email || "该成员");
                              }}
                            >
                              <Text>移除</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>

            <View className="bk-detail-safe" />
          </View>
        </View>
      )}

      {/* 邀请成员 Sheet */}
      {showInviteSheet && detailBook && (
        <View className="bk-mask" onClick={() => setShowInviteSheet(false)}>
          <View className="bk-sheet" onClick={(e: any) => e.stopPropagation()}>
            <View className="bk-sheet__header">
              <Text className="bk-sheet__cancel" onClick={() => setShowInviteSheet(false)}>
                取消
              </Text>
              <Text className="bk-sheet__title">邀请成员</Text>
              <Text
                className={`bk-sheet__confirm ${inviteMut.isPending ? "bk-sheet__confirm--disabled" : ""}`}
                onClick={() => {
                  if (!inviteEmail.trim()) {
                    Taro.showToast({ title: "请输入邮箱", icon: "none" });
                    return;
                  }
                  if (detailBook) {
                    inviteMut.mutate({ bookId: detailBook.id, email: inviteEmail.trim() });
                  }
                }}
              >
                {inviteMut.isPending ? "发送中…" : "发送"}
              </Text>
            </View>
            <View className="bk-sheet__body">
              <View className="bk-form-row">
                <Text className="bk-form-label">邮箱</Text>
                <Input
                  className="bk-form-input"
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onInput={(e: any) => setInviteEmail(e.detail.value)}
                />
              </View>
            </View>
            <View className="bk-sheet__safe" />
          </View>
        </View>
      )}

      {/* 邀请码展示 */}
      {showInviteCode && inviteCode && (
        <View className="bk-mask" onClick={() => setShowInviteCode(false)}>
          <View className="bk-sheet" onClick={(e: any) => e.stopPropagation()}>
            <View className="bk-sheet__header">
              <Text className="bk-sheet__cancel" onClick={() => setShowInviteCode(false)}>
                关闭
              </Text>
              <Text className="bk-sheet__title">邀请码</Text>
              <View className="bk-sheet__spacer" />
            </View>
            <View className="bk-sheet__body">
              <View className="bk-invite-code-box">
                <Text className="bk-invite-code">{inviteCode}</Text>
              </View>
              <Text className="bk-invite-hint">复制上方邀请码，发送给要加入的成员</Text>
              <View
                className="bk-invite-copy"
                onClick={() => {
                  Taro.setClipboardData({
                    data: inviteCode,
                    success: () => Taro.showToast({ title: "已复制", icon: "success" }),
                  });
                }}
              >
                <Text>复制邀请码</Text>
              </View>
            </View>
            <View className="bk-sheet__safe" />
          </View>
        </View>
      )}

      {/* 移除成员确认 */}
      <ConfirmDialog
        visible={!!deleteId}
        title="确认删除"
        message="确定要删除这个账本吗？账本内数据将无法恢复。"
        confirmText="确认删除"
        danger
        confirmLoading={deleteMut.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
      />

      <ConfirmDialog
        visible={!!removeMemberId}
        title="确认移除"
        message={`确定要移除成员 ${removeMemberName} 吗？`}
        confirmText="确认移除"
        danger
        confirmLoading={removeMut.isPending}
        onCancel={() => setRemoveMemberId(null)}
        onConfirm={() => {
          if (removeMemberId && detailBook) {
            removeMut.mutate({ bookId: detailBook.id, userId: removeMemberId });
          }
        }}
      />

      {/* 离开账本确认 */}
      <ConfirmDialog
        visible={showLeaveConfirm}
        title="确认退出"
        message="确定要退出这个账本吗？退出后你将无法查看该账本的数据。"
        confirmText="确认退出"
        danger
        confirmLoading={leaveMut.isPending}
        onCancel={() => {
          setShowLeaveConfirm(false);
          setLeaveBookId(null);
        }}
        onConfirm={() => {
          if (leaveBookId) leaveMut.mutate(leaveBookId);
        }}
      />
    </PageLayout>
  );
}
