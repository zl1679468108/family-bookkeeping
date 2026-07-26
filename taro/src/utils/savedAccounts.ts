/**
 * 已保存账号管理 — Taro Storage CRUD
 * T-C1: token 不在 saved_accounts JSON 中，改为独立 key 存储
 * 纯数组/类型逻辑见 shared-utils/src/savedAccounts.ts
 */
import Taro from "@tarojs/taro";
import {
  SAVED_ACCOUNTS_KEY,
  parseSavedAccounts,
  serializeSavedAccounts,
  buildSavedAccountEntry,
  upsertSavedAccount,
  removeSavedAccountByEmail,
  patchSavedAccount,
  migrateLegacySavedAccounts,
  accountTokenKey,
  accountRefreshTokenKey,
  type SaveAccountInput,
  type UpdateAccountInfoInput,
} from "../../../shared-utils/src/savedAccounts";

export type {
  SavedAccount,
  SaveAccountInput,
  UpdateAccountInfoInput,
} from "../../../shared-utils/src/savedAccounts";
export {
  SAVED_ACCOUNTS_KEY,
  emailHash,
  accountTokenKey,
  accountRefreshTokenKey,
  resolveAccessToken,
} from "../../../shared-utils/src/savedAccounts";

// ---- Token 独立存储（T-C1）----

export function getAccountToken(email: string): string | null {
  try {
    return Taro.getStorageSync(accountTokenKey(email)) || null;
  } catch {
    return null;
  }
}

export function setAccountToken(email: string, token: string): void {
  try {
    Taro.setStorageSync(accountTokenKey(email), token);
  } catch {
    /* ignore */
  }
}

export function removeAccountToken(email: string): void {
  try {
    Taro.removeStorageSync(accountTokenKey(email));
  } catch {
    /* ignore */
  }
}

export function getAccountRefreshToken(email: string): string | null {
  try {
    return Taro.getStorageSync(accountRefreshTokenKey(email)) || null;
  } catch {
    return null;
  }
}

export function setAccountRefreshToken(email: string, token: string): void {
  try {
    Taro.setStorageSync(accountRefreshTokenKey(email), token);
  } catch {
    /* ignore */
  }
}

export function removeAccountRefreshToken(email: string): void {
  try {
    Taro.removeStorageSync(accountRefreshTokenKey(email));
  } catch {
    /* ignore */
  }
}

/** T-C1: Legacy 迁移 — 清除 password/token 字段，token 迁到独立 key */
export function migrateSavedAccounts(): void {
  try {
    const raw = Taro.getStorageSync(SAVED_ACCOUNTS_KEY);
    if (!raw) return;
    const { accounts, migratedTokens, dirty } = migrateLegacySavedAccounts(
      parseSavedAccounts(typeof raw === "string" ? raw : JSON.stringify(raw)),
    );
    for (const { email, token } of migratedTokens) {
      setAccountToken(email, token);
    }
    if (dirty) {
      Taro.setStorageSync(SAVED_ACCOUNTS_KEY, serializeSavedAccounts(accounts));
    }
  } catch {
    // 静默失败
  }
}

export const getSavedAccounts = () => {
  try {
    const raw = Taro.getStorageSync(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    return parseSavedAccounts(typeof raw === "string" ? raw : JSON.stringify(raw));
  } catch {
    return [];
  }
};

const saveAccounts = (accounts: ReturnType<typeof getSavedAccounts>): void => {
  Taro.setStorageSync(SAVED_ACCOUNTS_KEY, serializeSavedAccounts(accounts));
};

/** 保存账号（token 单独存储） */
export const saveAccount = (account: SaveAccountInput): void => {
  const accessToken = account.accessToken ?? account.token;
  if (accessToken) setAccountToken(account.email, accessToken);
  if (account.refreshToken) setAccountRefreshToken(account.email, account.refreshToken);

  const entry = buildSavedAccountEntry(account, { includeTokens: false });
  saveAccounts(upsertSavedAccount(getSavedAccounts(), entry));
};

/** 删除已保存账号（同时删独立 token） */
export const removeAccount = (email: string): void => {
  saveAccounts(removeSavedAccountByEmail(getSavedAccounts(), email));
  removeAccountToken(email);
  removeAccountRefreshToken(email);
};

/** 更新账号资料（可选同步独立 token key） */
export const updateAccountInfo = (
  email: string,
  info: UpdateAccountInfoInput,
): void => {
  const accessToken = info.accessToken ?? info.token;
  if (accessToken) setAccountToken(email, accessToken);
  if (info.refreshToken) setAccountRefreshToken(email, info.refreshToken);
  saveAccounts(
    patchSavedAccount(getSavedAccounts(), email, {
      username: info.username,
      avatar_url: info.avatar_url,
    }),
  );
};
