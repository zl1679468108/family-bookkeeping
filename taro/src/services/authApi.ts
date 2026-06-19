/**
 * Auth API service — login, register, profile.
 */

import { apiGet, apiPost, apiPut } from "./api";
import type { AuthResponse, UserProfile } from "../types";

export const getCaptcha = (): Promise<{ captchaId: string; svg: string }> =>
  apiGet<{ captchaId: string; svg: string }>("/auth/captcha", { requiresAuth: false });

export const login = (
  email: string,
  password: string,
  captchaId: string,
  captchaCode: string,
): Promise<AuthResponse> =>
  apiPost<AuthResponse>("/auth/login", {
    data: { email, password, captchaId, captchaCode },
    requiresAuth: false,
  });

export const register = (
  email: string,
  password: string,
  username: string,
): Promise<AuthResponse> =>
  apiPost<AuthResponse>("/auth/register", {
    data: { email, password, username },
    requiresAuth: false,
  });

/** 切换账号（使用存储的凭据） */
export const switchAccount = (
  email: string,
  password: string,
  token?: string,
): Promise<AuthResponse> =>
  apiPost<AuthResponse>("/auth/switch-account", {
    data: { email, password, token: token || undefined },
    requiresAuth: false,
  });

export const getProfile = (): Promise<UserProfile> =>
  apiGet<UserProfile>("/auth/profile", { requiresAuth: true });

/** 更新用户个人资料（用户名 / 邮箱 / 头像）— 后端是 PUT */
export const updateProfile = (payload: {
  username: string;
  email: string;
  avatar_url?: string;
}): Promise<UserProfile> =>
  apiPut<UserProfile>("/auth/profile", { data: payload, requiresAuth: true });

/** 修改密码 */
export const changePassword = (payload: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success: boolean; message: string }> =>
  apiPost<{ success: boolean; message: string }>(
    "/auth/change-password",
    { data: payload, requiresAuth: true },
  );

export const logout = (): Promise<void> =>
  apiPost<void>("/auth/logout", { requiresAuth: true });

export const sendResetCode = (
  email: string,
): Promise<{ success: boolean; message: string }> =>
  apiPost<{ success: boolean; message: string }>("/auth/send-reset-code", {
    data: { email },
    requiresAuth: false,
  });

export const resetPasswordByCode = (
  email: string,
  code: string,
  password: string,
  confirmPassword: string,
): Promise<{ success: boolean; message: string }> =>
  apiPost<{ success: boolean; message: string }>(
    "/auth/reset-password-by-code",
    { data: { email, code, password, confirmPassword }, requiresAuth: false },
  );

/** 设置当前账本（同步到服务端） */
export const setCurrentBook = (
  bookId: string,
): Promise<{ book_id: string }> =>
  apiPut<{ book_id: string }>("/auth/current-book", {
    data: { book_id: bookId },
    requiresAuth: true,
  });
