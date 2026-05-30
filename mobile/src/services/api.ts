/**
 * API service — axios instance with interceptors.
 * Base URL from VITE_API_BASE_URL env variable.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiEnvelope, ApiErrorPayload } from '../types';

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const AUTH_TOKEN_KEY = 'auth_token';
const BOOK_ID_KEY = 'current_book_id';

/** Custom API error class */
export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// ---- Token helpers ----

export const getToken = (): string | null => localStorage.getItem(AUTH_TOKEN_KEY);
export const hasToken = (): boolean => Boolean(getToken());
export const storeToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};
export const clearStoredToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getStoredBookId = (): string | null => localStorage.getItem(BOOK_ID_KEY);
export const setStoredBookId = (id: string | null): void => {
  if (id) {
    localStorage.setItem(BOOK_ID_KEY, id);
  } else {
    localStorage.removeItem(BOOK_ID_KEY);
  }
};

// ---- Axios instance ----

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach auth token and book ID
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const bookId = getStoredBookId();
    if (bookId && config.headers) {
      config.headers['x-book-id'] = bookId;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: unwrap envelope, handle errors
apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiEnvelope<unknown>;
    // Unwrap envelope: requires both 'success' and 'data' fields
    if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
      return { ...response, data: payload.data };
    }
    return response;
  },
  (error: AxiosError<ApiErrorPayload>) => {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || error.message || '请求失败';
      const apiError = new ApiError(message, status, data?.code);

      // On 401, clear token and redirect to login
      if (status === 401) {
        clearStoredToken();
        if (!window.location.hash.startsWith('#/login')) {
          window.location.hash = '#/login';
        }
      }

      return Promise.reject(apiError);
    }
    return Promise.reject(new ApiError('网络错误，请检查网络连接', 0));
  },
);

export default apiClient;

/**
 * Helper: redirect to login preserving current path
 */
export const redirectToLogin = (): void => {
  if (window.location.hash.startsWith('#/login')) {
    return;
  }
  const currentPath = window.location.hash.replace(/^#/, '') || '/';
  const redirect = encodeURIComponent(currentPath);
  window.location.hash = `/login?redirect=${redirect}`;
};
