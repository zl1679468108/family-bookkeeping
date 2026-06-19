/**
 * 已保存账号管理 — Taro Storage CRUD
 * 切换账号时优先使用已存储的 token，token 失效才用密码登录
 */

import Taro from '@tarojs/taro';

export interface SavedAccount {
  email: string;
  password: string; // Base64 编码
  token?: string;  // JWT token
  username?: string;
  avatar_url?: string;
}

const SAVED_ACCOUNTS_KEY = 'saved_accounts';
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const encode = (text: string): string => {
  const bytes = encodeUtf8(text);
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const combined = (byte1 << 16) | (byte2 << 8) | byte3;

    result += BASE64_CHARS[(combined >> 18) & 63];
    result += BASE64_CHARS[(combined >> 12) & 63];
    result += i + 1 < bytes.length ? BASE64_CHARS[(combined >> 6) & 63] : '=';
    result += i + 2 < bytes.length ? BASE64_CHARS[combined & 63] : '=';
  }

  return result;
};

const decode = (encoded: string): string => {
  try {
    const clean = encoded.replace(/[^A-Za-z0-9+/=]/g, '');
    const bytes: number[] = [];

    for (let i = 0; i < clean.length; i += 4) {
      const chunk =
        (BASE64_CHARS.indexOf(clean[i]) << 18) |
        (BASE64_CHARS.indexOf(clean[i + 1]) << 12) |
        ((clean[i + 2] === '=' ? 0 : BASE64_CHARS.indexOf(clean[i + 2])) << 6) |
        (clean[i + 3] === '=' ? 0 : BASE64_CHARS.indexOf(clean[i + 3]));

      bytes.push((chunk >> 16) & 255);
      if (clean[i + 2] !== '=') bytes.push((chunk >> 8) & 255);
      if (clean[i + 3] !== '=') bytes.push(chunk & 255);
    }

    return decodeUtf8(bytes);
  } catch {
    return '';
  }
};

const encodeUtf8 = (text: string): number[] => {
  const bytes: number[] = [];

  for (let i = 0; i < text.length; i += 1) {
    let codePoint = text.charCodeAt(i);

    if (codePoint >= 0xd800 && codePoint <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + (next - 0xdc00);
        i += 1;
      }
    }

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint < 0x10000) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }

  return bytes;
};

const decodeUtf8 = (bytes: number[]): string => {
  let result = '';

  for (let i = 0; i < bytes.length; i += 1) {
    const byte = bytes[i];

    if (byte < 0x80) {
      result += String.fromCharCode(byte);
    } else if (byte >= 0xc0 && byte < 0xe0) {
      const codePoint = ((byte & 0x1f) << 6) | (bytes[++i] & 0x3f);
      result += String.fromCharCode(codePoint);
    } else if (byte >= 0xe0 && byte < 0xf0) {
      const codePoint =
        ((byte & 0x0f) << 12) |
        ((bytes[++i] & 0x3f) << 6) |
        (bytes[++i] & 0x3f);
      result += String.fromCharCode(codePoint);
    } else {
      const codePoint =
        ((byte & 0x07) << 18) |
        ((bytes[++i] & 0x3f) << 12) |
        ((bytes[++i] & 0x3f) << 6) |
        (bytes[++i] & 0x3f);
      const adjusted = codePoint - 0x10000;
      result += String.fromCharCode(
        0xd800 + (adjusted >> 10),
        0xdc00 + (adjusted & 0x3ff),
      );
    }
  }

  return result;
};

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

/** 保存账号（同邮箱更新） */
export const saveAccount = (account: {
  email: string;
  password: string;
  token?: string;
  username?: string;
  avatar_url?: string;
}): void => {
  const accounts = getSavedAccounts();
  const encodedPassword = encode(account.password);
  const idx = accounts.findIndex((a) => a.email === account.email);
  const entry: SavedAccount = {
    email: account.email,
    password: encodedPassword,
    token: account.token,
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

/** 删除已保存账号 */
export const removeAccount = (email: string): void => {
  const accounts = getSavedAccounts().filter((a) => a.email !== email);
  saveAccounts(accounts);
};

/** 解码密码 */
export const decodePassword = (encoded: string): string => decode(encoded);

/** 更新账号信息 */
export const updateAccountInfo = (email: string, info: { username?: string; avatar_url?: string; token?: string }): void => {
  const accounts = getSavedAccounts();
  const idx = accounts.findIndex((a) => a.email === email);
  if (idx >= 0) {
    if (info.username !== undefined) accounts[idx].username = info.username;
    if (info.avatar_url !== undefined) accounts[idx].avatar_url = info.avatar_url;
    if (info.token !== undefined) accounts[idx].token = info.token;
    saveAccounts(accounts);
  }
};
