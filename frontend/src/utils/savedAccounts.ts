/**
 * 已保存账号管理 — localStorage CRUD
 * 仅存储 token（不存储密码），token 失效需重新登录
 */

export interface SavedAccount {
  email: string;
  /** 兼容别名：等同于 accessToken */
  token?: string;
  /** 访问令牌（短，请求携带） */
  accessToken?: string;
  /** 刷新令牌（长，仅用于换发） */
  refreshToken?: string;
  username?: string;
  avatar_url?: string;
}

const SAVED_ACCOUNTS_KEY = 'saved_accounts';

export const getSavedAccounts = (): SavedAccount[] => {
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveAccounts = (accounts: SavedAccount[]): void => {
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
};

/** 保存账号（同邮箱更新，存储 access + refresh 双令牌） */
export const saveAccount = (account: {
  email: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  avatar_url?: string;
}): void => {
  const accounts = getSavedAccounts();
  const idx = accounts.findIndex((a) => a.email === account.email);
  const accessToken = account.accessToken ?? account.token;
  const entry: SavedAccount = {
    email: account.email,
    token: accessToken,
    accessToken,
    refreshToken: account.refreshToken,
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

/** 更新账号信息（登录后 profile 拿到最新信息时调用） */
export const updateAccountInfo = (email: string, info: {
  username?: string;
  avatar_url?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
}): void => {
  const accounts = getSavedAccounts();
  const idx = accounts.findIndex((a) => a.email === email);
  if (idx >= 0) {
    if (info.username !== undefined) accounts[idx].username = info.username;
    if (info.avatar_url !== undefined) accounts[idx].avatar_url = info.avatar_url;
    if (info.token !== undefined) accounts[idx].token = info.token;
    if (info.accessToken !== undefined) accounts[idx].accessToken = info.accessToken;
    if (info.refreshToken !== undefined) accounts[idx].refreshToken = info.refreshToken;
    saveAccounts(accounts);
  }
};
