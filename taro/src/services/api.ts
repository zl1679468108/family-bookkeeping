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
interface RequestOptions {
  data?: unknown;
  /** 是否静默：401 不清理 token，不跳转登录页 */
  silent?: boolean;
  /** 是否需要认证（默认 true，token 不存在时静默返回 401） */
  requiresAuth?: boolean;
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  arg2?: RequestOptions | unknown,
): Promise<T> {
  // 兼容两种调用方式：
  //   request("POST", url, data)           - 旧方式：第二参数是请求体
  //   request("POST", url, { data, silent }) - 新方式：第二参数是 options
  let data: unknown = undefined;
  let silent = false;
  let requiresAuth = false; // 默认不需要认证（与PC端保持一致），需要认证的接口显式指定

  if (arg2 !== undefined) {
    if (
      typeof arg2 === "object" &&
      arg2 !== null &&
      ("data" in arg2 || "silent" in arg2 || "requiresAuth" in (arg2 as object))
    ) {
      // options 对象
      const opts = arg2 as RequestOptions;
      data = opts.data;
      silent = opts.silent ?? false;
      requiresAuth = opts.requiresAuth ?? requiresAuth; // 使用已有默认值，不是硬编码true
    } else {
      // 直接作为请求体 data
      data = arg2;
    }
  }

  const fullUrl = `${API_BASE_URL}${url}`;
  const token = getToken();
  const bookId = getStoredBookId();

  const header: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) header["Authorization"] = `Bearer ${token}`;
  if (bookId) header["x-book-id"] = bookId;

  // 需要认证但没有 token：静默模式下直接抛 401
  if (requiresAuth && !token && silent) {
    throw new ApiError("未登录", 401);
  }

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
      if (!silent) {
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

// Convenience methods - 签名保持兼容：apiPost(url, data) 或 apiPost(url, { data, silent })
export const apiGet = <T>(url: string, options?: RequestOptions) =>
  request<T>("GET", url, options);
export const apiPost = <T>(url: string, arg2?: unknown) =>
  request<T>("POST", url, arg2);
export const apiPut = <T>(url: string, arg2?: unknown) =>
  request<T>("PUT", url, arg2);
export const apiDelete = <T>(url: string, options?: RequestOptions) =>
  request<T>("DELETE", url, options);

export const redirectToLogin = (): void => {
  Taro.navigateTo({ url: "/pages/User/Login/index" });
};
