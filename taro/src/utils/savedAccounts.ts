/**
 * 已保存账号管理 — Taro Storage CRUD
 * T-C1: token 不再存在 saved_accounts JSON 中，改为独立 key 存储
 */

import Taro from '@tarojs/taro';

export interface SavedAccount {
  email: string;
  username?: string;
  avatar_url?: string;
}

const SAVED_ACCOUNTS_KEY = 'saved_accounts';

// ---- Token 独立存储（T-C1）----

/** 简单 hash 用于 key，避免 email 特殊字符 */
function emailHash(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) {
    h = ((h << 5) - h + email.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function tokenKey(email: string): string {
  return `account_token_${emailHash(email)}`;
}

/** 刷新令牌独立存储 key（双 Token） */
function refreshTokenKey(email: string): string {
  return `account_refresh_token_${emailHash(email)}`;
}

/** 读取指定账号的 token */
export function getAccountToken(email: string): string | null {
  try {
    return Taro.getStorageSync(tokenKey(email)) || null;
  } catch {
    return null;
  }
}

/** 保存指定账号的 token */
export function setAccountToken(email: string, token: string): void {
  try {
    Taro.setStorageSync(tokenKey(email), token);
  } catch {}
}

/** 删除指定账号的 token */
export function removeAccountToken(email: string): void {
  try {
    Taro.removeStorageSync(tokenKey(email));
  } catch {}
}

/** 读取指定账号的刷新令牌 */
export function getAccountRefreshToken(email: string): string | null {
  try {
    return Taro.getStorageSync(refreshTokenKey(email)) || null;
  } catch {
    return null;
  }
}

/** 保存指定账号的刷新令牌 */
export function setAccountRefreshToken(email: string, token: string): void {
  try {
    Taro.setStorageSync(refreshTokenKey(email), token);
  } catch {}
}

/** 删除指定账号的刷新令牌 */
export function removeAccountRefreshToken(email: string): void {
  try {
    Taro.removeStorageSync(refreshTokenKey(email));
  } catch {}
}

// ---- Legacy 迁移（T-C1）----

/** T-C1: Legacy 迁移 — 清除旧 saved_accounts 中的 password 和 token 字段，token 迁移到独立 key */
export function migrateSavedAccounts(): void {
  try {
    const raw = Taro.getStorageSync(SAVED_ACCOUNTS_KEY);
    if (!raw) return;
    const accounts = JSON.parse(raw);
    if (!Array.isArray(accounts)) return;

    let dirty = false;
    for (const acc of accounts) {
      // 迁移 token 到独立 key
      if (acc.token && acc.email) {
        setAccountToken(acc.email, acc.token);
        delete acc.token;
        dirty = true;
      }
      // 清除 password 字段
      if ('password' in acc) {
        delete (acc as Record<string, unknown>).password;
        dirty = true;
      }
    }
    if (dirty) {
      Taro.setStorageSync(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
    }
  } catch {
    // 静默失败，不影响启动
  }
}

export const getSavedAccounts = (): SavedAccount[] => {
  try {
    const raw = Taro.getStorageSync(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveAccounts = (accounts: SavedAccount[]): void => {
  Taro.setStorageSync(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
};

/** 保存账号（T-C1: token 单独存储；双 Token 独立存 access + refresh） */
export const saveAccount = (account: {
  email: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  avatar_url?: string;
}): void => {
  // T-C1: token 单独存储
  const accessToken = account.accessToken ?? account.token;
  if (accessToken) {
    setAccountToken(account.email, accessToken);
  }
  if (account.refreshToken) {
    setAccountRefreshToken(account.email, account.refreshToken);
  }

  const accounts = getSavedAccounts();
  const idx = accounts.findIndex((a) => a.email === account.email);
  const entry: SavedAccount = {
    email: account.email,
    username: account.username,
    avatar_url: account.avatar_url,
  };
  if (idx >= 0) {
    accounts[idx] = entry;
  } else {
    accounts.push(entry);
  }
  saveAccounts(accounts);
};

/** 删除已保存账号（T-C1: 同时删除独立存储的 token） */
export const removeAccount = (email: string): void => {
  const accounts = getSavedAccounts().filter((a) => a.email !== email);
  saveAccounts(accounts);
  removeAccountToken(email);
  removeAccountRefreshToken(email);
};

/** 更新账号信息（T-C1: token 通过 setAccountToken 单独更新） */
export const updateAccountInfo = (email: string, info: { username?: string; avatar_url?: string }): void => {
  const accounts = getSavedAccounts();
  const idx = accounts.findIndex((a) => a.email === email);
  if (idx >= 0) {
    if (info.username !== undefined) accounts[idx].username = info.username;
    if (info.avatar_url !== undefined) accounts[idx].avatar_url = info.avatar_url;
    saveAccounts(accounts);
  }
};
