/**
 * 已保存账号管理 — Taro Storage CRUD
 * 仅存储 token（不再存储密码，T-C1）
 */

import Taro from '@tarojs/taro';

export interface SavedAccount {
  email: string;
  token?: string;
  username?: string;
  avatar_url?: string;
}

const SAVED_ACCOUNTS_KEY = 'saved_accounts';

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

/** 保存账号（仅 token，不再存储密码 — T-C1） */
export const saveAccount = (account: {
  email: string;
  token?: string;
  username?: string;
  avatar_url?: string;
}): void => {
  const accounts = getSavedAccounts();
  const idx = accounts.findIndex((a) => a.email === account.email);
  const entry: SavedAccount = {
    email: account.email,
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
