/**
 * API service — Taro.request based HTTP client.
 * Base URL from TARO_APP_API_BASE_URL env.
 */
import Taro from "@tarojs/taro";
import type { ApiEnvelope, ApiErrorPayload } from "../types";

export const API_BASE_URL: string =
  (typeof process !== "undefined" && process.env?.TARO_APP_API_BASE_URL) ||
  "http://localhost:3000/api";

const AUTH_TOKEN_KEY = "auth_token";
const BOOK_ID_KEY = "current_book_id";

/** Custom API error class */
export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

// ---- Token helpers (Taro Storage) ----
export const getToken = (): string | null =>
  Taro.getStorageSync(AUTH_TOKEN_KEY) || null;
export const hasToken = (): boolean => Boolean(getToken());
export const storeToken = (token: string): void => {
  Taro.setStorageSync(AUTH_TOKEN_KEY, token);
};
export const clearStoredToken = (): void => {
  Taro.removeStorageSync(AUTH_TOKEN_KEY);
};

export const getStoredBookId = (): string | null =>
  Taro.getStorageSync(BOOK_ID_KEY) || null;
export const setStoredBookId = (id: string | null): void => {
  if (id) {
    Taro.setStorageSync(BOOK_ID_KEY, id);
  } else {
    Taro.removeStorageSync(BOOK_ID_KEY);
  }
};

// ---- API Client (Taro.request wrapper) ----
async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  data?: unknown,
): Promise<T> {
  const fullUrl = `${API_BASE_URL}${url}`;
  const token = getToken();
  const bookId = getStoredBookId();

  const header: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) header["Authorization"] = `Bearer ${token}`;
  if (bookId) header["x-book-id"] = bookId;

  try {
    const res = await Taro.request({
      url: fullUrl,
      method,
      header,
      data,
      timeout: 15000,
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      const payload = res.data as ApiEnvelope<T>;
      if (
        payload &&
        typeof payload === "object" &&
        "success" in payload &&
        "data" in payload
      ) {
        return payload.data as T;
      }
      return res.data as T;
    }

    // HTTP error
    const errorData = res.data as ApiErrorPayload;
    const message = errorData?.message || "请求失败";
    const apiError = new ApiError(message, res.statusCode, errorData?.code);

    if (res.statusCode === 401) {
      clearStoredToken();
      // Don't redirect if we're already on an auth page (login/register/forgot-password)
      const pages = Taro.getCurrentPages();
      const currentPath =
        pages.length > 0 ? pages[pages.length - 1].route || "" : "";
      if (
        ![
          "pages/User/Login/index",
          "pages/User/Register/index",
          "pages/User/ForgotPassword/index",
        ].includes(currentPath)
      ) {
        setTimeout(() => {
          Taro.navigateTo({ url: "/pages/User/Login/index" });
        }, 100);
      }
    }

    throw apiError;
  } catch (err) {
    if (err instanceof ApiError) throw err;

    const taroErr = err as { errMsg?: string };
    if (taroErr?.errMsg) {
      throw new ApiError(taroErr.errMsg, 0);
    }
    throw new ApiError("网络错误，请检查网络连接", 0);
  }
}

// Convenience methods
export const apiGet = <T>(url: string) => request<T>("GET", url);
export const apiPost = <T>(url: string, data?: unknown) =>
  request<T>("POST", url, data);
export const apiPut = <T>(url: string, data?: unknown) =>
  request<T>("PUT", url, data);
export const apiDelete = <T>(url: string) => request<T>("DELETE", url);

export const redirectToLogin = (): void => {
  Taro.navigateTo({ url: "/pages/User/Login/index" });
};
