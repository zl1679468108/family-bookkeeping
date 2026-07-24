/**
 * 已保存账号管理 — localStorage CRUD
 * 仅存储 token（不存储密码），token 失效需重新登录
 * 纯数组/类型逻辑见 shared-utils/src/savedAccounts.ts
 */
import {
  SAVED_ACCOUNTS_KEY,
  parseSavedAccounts,
  serializeSavedAccounts,
  buildSavedAccountEntry,
  upsertSavedAccount,
  removeSavedAccountByEmail,
  patchSavedAccount,
  type SaveAccountInput,
  type UpdateAccountInfoInput,
} from '../../../shared-utils/src/savedAccounts'

export type { SavedAccount, SaveAccountInput, UpdateAccountInfoInput } from '../../../shared-utils/src/savedAccounts'
export {
  SAVED_ACCOUNTS_KEY,
  emailHash,
  accountTokenKey,
  accountRefreshTokenKey,
  resolveAccessToken,
} from '../../../shared-utils/src/savedAccounts'

export const getSavedAccounts = () => {
  try {
    return parseSavedAccounts(localStorage.getItem(SAVED_ACCOUNTS_KEY))
  } catch {
    return []
  }
}

const saveAccounts = (accounts: ReturnType<typeof getSavedAccounts>): void => {
  localStorage.setItem(SAVED_ACCOUNTS_KEY, serializeSavedAccounts(accounts))
}

/** 保存账号（同邮箱更新，存储 access + refresh 双令牌） */
export const saveAccount = (account: SaveAccountInput): void => {
  const entry = buildSavedAccountEntry(account, { includeTokens: true })
  saveAccounts(upsertSavedAccount(getSavedAccounts(), entry))
}

/** 删除已保存账号 */
export const removeAccount = (email: string): void => {
  saveAccounts(removeSavedAccountByEmail(getSavedAccounts(), email))
}

/** 更新账号信息（登录后 profile 拿到最新信息时调用） */
export const updateAccountInfo = (email: string, info: UpdateAccountInfoInput): void => {
  saveAccounts(patchSavedAccount(getSavedAccounts(), email, info))
}
