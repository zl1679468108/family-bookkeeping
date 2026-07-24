/**
 * 已保存账号 — 纯数据结构与数组操作（不含 localStorage / Taro Storage）
 * 端侧负责读写存储，并在 save/remove 时按平台策略处理 token。
 */

export const SAVED_ACCOUNTS_KEY = 'saved_accounts'

export interface SavedAccount {
  email: string
  /** 兼容别名：等同于 accessToken（PC 可能仍写在列表 JSON 内） */
  token?: string
  /** 访问令牌（短，请求携带） */
  accessToken?: string
  /** 刷新令牌（长，仅用于换发） */
  refreshToken?: string
  username?: string
  avatar_url?: string
}

export type SaveAccountInput = {
  email: string
  token?: string
  accessToken?: string
  refreshToken?: string
  username?: string
  avatar_url?: string
}

export type UpdateAccountInfoInput = {
  username?: string
  avatar_url?: string
  token?: string
  accessToken?: string
  refreshToken?: string
}

/** 简单 hash，用于独立 token storage key（避免 email 特殊字符） */
export function emailHash(email: string): string {
  let h = 0
  for (let i = 0; i < email.length; i++) {
    h = ((h << 5) - h + email.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

export function accountTokenKey(email: string): string {
  return `account_token_${emailHash(email)}`
}

export function accountRefreshTokenKey(email: string): string {
  return `account_refresh_token_${emailHash(email)}`
}

/** 解析存储原始字符串 → 账号列表 */
export function parseSavedAccounts(raw: string | null | undefined): SavedAccount[] {
  if (!raw) return []
  try {
    const accounts = JSON.parse(raw)
    return Array.isArray(accounts) ? (accounts as SavedAccount[]) : []
  } catch {
    return []
  }
}

export function serializeSavedAccounts(accounts: SavedAccount[]): string {
  return JSON.stringify(accounts)
}

/** 取 access token（优先 accessToken，兼容 token） */
export function resolveAccessToken(input: {
  token?: string
  accessToken?: string
}): string | undefined {
  return input.accessToken ?? input.token
}

/**
 * 构造列表中的账号条目
 * - includeTokens: PC 把双 token 一并写入 JSON；Taro 为 false（token 独立 key）
 */
export function buildSavedAccountEntry(
  input: SaveAccountInput,
  options: { includeTokens?: boolean } = {},
): SavedAccount {
  const { includeTokens = true } = options
  const accessToken = resolveAccessToken(input)
  if (!includeTokens) {
    return {
      email: input.email,
      username: input.username,
      avatar_url: input.avatar_url,
    }
  }
  return {
    email: input.email,
    token: accessToken,
    accessToken,
    refreshToken: input.refreshToken,
    username: input.username,
    avatar_url: input.avatar_url,
  }
}

/** 同邮箱更新，否则追加 */
export function upsertSavedAccount(
  accounts: readonly SavedAccount[],
  entry: SavedAccount,
): SavedAccount[] {
  const next = accounts.slice()
  const idx = next.findIndex((a) => a.email === entry.email)
  if (idx >= 0) next[idx] = entry
  else next.push(entry)
  return next
}

export function removeSavedAccountByEmail(
  accounts: readonly SavedAccount[],
  email: string,
): SavedAccount[] {
  return accounts.filter((a) => a.email !== email)
}

/** 按邮箱局部更新资料/令牌字段 */
export function patchSavedAccount(
  accounts: readonly SavedAccount[],
  email: string,
  info: UpdateAccountInfoInput,
): SavedAccount[] {
  const idx = accounts.findIndex((a) => a.email === email)
  if (idx < 0) return accounts.slice()
  const next = accounts.slice()
  const cur = { ...next[idx] }
  if (info.username !== undefined) cur.username = info.username
  if (info.avatar_url !== undefined) cur.avatar_url = info.avatar_url
  if (info.token !== undefined) cur.token = info.token
  if (info.accessToken !== undefined) {
    cur.accessToken = info.accessToken
    cur.token = info.accessToken
  }
  if (info.refreshToken !== undefined) cur.refreshToken = info.refreshToken
  next[idx] = cur
  return next
}

export type LegacyMigrationResult = {
  accounts: SavedAccount[]
  /** 需写入独立 key 的 access token */
  migratedTokens: Array<{ email: string; token: string }>
  dirty: boolean
}

/**
 * 清理 legacy 列表中的 password / 内嵌 token，token 抽出供端侧写独立 key
 */
export function migrateLegacySavedAccounts(
  accounts: readonly SavedAccount[],
): LegacyMigrationResult {
  let dirty = false
  const migratedTokens: Array<{ email: string; token: string }> = []
  const next = accounts.map((acc) => {
    const copy = { ...acc } as SavedAccount & { password?: unknown }
    if (copy.token && copy.email) {
      migratedTokens.push({ email: copy.email, token: copy.token })
      delete copy.token
      dirty = true
    }
    if ('password' in copy) {
      delete copy.password
      dirty = true
    }
    return copy as SavedAccount
  })
  return { accounts: next, migratedTokens, dirty }
}
