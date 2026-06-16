/**
 * Auth API service — login, register, profile.
 */

import { apiGet, apiPost } from "./api";
import type { AuthResponse, UserProfile } from "../types";

export const login = (email: string, password: string): Promise<AuthResponse> =>
  apiPost<AuthResponse>("/auth/login", { email, password });

export const register = (
  email: string,
  password: string,
  username: string,
): Promise<AuthResponse> =>
  apiPost<AuthResponse>("/auth/register", { email, password, username });

export const getProfile = (): Promise<UserProfile> =>
  apiGet<UserProfile>("/auth/profile");

/** 更新用户个人资料（用户名 / 邮箱 / 头像） */
export const updateProfile = (payload: {
  username: string;
  email: string;
  avatar_url?: string;
}): Promise<UserProfile> =>
  apiPost<UserProfile>("/auth/profile", payload);

/** 修改密码 */
export const changePassword = (payload: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success: boolean; message: string }> =>
  apiPost<{ success: boolean; message: string }>(
    "/auth/change-password",
    payload,
  );

export const logout = (): Promise<void> => apiPost<void>("/auth/logout");

export const sendResetCode = (
  email: string,
): Promise<{ success: boolean; message: string }> =>
  apiPost<{ success: boolean; message: string }>("/auth/send-reset-code", {
    email,
  });

export const resetPasswordByCode = (
  email: string,
  code: string,
  password: string,
): Promise<{ success: boolean; message: string }> =>
  apiPost<{ success: boolean; message: string }>(
    "/auth/reset-password-by-code",
    { email, code, password },
  );
