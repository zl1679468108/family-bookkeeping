/**
 * Auth API service.
 */
import { apiGet, apiPost, apiPut } from "./api";
import type { AuthResponse, UserProfile } from "../types";
import { API_PATHS } from "../utils/apiPaths";

export const getCaptcha = (): Promise<{ captchaId: string; svg: string }> =>
  apiGet<{ captchaId: string; svg: string }>(API_PATHS.auth.captcha, { requiresAuth: false });

export const login = (
  email: string,
  password: string,
  captchaId: string,
  captchaCode: string,
): Promise<AuthResponse> =>
  apiPost<AuthResponse>(API_PATHS.auth.login, {
    data: { email, password, captchaId, captchaCode },
    requiresAuth: false,
  });

export const register = (
  email: string,
  password: string,
  username: string,
): Promise<AuthResponse> =>
  apiPost<AuthResponse>(API_PATHS.auth.register, {
    data: { email, password, username },
    requiresAuth: false,
  });

export const switchAccount = (
  email: string,
  password: string,
  captchaId: string,
  captchaCode: string,
): Promise<AuthResponse> =>
  apiPost<AuthResponse>(API_PATHS.auth.switchAccount, {
    data: { email, password, captchaId, captchaCode },
    requiresAuth: false,
  });

export const getProfile = (): Promise<UserProfile> =>
  apiGet<UserProfile>(API_PATHS.auth.profile, { requiresAuth: true });

export const updateProfile = (payload: {
  username?: string;
  email?: string;
  avatar_url?: string;
}): Promise<UserProfile> =>
  apiPut<UserProfile>(API_PATHS.auth.profile, { data: payload, requiresAuth: true });

/** 修改密码 */
export const changePassword = (payload: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success: boolean; message: string }> =>
  apiPost<{ success: boolean; message: string }>(
    API_PATHS.auth.changePassword,
    { data: payload, requiresAuth: true },
  );

export const logout = (): Promise<void> =>
  apiPost<void>(API_PATHS.auth.logout, { requiresAuth: true });

/** 注销账号（软删除）— 需二次确认密码 */
export const deactivateAccount = (password: string): Promise<void> =>
  apiPost<void>(API_PATHS.auth.deactivate, {
    data: { password },
    requiresAuth: true,
  });

export const sendResetCode = (
  email: string,
): Promise<{ success: boolean; message: string }> =>
  apiPost<{ success: boolean; message: string }>(API_PATHS.auth.sendResetCode, {
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
    API_PATHS.auth.resetPasswordByCode,
    { data: { email, code, password, confirmPassword }, requiresAuth: false },
  );

/** 设置当前账本（同步到服务端） */
export const setCurrentBook = (
  bookId: string,
): Promise<{ book_id: string }> =>
  apiPut<{ book_id: string }>(API_PATHS.auth.currentBook, {
    data: { book_id: bookId },
    requiresAuth: true,
  });
