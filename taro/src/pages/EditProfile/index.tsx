/**
 * EditProfile — 编辑资料
 *
 * 功能：
 *  1. 顶部吸顶栏：返回按钮 + 「编辑资料」标题
 *  2. 头像区域：圆形头像容器（显示 avatar_url 或首字母占位），点击更换头像
 *  3. 用户名 / 邮箱输入框
 *  4. 修改密码入口：点击后弹出对话框，输入当前密码 + 新密码（至少 6 位，含大小写字母和数字）+ 确认密码
 *  5. 保存按钮：调用 updateProfile → toast 成功 → 刷新用户信息 → 延迟后 navigateBack
 *  6. 提交类 loading 由 useSubmit 统一处理（Taro.showLoading + 防重复）
 */

import { useState, useEffect, useCallback } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageContainer from "../../components/PageContainer";
import { Button, StickyActionBar } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import {
  updateProfile as apiUpdateProfile,
  changePassword as apiChangePassword,
  getProfile,
} from "../../services/authApi";
import { useSubmit, toastError } from "../../hooks/useSubmit";
import {
  ensurePrivacyAuthorize,
  isPrivacyError,
  openPrivacySetting,
} from "../../utils/privacy";
import "./index.scss";
import { getErrorMessage } from "../../utils/errorMessage";
import { toastSuccess, toastInfo } from "../../utils/toast";
import { userInitial } from "../../utils/userDisplay";
import { ACTION_SAVING, ACTION_SUBMITTING } from "../../utils/actionCopy";
import {
  validateEmail,
  validatePasswordMatch,
  validatePasswordMinLength,
  validatePasswordStrength,
} from "../../utils/validation";
import { SUCCESS_AVATAR_UPDATED, SUCCESS_IMAGE_SELECTED, SUCCESS_PASSWORD_CHANGED, SUCCESS_SAVED } from "../../utils/successCopy";
import { FORM_PASSWORD_CURRENT, FORM_PRIVACY_REQUIRED, FORM_USERNAME_REQUIRED, FORM_PASSWORD_MIN_NEW, FORM_PASSWORD_MISMATCH_NEW, FORM_USERNAME_PLACEHOLDER, FORM_EMAIL_PLACEHOLDER, FORM_PASSWORD_CONFIRM_NEW_PLACEHOLDER } from "../../utils/formCopy";
import { IMAGE_SELECT_FAILED } from "../../utils/uploadCopy";
import { ERROR_SAVE_FAILED_RETRY, ERROR_MODIFY_FAILED_RETRY } from "../../utils/errorCopy";
import Icon, { ICON_COLOR } from "../../components/Icon";

export default function EditProfile() {
  const { user, refreshUser } = useAuth();
  const { run } = useSubmit();

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || "");

  const [showPwd, setShowPwd] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // 首字母占位：取 username 首字母大写；如果没有 username 取 email 首字母大写。
  const initial = userInitial(user, "U")
    .charAt(0)
    .toUpperCase();

  // 进入页面时再拉一次最新资料（保证与服务器同步）
  useEffect(() => {
    getProfile()
      .then((p) => {
        setUsername(p.username || "");
        setEmail(p.email || "");
        setAvatarUrl(p.avatar_url || "");
        setAvatarPreview(p.avatar_url || "");
      })
      .catch(() => {});
  }, []);

  // ---- 头像：选择 → 上传到 custom icons 服务 → 使用返回的 URL ----
  const handleChangeAvatar = useCallback(async () => {
    const ok = await ensurePrivacyAuthorize("选择头像需要访问您的相册");
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
        setAvatarPreview(path);
        // 使用 custom icons 上传接口获取正式 URL
        run(async () => {
          const { uploadIcon } = await import("../../services/iconsApi");
          const result: any = await uploadIcon(path, "avatar");
          const iconUrl = result?.icon_url || result?.url || "";
          if (iconUrl) {
            setAvatarUrl(iconUrl);
            setAvatarPreview(iconUrl);
            toastSuccess(SUCCESS_AVATAR_UPDATED);
          } else {
            setAvatarUrl(path); // fallback：临时路径
            toastSuccess(SUCCESS_IMAGE_SELECTED);
          }
        }, "上传中…").catch(() => {
          setAvatarUrl(path); // fallback
          toastSuccess(SUCCESS_IMAGE_SELECTED);
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
  }, []);

  // ---- 保存资料 ----
  const handleSave = useCallback(() => {
    if (!username.trim()) {
      return toastInfo(FORM_USERNAME_REQUIRED);
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      return toastInfo(emailErr);
    }

    run(async () => {
      await apiUpdateProfile({
        username: username.trim(),
        email: email.trim(),
        avatar_url: avatarUrl && avatarUrl.startsWith("http")
          ? undefined
          : avatarUrl,
      });
      await refreshUser?.();
      toastSuccess(SUCCESS_SAVED);
      setTimeout(() => Taro.navigateBack(), 600);
    }, ACTION_SAVING).catch((err: any) => {
      toastError(err, ERROR_SAVE_FAILED_RETRY);
    });
  }, [username, email, avatarUrl, refreshUser]);

  // ---- 修改密码 ----
  const openChangePwd = useCallback(() => {
    setOldPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setShowPwd(true);
  }, []);

  const closeChangePwd = useCallback(() => {
    setShowPwd(false);
  }, []);

  const handleChangePwd = useCallback(() => {
    if (!oldPwd) {
      return toastInfo(FORM_PASSWORD_CURRENT);
    }
    const pwdErr =
      validatePasswordMinLength(newPwd, { message: FORM_PASSWORD_MIN_NEW }) ||
      validatePasswordMatch(newPwd, confirmPwd, FORM_PASSWORD_MISMATCH_NEW) ||
      validatePasswordStrength(newPwd);
    if (pwdErr) {
      return toastInfo(pwdErr);
    }

    run(async () => {
      await apiChangePassword({
        oldPassword: oldPwd,
        newPassword: newPwd,
        confirmPassword: confirmPwd,
      });
      toastSuccess(SUCCESS_PASSWORD_CHANGED);
      setShowPwd(false);
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    }, ACTION_SUBMITTING).catch((err: any) => {
      toastError(err, ERROR_MODIFY_FAILED_RETRY);
    });
  }, [oldPwd, newPwd, confirmPwd]);

  return (
    <PageContainer bottomSpace={160} contentClassName="edit-profile-page">
      {/* ===== 头像区 ===== */}
      <View className="edit-avatar-wrap" onClick={handleChangeAvatar}>
        <View className="edit-avatar-container">
          {avatarPreview ? (
            <Image
              className="edit-avatar-img"
              src={avatarPreview}
              mode="aspectFill"
            />
          ) : (
            <View className="edit-avatar-placeholder">
              <Text className="edit-avatar-placeholder-text">{initial}</Text>
            </View>
          )}
        </View>
        <Text className="edit-avatar-tip">点击更换头像</Text>
      </View>

      {/* ===== 资料表单 ===== */}
      <View className="edit-form">
        <View className="edit-row">
          <Text className="edit-label">用户名</Text>
          <Input
            className="edit-input"
            value={username}
            maxlength={50}
            placeholder={FORM_USERNAME_PLACEHOLDER}
            placeholderClass="edit-input-placeholder"
            onInput={(e: any) => setUsername(e.detail.value)}
          />
        </View>
        <View className="edit-row">
          <Text className="edit-label">邮箱</Text>
          <Input
            className="edit-input"
            value={email}
            placeholder={FORM_EMAIL_PLACEHOLDER}
            placeholderClass="edit-input-placeholder"
            onInput={(e: any) => setEmail(e.detail.value)}
          />
        </View>
      </View>

      {/* ===== 修改密码入口 ===== */}
      <View className="edit-section">
        <View className="edit-pwd-entry" onClick={openChangePwd}>
          <Text className="edit-pwd-text">修改密码</Text>
          <Icon name="chevron-right" size={28} color={ICON_COLOR.muted} className="edit-pwd-arrow" />
        </View>
      </View>

      {/* ===== 保存按钮 ===== */}
      <StickyActionBar tone="blur">
        <Button variant="primary" block size="lg" onClick={handleSave}>
          更新信息
        </Button>
      </StickyActionBar>

      {/* ===== 修改密码弹窗 ===== */}
      {showPwd && (
        <View className="pwd-mask" onClick={closeChangePwd}>
          <View
            className="pwd-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <Text className="pwd-title">修改密码</Text>

            <View className="pwd-row">
              <Text className="pwd-label">当前密码</Text>
              <Input
                className="pwd-input"
                password
                value={oldPwd}
                placeholder={FORM_PASSWORD_CURRENT}
                placeholderClass="pwd-input-placeholder"
                onInput={(e: any) => setOldPwd(e.detail.value)}
              />
            </View>

            <View className="pwd-row">
              <Text className="pwd-label">新密码</Text>
              <Input
                className="pwd-input"
                password
                value={newPwd}
                placeholder="至少 6 位，含大小写 + 数字"
                placeholderClass="pwd-input-placeholder"
                onInput={(e: any) => setNewPwd(e.detail.value)}
              />
            </View>

            <View className="pwd-row">
              <Text className="pwd-label">确认新密码</Text>
              <Input
                className="pwd-input"
                password
                value={confirmPwd}
                placeholder={FORM_PASSWORD_CONFIRM_NEW_PLACEHOLDER}
                placeholderClass="pwd-input-placeholder"
                onInput={(e: any) => setConfirmPwd(e.detail.value)}
              />
            </View>

            <View className="pwd-actions">
              <Button variant="ghost" size="md" onClick={closeChangePwd}>
                取消
              </Button>
              <Button variant="primary" size="md" onClick={handleChangePwd}>
                确认
              </Button>
            </View>
          </View>
        </View>
      )}
    </PageContainer>
  );
}
