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
import { useSubmit } from "../../hooks/useSubmit";
import {
  ensurePrivacyAuthorize,
  isPrivacyError,
  openPrivacySetting,
} from "../../utils/privacy";
import "./index.scss";

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
  const initial = (user?.username || user?.email || "U")
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
            Taro.showToast({ title: "头像已更新", icon: "success" });
          } else {
            setAvatarUrl(path); // fallback：临时路径
            Taro.showToast({ title: "已选择图片", icon: "success" });
          }
        }, "上传中…").catch(() => {
          setAvatarUrl(path); // fallback
          Taro.showToast({ title: "已选择图片", icon: "success" });
        });
      })
      .catch((err: any) => {
        const msg = err?.errMsg || err?.message || "";
        if (msg.indexOf("cancel") !== -1) return;
        if (isPrivacyError(err)) {
          Taro.showToast({ title: "请先同意隐私协议", icon: "none" });
          openPrivacySetting();
          return;
        }
        Taro.showToast({ title: msg || "选择图片失败", icon: "none" });
      });
  }, []);

  // ---- 保存资料 ----
  const handleSave = useCallback(() => {
    if (!username.trim()) {
      return Taro.showToast({ title: "用户名不能为空", icon: "none" });
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email.trim())) {
      return Taro.showToast({ title: "邮箱格式不正确", icon: "none" });
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
      Taro.showToast({ title: "保存成功", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 600);
    }, "保存中…").catch((err: any) => {
      Taro.showToast({
        title: err?.message || "保存失败，请重试",
        icon: "none",
      });
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
      return Taro.showToast({ title: "请输入当前密码", icon: "none" });
    }
    if (newPwd.length < 6) {
      return Taro.showToast({ title: "新密码长度至少为 6 位", icon: "none" });
    }
    if (newPwd !== confirmPwd) {
      return Taro.showToast({ title: "两次输入的新密码不一致", icon: "none" });
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPwd)) {
      return Taro.showToast({
        title: "新密码必须同时包含大小写字母和数字",
        icon: "none",
      });
    }

    run(async () => {
      await apiChangePassword({
        oldPassword: oldPwd,
        newPassword: newPwd,
        confirmPassword: confirmPwd,
      });
      Taro.showToast({ title: "密码修改成功", icon: "success" });
      setShowPwd(false);
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    }, "提交中…").catch((err: any) => {
      Taro.showToast({
        title: err?.message || "修改失败，请重试",
        icon: "none",
      });
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
            placeholder="请输入用户名"
            placeholderClass="edit-input-placeholder"
            onInput={(e: any) => setUsername(e.detail.value)}
          />
        </View>
        <View className="edit-row">
          <Text className="edit-label">邮箱</Text>
          <Input
            className="edit-input"
            value={email}
            placeholder="请输入邮箱"
            placeholderClass="edit-input-placeholder"
            onInput={(e: any) => setEmail(e.detail.value)}
          />
        </View>
      </View>

      {/* ===== 修改密码入口 ===== */}
      <View className="edit-section">
        <View className="edit-pwd-entry" onClick={openChangePwd}>
          <Text className="edit-pwd-text">修改密码</Text>
          <Text className="edit-pwd-arrow">›</Text>
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
                placeholder="请输入当前密码"
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
                placeholder="请再次输入新密码"
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
