/**
 * API service — Taro.request based HTTP client.
 * Base URL from TARO_APP_API_BASE_URL env.
 */
import Taro from "@tarojs/taro";
import type { ApiEnvelope, ApiErrorPayload, UserProfile } from "../types";
import { ERROR_REQUEST_FAILED, ERROR_NETWORK, ERROR_REQUEST_TIMEOUT_COLD_START, ERROR_SESSION_EXPIRED, ERROR_NOT_LOGGED_IN } from "../utils/errorCopy";
import { STORAGE_ACCESS_TOKEN_TARO, STORAGE_REFRESH_TOKEN, STORAGE_CURRENT_BOOK_ID } from "../utils/storageKeys";
import { API_PATHS } from "../utils/apiPaths";

const DEFAULT_API_BASE_URL = "https://zlspace.site/api";
// ⚠️ 编译期由 config/index.ts 的 defineConstants 将下方 token 直接替换为字面量字符串：
//     开发环境 → TARO_APP_API_BASE_URL（默认 http://127.0.0.1:3000/api，真机可改局域网 IP）
//     生产环境 → https://zlspace.site/api（或 .env.production）
// 必须写成 process.env.TARO_APP_API_BASE_URL（无 ?. 可选链），否则 defineConstants 的纯文本替换匹配不到。
// 小程序运行时没有 Node 的 process，绝不能依赖运行时 process.env，只能靠编译期替换。
export const API_BASE_URL: string =
  process.env.TARO_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

const AUTH_TOKEN_KEY = STORAGE_ACCESS_TOKEN_TARO; // 访问令牌（短，请求携带）
const AUTH_REFRESH_TOKEN_KEY = STORAGE_REFRESH_TOKEN; // 刷新令牌（长，仅用于换发）
const BOOK_ID_KEY = STORAGE_CURRENT_BOOK_ID;

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

// ---- Token helpers (T-M11: 内存缓存，避免每次请求同步读存储) ----
let _tokenCache: string | null = null; // 访问令牌（access）
let _refreshCache: string | null = null; // 刷新令牌（refresh）
let _bookIdCache: string | null = null;

/** T-C3: 从 Storage 回填内存缓存，解决冷启动后 hasToken() 恒为 false */
export function hydrateAuthFromStorage(): void {
  try {
    _tokenCache = Taro.getStorageSync(AUTH_TOKEN_KEY) || null;
  } catch {}
  try {
    _refreshCache = Taro.getStorageSync(AUTH_REFRESH_TOKEN_KEY) || null;
  } catch {}
  try {
    _bookIdCache = Taro.getStorageSync(BOOK_ID_KEY) || null;
  } catch {}
}

export const getToken = (): string | null => _tokenCache;
export const getRefreshToken = (): string | null => _refreshCache;
export const hasToken = (): boolean => Boolean(_tokenCache);

/** 持久化访问令牌 + 刷新令牌（登录/注册/刷新成功后调用） */
export const storeTokens = (accessToken: string, refreshToken: string): void => {
  _tokenCache = accessToken;
  _refreshCache = refreshToken;
  try { Taro.setStorageSync(AUTH_TOKEN_KEY, accessToken); } catch {}
  try { Taro.setStorageSync(AUTH_REFRESH_TOKEN_KEY, refreshToken); } catch {}
};

/** 仅更新访问令牌（刷新后调用） */
export const storeAccessToken = (accessToken: string): void => {
  _tokenCache = accessToken;
  try { Taro.setStorageSync(AUTH_TOKEN_KEY, accessToken); } catch {}
};

/** 兼容别名：写入访问令牌（单值场景） */
export const storeToken = (token: string): void => {
  _tokenCache = token;
  try { Taro.setStorageSync(AUTH_TOKEN_KEY, token); } catch {}
};

export const clearStoredToken = (): void => {
  _tokenCache = null;
  _refreshCache = null;
  try { Taro.removeStorageSync(AUTH_TOKEN_KEY); } catch {}
  try { Taro.removeStorageSync(AUTH_REFRESH_TOKEN_KEY); } catch {}
};

// ---- 自动刷新（single-flight）----
// 并发 401 共享同一个刷新 Promise，避免刷新风暴；刷新成功后重试原请求
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

const tryRefresh = (): Promise<{ accessToken: string; refreshToken: string }> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new ApiError(ERROR_SESSION_EXPIRED, 401);
      }
      const data = await request<{ user: UserProfile; accessToken: string; refreshToken: string }>(
        "POST",
        API_PATHS.auth.refresh,
        { data: { refreshToken }, silent: true, _internalRefresh: true },
      );
      storeTokens(data.accessToken, data.refreshToken);
      return data;
    })().then(
      (v) => {
        refreshPromise = null;
        return v;
      },
      (e) => {
        refreshPromise = null;
        throw e;
      },
    );
  }
  return refreshPromise;
};

export const getStoredBookId = (): string | null => _bookIdCache;
export const setStoredBookId = (id: string | null): void => {
  _bookIdCache = id;
  if (id) {
    try { Taro.setStorageSync(BOOK_ID_KEY, id); } catch {}
  } else {
    try { Taro.removeStorageSync(BOOK_ID_KEY); } catch {}
  }
};

// ---- API Client (Taro.request wrapper) ----
interface RequestOptions {
  data?: unknown;
  /** 是否静默：401 不清理 token，不跳转登录页 */
  silent?: boolean;
  /** 是否需要认证（默认 true，token 不存在时静默返回 401） */
  requiresAuth?: boolean;
  /** 内部：标记刷新请求本身，避免 401 时递归触发自动刷新 */
  _internalRefresh?: boolean;
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  arg2?: RequestOptions | unknown,
): Promise<T> {
  // 兼容两种调用方式：
  //   request("POST", url, data)           - 旧方式：第二参数是请求体
  //   request("POST", url, { data, silent }) - 新方式：第二参数是 options
  let data: unknown = undefined;
  let silent = false;
  let requiresAuth = false; // 默认不需要认证（与PC端保持一致），需要认证的接口显式指定
  let internalRefresh = false; // 内部：标记刷新请求本身，避免递归触发自动刷新

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
      requiresAuth = opts.requiresAuth ?? requiresAuth;
      internalRefresh = opts._internalRefresh ?? false;
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
    throw new ApiError(ERROR_NOT_LOGGED_IN, 401);
  }

  // T-M8: GET 请求 30s 超时，写操作 60s 超时（匹配前端行为）
  const timeout = method === 'GET' ? 30000 : 60000;

  try {
    const res = await Taro.request({
      url: fullUrl,
      method,
      header,
      data,
      timeout,
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      // 防御性解析：部分 Taro 环境下 res.data 可能是字符串而非已解析的对象
      let parsed: unknown = res.data;
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          // 非 JSON 字符串，原样返回
          return parsed as unknown as T;
        }
      }
      const payload = parsed as ApiEnvelope<T>;
      if (
        payload &&
        typeof payload === "object" &&
        "success" in payload &&
        "data" in payload
      ) {
        return payload.data as T;
      }
      return parsed as T;
    }

    // HTTP error
    const errorData = res.data as ApiErrorPayload;
    const message = errorData?.message || ERROR_REQUEST_FAILED;
    const apiError = new ApiError(message, res.statusCode, errorData?.code);

    if (res.statusCode === 401) {
      // 双 Token：尝试用 refresh 换发新的 access，成功则重试原请求
      if (!internalRefresh && getRefreshToken()) {
        try {
          await tryRefresh();
          // 用新 access token 重试（_internalRefresh 防止刷新请求自身递归）
          return request<T>(method, url, {
            data,
            silent,
            requiresAuth,
            _internalRefresh: true,
          });
        } catch {
          // 刷新失败，继续走下面的 401 处理
        }
      }
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
            // T-M33: 401 使用 reLaunch 清空页面栈，防止返回键回到已登录页面
            Taro.reLaunch({ url: "/pages/User/Login/index" });
          }, 100);
        }
      }
    }

    throw apiError;
  } catch (err) {
    if (err instanceof ApiError) throw err;

    const taroErr = err as { errMsg?: string };
    if (taroErr?.errMsg) {
      const msg = taroErr.errMsg;
      // 超时/失败时提示可能冷启动，避免用户以为卡死
      if (/timeout|超时|fail/i.test(msg)) {
        throw new ApiError(ERROR_REQUEST_TIMEOUT_COLD_START, 0);
      }
      throw new ApiError(msg, 0);
    }
    throw new ApiError(ERROR_NETWORK, 0);
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
export const apiPatch = <T>(url: string, arg2?: unknown) =>
  request<T>("PATCH", url, arg2);

export const redirectToLogin = (): void => {
  Taro.navigateTo({ url: "/pages/User/Login/index" });
};
