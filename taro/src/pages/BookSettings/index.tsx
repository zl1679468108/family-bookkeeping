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
import { AppSection, MenuList } from "../../components/ui";
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
import { uploadIcon, fetchCustomIcons, deleteIcon } from "../../services/iconsApi";
import { useManualQuery } from "../../hooks/useManualQuery";
import { useSubmit } from "../../hooks/useSubmit";
import "./index.scss";

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
    Taro.setNavigationBarTitle({ title: isAdd ? "新建账本" : "编辑账本" });
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

  const handleUploadCustomIcon = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    })
      .then((res) => {
        const path = res.tempFilePaths && res.tempFilePaths[0];
        if (!path) return;
        run(async () => {
          const result: any = await uploadIcon(path, "book");
          const iconUrl = result?.icon_url || result?.url || "";
          if (!iconUrl) throw new Error("上传失败");
          if (isAdd) setAddIcon(iconUrl);
          else setEditIcon(iconUrl);
          refreshCustomIcons();
          Taro.showToast({ title: "已添加自定义图标", icon: "success" });
        }, "上传中…").catch((err: any) => {
          Taro.showToast({ title: err?.message || "上传失败", icon: "none" });
        });
      })
      .catch(() => {});
  };

  const handleDeleteCustomIcon = (iconId: string, e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    deleteIcon(iconId)
      .then(() => {
        refreshCustomIcons();
        Taro.showToast({ title: "已删除", icon: "success" });
      })
      .catch(() => Taro.showToast({ title: "删除失败", icon: "none" }));
  };

  // ===== 新增模式 =====
  const [addName, setAddName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addIcon, setAddIcon] = useState("default");

  const handleCreate = () => {
    if (!addName.trim()) {
      Taro.showToast({ title: "请输入名称", icon: "none" });
      return;
    }
    const data: { name: string; description?: string; icon?: string } = {
      name: addName.trim(),
      icon: addIcon || "default",
    };
    if (addDescription.trim()) data.description = addDescription.trim();
    run(async () => {
      await createBook(data);
      qc.invalidateQueries({ queryKey: ["books"] });
      Taro.showToast({ title: "账本创建成功", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 500);
    }, "创建中…").catch((err: any) => {
      Taro.showToast({ title: err?.message || "创建失败", icon: "none" });
    });
  };

  // ===== 编辑模式：提交 =====
  const handleSubmitEdit = () => {
    if (!editName.trim()) {
      Taro.showToast({ title: "请输入名称", icon: "none" });
      return;
    }
    run(async () => {
      await updateBook(bookId, {
        name: editName.trim(),
        description: editDescription.trim(),
        icon: editIcon,
      });
      qc.invalidateQueries({ queryKey: ["books"] });
      Taro.showToast({ title: "更新成功", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 500);
    }, "保存中…").catch((err: any) => {
      Taro.showToast({ title: err?.message || "保存失败", icon: "none" });
    });
  };

  const handleSubmitTransfer = () => {
    if (!transferEmail.trim()) {
      Taro.showToast({ title: "请输入新拥有者邮箱", icon: "none" });
      return;
    }
    if (!transferPassword) {
      Taro.showToast({ title: "请输入密码验证", icon: "none" });
      return;
    }
    run(async () => {
      await transferOwner(bookId, transferEmail.trim(), transferPassword);
      qc.invalidateQueries({ queryKey: ["books"] });
      Taro.showToast({ title: "所有权已转移", icon: "success" });
      setShowTransfer(false);
    }, "转移中…").catch((err: any) => {
      Taro.showToast({ title: err?.message || "转移失败", icon: "none" });
      setShowTransfer(false);
    });
  };

  const handleDelete = () => {
    run(async () => {
      await deleteBook(bookId);
      qc.invalidateQueries({ queryKey: ["books"] });
      Taro.showToast({ title: "账本已删除", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 500);
    }, "删除中…").catch((err: any) => {
      Taro.showToast({ title: err?.message || "删除失败", icon: "none" });
    });
  };

  // ===== 渲染守卫 =====
  if (!isAdd && !currentBook) {
    return (
      <PageContainer loading={booksLoading} loadingText="加载中…">
        <View className="bs-empty">
          <Text>账本不存在</Text>
        </View>
      </PageContainer>
    );
  }

  // ===== 新增模式：新建账本表单 =====
  if (isAdd) {
    return (
      <PageContainer>
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
                    <Text>×</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </AppSection>

        <View className="bs-actions">
          <View
            className="bs-actions__save"
            onClick={handleCreate}
          >
            <Text>创建账本</Text>
          </View>
        </View>
      </PageContainer>
    );
  }

  // ===== 编辑模式：编辑表单（主视图） =====
  return (
    <PageContainer>
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
                    <Text>×</Text>
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
              <Text className={`bs-more-row__arrow ${showMoreMenu ? "bs-more-row__arrow--open" : ""}`}>
                ›
              </Text>
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
                          {members.length} 人 ›
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
      <View className="bs-actions">
        <View
          className="bs-actions__row"
        >
          <View
            className="bs-actions__cancel"
            onClick={() => Taro.navigateBack()}
          >
            <Text>取消</Text>
          </View>
          <View
            className="bs-actions__save"
            onClick={handleSubmitEdit}
          >
            <Text>保存</Text>
          </View>
        </View>
      </View>

      {/* ===== 转移所有权 Sheet ===== */}
      {showTransfer && (
        <View className="bs-mask" onClick={() => setShowTransfer(false)}>
          <View className="bs-sheet" onClick={(e: any) => e.stopPropagation()}>
            <SheetHeader title="转移所有权" onClose={() => setShowTransfer(false)} />

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

              <View className="bs-sheet__footer">
                <Text
                  className="bs-sheet__footer-btn"
                  onClick={handleSubmitTransfer}
                >
                  确认转移
                </Text>
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
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}
