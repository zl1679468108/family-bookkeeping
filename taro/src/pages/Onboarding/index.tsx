/**
 * Onboarding — 新用户首次引导（对齐 PC 端 /onboarding）
 * 已登录且无任何账本时进入：
 *   1. 创建账本（名称 / 描述 / 图标）
 *   2. 使用邀请码加入家人已创建的账本
 * 完成后刷新账本列表并进入首页。
 */
import { useState, useRef } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { createBook, joinByInvitation } from "../../services/booksApi";
import { ApiError } from "../../services/api";
import { useBookContext } from "../../context/BookContext";
import { useTheme } from "../../context/ThemeContext";
import { useNavBarTheme } from "../../hooks/useNavBarTheme";
import { BOOK_ICONS, renderBookIconSvg } from "../../utils/bookIcons";
import "./index.scss";

type Mode = "choice" | "create" | "join";

export default function Onboarding() {
  const { isDark } = useTheme();
  useNavBarTheme();
  const { refetchBooks, switchBook } = useBookContext();

  const [mode, setMode] = useState<Mode>("choice");

  // 创建账本表单
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("default");

  // 加入表单
  const [code, setCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const resetSubmitting = () => {
    submittingRef.current = false;
    setSubmitting(false);
  };

  const goChoice = () => setMode("choice");

  const handleCreate = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: "请输入名称", icon: "none" });
      return;
    }
    setSubmitting(true);
    try {
      const newBook = await createBook({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
      });
      const list = await refetchBooks();
      const target = list.find((b) => b.id === newBook.id) || newBook;
      switchBook(target);
      Taro.reLaunch({ url: "/pages/Home/index" });
    } catch (err) {
      Taro.showToast({
        title: err instanceof ApiError ? err.message : "创建失败，请重试",
        icon: "none",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      Taro.showToast({ title: "请输入邀请码", icon: "none" });
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    // 兜底：无论任何原因，5 秒后强制结束 loading
    let safetyTimer: any;
    const done = () => {
      if (safetyTimer) clearTimeout(safetyTimer);
      safetyTimer = undefined;
      resetSubmitting();
    };

    safetyTimer = setTimeout(() => {
      resetSubmitting();
    }, 3000);

    joinByInvitation(trimmed)
      .then((res) => refetchBooks().then((list) => ({ res, list })))
      .then(({ res, list }) => {
        const joined =
          list.find((b) => b.id === res.book_id) || list[0] || null;
        if (joined) switchBook(joined);
        Taro.reLaunch({ url: "/pages/Home/index" });
      })
      .catch((err) => {
        try {
          Taro.showToast({
            title: (err instanceof ApiError ? err.message : "邀请码无效或已过期").slice(0, 20),
            icon: "none",
          });
        } catch {}
      })
      .then(() => {
        done();
      });
  };

  return (
    <View className={`ob-page ${isDark ? "theme-dark" : ""}`}>
      {/* 品牌区 */}
      <View className="ob-brand">
        <View className="ob-logo">
          <Text className="ob-logo-text">静</Text>
        </View>
        <Text className="ob-title">欢迎来到静记</Text>
        <Text className="ob-subtitle">
          创建属于你自己的账本，或通过邀请码加入他人的账本
        </Text>
      </View>

      {mode === "choice" && (
        <View className="ob-options">
          <View className="ob-opt" onClick={() => setMode("create")}>
            <View className="ob-opt__icon">
              <Image
                src={renderBookIconSvg("default", 26, "#2D9D8A")}
                mode="aspectFit"
                style={{ width: "26px", height: "26px", display: "block" }}
              />
            </View>
            <View className="ob-opt__text">
              <Text className="ob-opt__title">我自己创建账本</Text>
              <Text className="ob-opt__desc">新建一个空账本，开始记录收支</Text>
            </View>
          </View>

          <View className="ob-opt" onClick={() => setMode("join")}>
            <View className="ob-opt__icon ob-opt__icon--join">
              <Text className="ob-opt__invite">邀</Text>
            </View>
            <View className="ob-opt__text">
              <Text className="ob-opt__title">使用邀请码加入</Text>
              <Text className="ob-opt__desc">
                输入他人分享的邀请码，加入已有账本
              </Text>
            </View>
          </View>
        </View>
      )}

      {mode === "create" && (
        <View className="ob-form">
          <View className="ob-nav">
            <Text className="ob-nav__back" onClick={goChoice}>
              ‹ 返回
            </Text>
            <Text className="ob-nav__title">创建账本</Text>
            <View className="ob-nav__spacer" />
          </View>

          <View className="ob-row">
            <Text className="ob-label">账本名称</Text>
            <Input
              className="ob-input"
              placeholder="如：家庭账本"
              maxlength={50}
              value={name}
              onInput={(e: any) => setName(e.detail.value)}
            />
          </View>

          <View className="ob-row">
            <Text className="ob-label">描述（可选）</Text>
            <Input
              className="ob-input"
              placeholder="简单介绍一下这个账本"
              maxlength={200}
              value={description}
              onInput={(e: any) => setDescription(e.detail.value)}
            />
          </View>

          <Text className="ob-section-label">图标</Text>
          <View className="ob-grid">
            {BOOK_ICONS.map((item) => {
              const selected = icon === item.key;
              return (
                <View
                  key={item.key}
                  className={`ob-grid__item ${
                    selected ? "ob-grid__item--selected" : ""
                  }`}
                  onClick={() => setIcon(item.key)}
                >
                  <Image
                    src={renderBookIconSvg(
                      item.key,
                      20,
                      selected ? "#2D9D8A" : "#1A1C19",
                    )}
                    mode="aspectFit"
                    style={{ width: "20px", height: "20px", display: "block" }}
                  />
                  <Text
                    className={`ob-grid__label ${
                      selected ? "ob-grid__label--selected" : ""
                    }`}
                  >
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>

          <View
            className={`ob-submit ${submitting ? "ob-submit--disabled" : ""}`}
            onClick={() => !submitting && handleCreate()}
          >
            <Text>{submitting ? "创建中…" : "创建账本"}</Text>
          </View>
        </View>
      )}

      {mode === "join" && (
        <View className="ob-form">
          <View className="ob-nav">
            <Text className="ob-nav__back" onClick={goChoice}>
              ‹ 返回
            </Text>
            <Text className="ob-nav__title">输入邀请码加入</Text>
            <View className="ob-nav__spacer" />
          </View>

          <View className="ob-row">
            <Text className="ob-label">邀请码</Text>
            <Input
              className="ob-input ob-input--code"
              placeholder="请输入邀请码"
              maxlength={32}
              value={code}
              onInput={(e: any) => setCode(e.detail.value.toUpperCase())}
            />
          </View>

          <Text className="ob-hint">
            邀请码获取方式：由账主在「账本详情 → 生成邀请码」中生成，有效期为 7 天。
          </Text>

          <View
            className={`ob-submit ${submitting ? "ob-submit--disabled" : ""}`}
            onClick={() => !submitting && handleJoin()}
          >
            <Text>{submitting ? "加入中…" : "加入账本"}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
