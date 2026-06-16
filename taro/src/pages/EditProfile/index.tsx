/**
 * EditProfile — 编辑资料
 *
 * 功能：
 *  1. 顶部吸顶栏：返回按钮 + 「编辑资料」标题
 *  2. 头像区域：圆形头像容器（显示 avatar_url 或首字母占位），点击更换头像
 *  3. 用户名 / 邮箱输入框
 *  4. 修改密码入口：点击后弹出对话框，输入当前密码 + 新密码（至少 6 位，含大小写字母和数字）+ 确认密码
 *  5. 保存按钮：调用 updateProfile → toast 成功 → 刷新用户信息 → 延迟后 navigateBack
 *  6. loading 状态：isSaving / isPwdSaving，按钮禁用时显示 "..." 或 "保存中..."
 */

import { useState, useEffect, useCallback } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageLayout from "../../components/PageLayout";
import { useAuth } from "../../context/AuthContext";
import {
  updateProfile as apiUpdateProfile,
  changePassword as apiChangePassword,
  getProfile,
} from "../../services/authApi";
import "./index.scss";

export default function EditProfile() {
  const { user, refreshUser } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || "");

  const [showPwd, setShowPwd] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isPwdSaving, setIsPwdSaving] = useState(false);

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

  // ---- 头像 ----
  const handleChangeAvatar = useCallback(() => {
    Taro.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    })
      .then((res) => {
        const path = res.tempFilePaths && res.tempFilePaths[0];
        if (!path) return;
        setAvatarPreview(path);
        setAvatarUrl(path); // 保存时会把临时路径作为 avatar_url 上传
      })
      .catch(() => {});
  }, []);

  // ---- 保存资料 ----
  const handleSave = useCallback(() => {
    if (isSaving) return;

    if (!username.trim()) {
      return Taro.showToast({ title: "用户名不能为空", icon: "none" });
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email.trim())) {
      return Taro.showToast({ title: "邮箱格式不正确", icon: "none" });
    }

    setIsSaving(true);
    apiUpdateProfile({
      username: username.trim(),
      email: email.trim(),
      avatar_url: avatarUrl && avatarUrl.startsWith("http")
        ? undefined
        : avatarUrl,
    })
      .then(() => refreshUser?.())
      .then(() => {
        Taro.showToast({ title: "保存成功", icon: "success" });
        setTimeout(() => Taro.navigateBack(), 600);
      })
      .catch((err: any) =>
        Taro.showToast({
          title: err?.message || "保存失败，请重试",
          icon: "none",
        }),
      )
      .finally(() => setIsSaving(false));
  }, [isSaving, username, email, avatarUrl, refreshUser]);

  // ---- 修改密码 ----
  const openChangePwd = useCallback(() => {
    setOldPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setShowPwd(true);
  }, []);

  const closeChangePwd = useCallback(() => {
    if (isPwdSaving) return;
    setShowPwd(false);
  }, [isPwdSaving]);

  const handleChangePwd = useCallback(() => {
    if (isPwdSaving) return;

    if (!oldPwd) {
      return Taro.showToast({ title: "请输入当前密码", icon: "none" });
    }
    if (newPwd.length < 6) {
      return Taro.showToast({ title: "新密码至少 6 位", icon: "none" });
    }
    if (newPwd !== confirmPwd) {
      return Taro.showToast({ title: "两次密码不一致", icon: "none" });
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPwd)) {
      return Taro.showToast({
        title: "需含大小写字母和数字",
        icon: "none",
      });
    }

    setIsPwdSaving(true);
    apiChangePassword({
      oldPassword: oldPwd,
      newPassword: newPwd,
      confirmPassword: confirmPwd,
    })
      .then(() => {
        Taro.showToast({ title: "密码修改成功", icon: "success" });
        setShowPwd(false);
        setOldPwd("");
        setNewPwd("");
        setConfirmPwd("");
      })
      .catch((err: any) =>
        Taro.showToast({
          title: err?.message || "修改失败，请重试",
          icon: "none",
        }),
      )
      .finally(() => setIsPwdSaving(false));
  }, [isPwdSaving, oldPwd, newPwd, confirmPwd]);

  return (
    <PageLayout className="edit-profile-page">
      {/* ===== 头像区 ===== */}
      <View className="edit-avatar-wrap" onClick={handleChangeAvatar}>
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
        <Text className="edit-avatar-tip">点击更换头像</Text>
      </View>

      {/* ===== 资料表单 ===== */}
      <View className="edit-form">
        <View className="edit-row">
          <Text className="edit-label">用户名</Text>
          <Input
            className="edit-input"
            value={username}
            maxLength={50}
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
      <View className="edit-save-wrap">
        <View
          className={`edit-save-btn ${isSaving ? "disabled" : ""}`}
          onClick={handleSave}
        >
          <Text className="edit-save-text">
            {isSaving ? "保存中..." : "保存"}
          </Text>
        </View>
      </View>

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
              <View
                className={`pwd-btn pwd-cancel ${isPwdSaving ? "disabled" : ""}`}
                onClick={closeChangePwd}
              >
                <Text>取消</Text>
              </View>
              <View
                className={`pwd-btn pwd-ok ${isPwdSaving ? "disabled" : ""}`}
                onClick={handleChangePwd}
              >
                <Text>{isPwdSaving ? "提交中..." : "确认"}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </PageLayout>
  );
}
