/**
 * BookSettings — 账本设置
 *
 * 两种模式：
 *   编辑模式（有 id）：直接展示编辑表单（名称/描述/图标），保存后返回
 *   新增模式（无 id）：展示新建账本表单
 */
import { useState, useEffect } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import Taro, { getCurrentInstance } from "@tarojs/taro";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "../../components/PageContainer";
import ConfirmDialog from "../../components/ConfirmDialog";
import { AppSection, MenuList, Button, StickyActionBar, FooterActions } from "../../components/ui";
import SheetHeader from "../../components/SheetHeader";
import { BOOK_ICONS, renderBookIconSvg } from "../../utils/bookIcons";
import {
  fetchBooks,
  createBook,
  updateBook,
  deleteBook,
  checkOwner,
  fetchBookMembers,
  transferOwner,
} from "../../services/booksApi";
import { buildBookPayload, validateBookName } from "../../utils/bookPayload";
import { uploadIcon, fetchCustomIcons, deleteIcon } from "../../services/iconsApi";
import {
  ensurePrivacyAuthorize,
  isPrivacyError,
  openPrivacySetting,
} from "../../utils/privacy";
import { useManualQuery } from "../../hooks/useManualQuery";
import { useSubmit, toastError } from "../../hooks/useSubmit";
import "./index.scss";
import { getErrorMessage } from "../../utils/errorMessage";
import { toastSuccess, toastInfo } from "../../utils/toast";
import { ACTION_DELETING, ACTION_LOADING, ACTION_SAVING } from "../../utils/actionCopy";
import {
  CONFIRM_DELETE_TITLE,
  CONFIRM_DELETE_TEXT,
  CONFIRM_DELETE_BOOK_GENERIC,
} from "../../utils/confirmCopy";
import { FORM_PRIVACY_REQUIRED, FORM_OWNER_EMAIL_REQUIRED, FORM_PASSWORD_VERIFY, FORM_MEMBER_EMAIL_PLACEHOLDER } from "../../utils/formCopy";
import { validateEmail } from "../../utils/validation";
import { SUCCESS_BOOK_CREATED, SUCCESS_CUSTOM_ICON_ADDED, SUCCESS_DELETED, SUCCESS_OWNERSHIP_TRANSFERRED, SUCCESS_UPDATED, successEntityDeleted } from "../../utils/successCopy";
import { entityFormTitle, ENTITY_BOOK } from "../../utils/entityCopy";
import { IMAGE_SELECT_FAILED, DELETE_FAILED, UPLOAD_FAILED } from "../../utils/uploadCopy";
import { ERROR_CREATE_FAILED, ERROR_SAVE_FAILED, ERROR_TRANSFER_FAILED } from "../../utils/errorCopy";
import Icon, { ICON_COLOR } from "../../components/Icon";
import { TITLE_TRANSFER_OWNERSHIP } from "../../utils/sectionCopy";

interface Member {
  id: string;
  email: string;
  username?: string;
  role: "owner" | "member";
}

export default function BookSettings() {
  const router = getCurrentInstance().router;
  const bookId = (router?.params?.id as string) || "";
  const isAdd = !bookId;
  const qc = useQueryClient();

  // 设置原生导航栏标题（避免自定义 NavHeader 产生双层导航）
  useEffect(() => {
    Taro.setNavigationBarTitle({ title: entityFormTitle(ENTITY_BOOK, !isAdd) });
  }, [isAdd]);

  // ===== UI 状态 — 编辑表单 =====
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIcon, setEditIcon] = useState("");

  // 转移所有权（从更多菜单触发）
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferPassword, setTransferPassword] = useState("");

  // 删除确认（从更多菜单触发）
  const [showDelete, setShowDelete] = useState(false);

  // 提交类 loading 由 useSubmit 统一处理
  const { run } = useSubmit();

  // 更多菜单（仅 owner 可见）
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // ===== 数据 =====
  // 通过 EventChannel 接收列表页传入的账本数据（避免异步加载竞态）
  const [passedBook, setPassedBook] = useState<any>(null);

  useEffect(() => {
    const instance = getCurrentInstance();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (instance.page as any)?.getOpenerEventChannel?.();
    if (channel) {
      channel.on("bookData", (data: any) => {
        setPassedBook(data);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fallback 数据源
  const { data: books = [], isLoading: booksLoading } = useManualQuery<any[]>({
    key: "books",
    queryFn: fetchBooks,
  });

  const currentBook: any = passedBook || books.find((b: any) => b.id === bookId);

  // 有传入数据或 fetchBooks 返回时，同步到编辑字段
  useEffect(() => {
    if (!isAdd && currentBook) {
      setEditName(currentBook.name || "");
      setEditDescription(currentBook.description || "");
      setEditIcon(currentBook.icon || "default");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBook?.id]);

  const { data: ownerCheck } = useManualQuery({
    key: `bookOwner-${bookId}`,
    queryFn: () => checkOwner(bookId),
    enabled: !!bookId,
  });
  const isOwner = ownerCheck?.isOwner ?? false;

  const { data: members = [] } = useManualQuery<Member[]>({
    key: `bookMembers-${bookId}`,
    queryFn: () => fetchBookMembers(bookId),
    enabled: !!bookId && isOwner,
  });

  // ===== Mutations（已移除 useMutation，改用手动 Promise 链，见下方 handle*）=====

  // ===== 自定义图标（上传 / 列表） =====
  const [customIcons, setCustomIcons] = useState<any[]>([]);

  const refreshCustomIcons = () => {
    fetchCustomIcons("book")
      .then((list: any[]) => setCustomIcons(list || []))
      .catch(() => setCustomIcons([]));
  };
  useEffect(() => {
    refreshCustomIcons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploadCustomIcon = async () => {
    const ok = await ensurePrivacyAuthorize("选择图标需要访问您的相册");
    if (!ok) return;
    Taro.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    })
      .then((res) => {
        const path = res.tempFiles && res.tempFiles[0]?.tempFilePath;
        if (!path) return;
        run(async () => {
          const result: any = await uploadIcon(path, "book");
          const iconUrl = result?.icon_url || result?.url || "";
          if (!iconUrl) throw new Error(UPLOAD_FAILED);
          if (isAdd) setAddIcon(iconUrl);
          else setEditIcon(iconUrl);
          refreshCustomIcons();
          toastSuccess(SUCCESS_CUSTOM_ICON_ADDED);
        }, "上传中…").catch((err: any) => {
      toastError(err, UPLOAD_FAILED);
    });
      })
      .catch((err: any) => {
        const msg = getErrorMessage(err, "");
        if (msg.indexOf("cancel") !== -1) return;
        if (isPrivacyError(err)) {
          toastInfo(FORM_PRIVACY_REQUIRED);
          openPrivacySetting();
          return;
        }
        toastInfo(msg || IMAGE_SELECT_FAILED);
      });
  };

  const handleDeleteCustomIcon = (iconId: string, e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    deleteIcon(iconId)
      .then(() => {
        refreshCustomIcons();
        toastSuccess(SUCCESS_DELETED);
      })
      .catch(() => toastInfo(DELETE_FAILED));
  };

  // ===== 新增模式 =====
  const [addName, setAddName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addIcon, setAddIcon] = useState("default");

  const handleCreate = () => {
    const nameErr = validateBookName(addName);
    if (nameErr) {
      toastInfo(nameErr);
      return;
    }
    const data = buildBookPayload({
      name: addName,
      description: addDescription,
      icon: addIcon || "default",
    });
    run(async () => {
      await createBook(data);
      qc.invalidateQueries({ queryKey: ["books"] });
      toastSuccess(SUCCESS_BOOK_CREATED);
      setTimeout(() => Taro.navigateBack(), 500);
    }, "创建中…").catch((err: any) => {
      toastError(err, ERROR_CREATE_FAILED);
    });
  };

  // ===== 编辑模式：提交 =====
  const handleSubmitEdit = () => {
    const nameErr = validateBookName(editName);
    if (nameErr) {
      toastInfo(nameErr);
      return;
    }
    run(async () => {
      await updateBook(
        bookId,
        buildBookPayload({
          name: editName,
          description: editDescription,
          icon: editIcon,
        }),
      );
      qc.invalidateQueries({ queryKey: ["books"] });
      toastSuccess(SUCCESS_UPDATED);
      setTimeout(() => Taro.navigateBack(), 500);
    }, ACTION_SAVING).catch((err: any) => {
      toastError(err, ERROR_SAVE_FAILED);
    });
  };

  const handleSubmitTransfer = () => {
    const emailErr = validateEmail(transferEmail, { emptyMessage: FORM_OWNER_EMAIL_REQUIRED });
    if (emailErr) {
      toastInfo(emailErr);
      return;
    }
    if (!transferPassword) {
      toastInfo(FORM_PASSWORD_VERIFY);
      return;
    }
    run(async () => {
      await transferOwner(bookId, transferEmail.trim(), transferPassword);
      qc.invalidateQueries({ queryKey: ["books"] });
      toastSuccess(SUCCESS_OWNERSHIP_TRANSFERRED);
      setShowTransfer(false);
    }, "转移中…").catch((err: any) => {
      toastError(err, ERROR_TRANSFER_FAILED);
      setShowTransfer(false);
    });
  };

  const handleDelete = () => {
    run(async () => {
      await deleteBook(bookId);
      qc.invalidateQueries({ queryKey: ["books"] });
      toastSuccess(successEntityDeleted(ENTITY_BOOK));
      setTimeout(() => Taro.navigateBack(), 500);
    }, ACTION_DELETING).catch((err: any) => {
      toastError(err, DELETE_FAILED);
    });
  };

  // ===== 渲染守卫 =====
  if (!isAdd && !currentBook) {
    return (
      <PageContainer loading={booksLoading} loadingText={ACTION_LOADING}>
        <View className="bs-empty">
          <Text>账本不存在</Text>
        </View>
      </PageContainer>
    );
  }

  // ===== 新增模式：新建账本表单 =====
  if (isAdd) {
    return (
      <PageContainer bottomSpace={180}>
        <AppSection compact>
          {/* 名称 */}
          <View className="bs-form-row">
            <Text className="bs-form-label"><Text className="bs-required">*</Text> 账本名称</Text>
            <Input
              className="bs-form-input"
              placeholder="如：家庭账本"
              maxlength={50}
              value={addName}
              onInput={(e: any) => setAddName(e.detail.value)}
            />
          </View>

          {/* 描述 */}
          <View className="bs-form-row bs-form-row--stack">
            <Text className="bs-form-label">描述（可选）</Text>
            <Input
              className="bs-form-input bs-form-textarea"
              placeholder="简单介绍一下这个账本"
              maxlength={200}
              value={addDescription}
              onInput={(e: any) => setAddDescription(e.detail.value)}
            />
          </View>

          {/* 图标 */}
          <View className="bs-form-row bs-form-row--stack">
            <Text className="bs-form-label">图标</Text>
            <View className="bs-emoji-grid">
              {BOOK_ICONS.map((item: any) => {
                const isSelected = addIcon === item.key;
                return (
                  <View
                    key={item.key}
                    className={`bs-emoji-item ${
                      isSelected ? "bs-emoji-item--selected" : ""
                    }`}
                    onClick={() => setAddIcon(item.key)}
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

          {/* 自定义图标 */}
          <View className="bs-form-row bs-form-row--stack">
            <Text className="bs-form-label">自定义</Text>
            <View className="bs-custom-icons">
              <View
                className="bs-custom-icon-upload"
                onClick={handleUploadCustomIcon}
              >
                <Text>＋ 上传图标</Text>
              </View>
              {customIcons.map((item: any) => (
                <View
                  key={item.id}
                  className={`bs-custom-icon-item ${
                    addIcon === item.icon_url ? "bs-custom-icon-item--selected" : ""
                  }`}
                  onClick={() => setAddIcon(item.icon_url)}
                >
                  <Image
                    className="bs-custom-icon-item__img"
                    src={item.icon_url}
                    mode="aspectFit"
                  />
                  <View
                    className="bs-custom-icon-item__del"
                    onClick={(e: any) => handleDeleteCustomIcon(item.id, e)}
                  >
                    <Icon name="close" size={28} color={ICON_COLOR.muted} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </AppSection>

        <StickyActionBar tone="blur">
          <Button variant="primary" size="lg" block onClick={handleCreate}>
            创建账本
          </Button>
        </StickyActionBar>
      </PageContainer>
    );
  }

  // ===== 编辑模式：编辑表单（主视图） =====
  return (
    <PageContainer bottomSpace={180}>
      <AppSection compact>
        {/* 名称 */}
          <View className="bs-form-row">
            <Text className="bs-form-label"><Text className="bs-required">*</Text> 账本名称</Text>
            <Input
              className="bs-form-input"
              placeholder="如：家庭账本"
              maxlength={50}
              value={editName}
              onInput={(e: any) => setEditName(e.detail.value)}
            />
          </View>

          {/* 描述 */}
          <View className="bs-form-row bs-form-row--stack">
            <Text className="bs-form-label">描述（可选）</Text>
            <Input
              className="bs-form-input bs-form-textarea"
              placeholder="简单介绍一下这个账本"
              maxlength={200}
            value={editDescription}
            onInput={(e: any) => setEditDescription(e.detail.value)}
          />
        </View>

          {/* 图标 */}
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

          {/* 自定义图标 */}
          <View className="bs-form-row bs-form-row--stack">
            <Text className="bs-form-label">自定义</Text>
            <View className="bs-custom-icons">
              <View
                className="bs-custom-icon-upload"
                onClick={handleUploadCustomIcon}
              >
                <Text>＋ 上传图标</Text>
              </View>
              {customIcons.map((item: any) => (
                <View
                  key={item.id}
                  className={`bs-custom-icon-item ${
                    editIcon === item.icon_url ? "bs-custom-icon-item--selected" : ""
                  }`}
                  onClick={() => setEditIcon(item.icon_url)}
                >
                  <Image
                    className="bs-custom-icon-item__img"
                    src={item.icon_url}
                    mode="aspectFit"
                  />
                  <View
                    className="bs-custom-icon-item__del"
                    onClick={(e: any) => handleDeleteCustomIcon(item.id, e)}
                  >
                    <Icon name="close" size={28} color={ICON_COLOR.muted} />
                  </View>
                </View>
              ))}
            </View>
          </View>

        {/* Owner 更多操作 */}
        {isOwner && (
          <>
            <View className="bs-divider" />
            <View
              className="bs-more-row"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            >
              <Text className="bs-more-row__text">更多操作</Text>
              <Icon name="chevron-right" size={28} color={ICON_COLOR.muted} className={`bs-more-row__arrow ${showMoreMenu ? "bs-more-row__arrow--open" : ""}`} />
            </View>

            {showMoreMenu && (
              <View className="bs-more-menu">
                <MenuList
                  items={[
                    {
                      label: "成员管理",
                      icon: "profile",
                      right: (
                        <Text className="bs-info-row__value">
                          {members.length} 人
                        </Text>
                      ),
                      onClick: () =>
                        Taro.navigateTo({
                          url: `/pages/BookMembers/index?id=${bookId}`,
                        }),
                    },
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
              </View>
            )}
          </>
        )}
      </AppSection>

      {/* 底部按钮 */}
      <StickyActionBar tone="blur" row>
        <Button variant="outline" size="lg" block onClick={() => Taro.navigateBack()}>
          取消
        </Button>
        <Button variant="primary" size="lg" block onClick={handleSubmitEdit}>
          保存
        </Button>
      </StickyActionBar>

      {/* ===== 转移所有权 Sheet ===== */}
      {showTransfer && (
        <View className="bs-mask" onClick={() => setShowTransfer(false)}>
          <View className="bs-sheet" onClick={(e: any) => e.stopPropagation()}>
            <SheetHeader title={TITLE_TRANSFER_OWNERSHIP} onClose={() => setShowTransfer(false)} />

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
                  placeholder={FORM_MEMBER_EMAIL_PLACEHOLDER}
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

              <View className="bs-sheet__footer">
                <FooterActions align="stretch">
                  <Button variant="primary" size="lg" block onClick={handleSubmitTransfer}>
                    确认转移
                  </Button>
                </FooterActions>
              </View>
            </View>

            <View className="bs-sheet__safe" />
          </View>
        </View>
      )}

      {/* ===== 删除确认 ===== */}
      <ConfirmDialog
        visible={showDelete}
        title={CONFIRM_DELETE_TITLE}
        message={CONFIRM_DELETE_BOOK_GENERIC}
        confirmText={CONFIRM_DELETE_TEXT}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}