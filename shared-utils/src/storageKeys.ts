/**
 * 客户端存储键 — 双端约定（值勿随意改，涉及已登录会话兼容）
 *
 * Access token 键名历史差异：
 * - Web：auth_access_token
 * - Taro：auth_token（上线较早，迁移成本高，保持不变）
 */

/** Web Access Token */
export const STORAGE_ACCESS_TOKEN_WEB = 'auth_access_token'

/** 小程序 Access Token（历史键名） */
export const STORAGE_ACCESS_TOKEN_TARO = 'auth_token'

/** Refresh Token（双端同名） */
export const STORAGE_REFRESH_TOKEN = 'auth_refresh_token'

/** 当前账本 ID（Taro Storage；Web 走服务端 profile.current_book_id） */
export const STORAGE_CURRENT_BOOK_ID = 'current_book_id'

/** 主题偏好 */
export const STORAGE_THEME_WEB = 'app_theme'
export const STORAGE_THEME_TARO = 'app_theme_mode'

/** 年报年份记忆（Taro） */
export const STORAGE_REPORT_YEAR = 'selected_report_year'
