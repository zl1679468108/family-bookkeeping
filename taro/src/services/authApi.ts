/**
 * Auth API service — login, register, profile.
 */

import { apiGet, apiPost } from "./api";
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

export const getProfile = (): Promise<UserProfile> =>
  apiGet<UserProfile>("/auth/profile", { requiresAuth: true });

/** 更新用户个人资料（用户名 / 邮箱 / 头像） */
export const updateProfile = (payload: {
  username: string;
  email: string;
  avatar_url?: string;
}): Promise<UserProfile> =>
  apiPost<UserProfile>("/auth/profile", { data: payload, requiresAuth: true });

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
): Promise<{ success: boolean; message: string }> =>
  apiPost<{ success: boolean; message: string }>(
    "/auth/reset-password-by-code",
    { data: { email, code, password }, requiresAuth: false },
  );
