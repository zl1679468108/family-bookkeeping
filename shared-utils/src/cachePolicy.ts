/** 缓存策略：按资源类型划分 staleTime / gcTime（PC React Query + Taro manual 缓存共用） */

export const STALE = {
  /** 全局默认 */
  default: 30_000,
  /** 分类（变更少） */
  categories: 5 * 60_000,
  /** 模板 */
  templates: 5 * 60_000,
  /** 统计 / 报表 */
  statistics: 5 * 60_000,
  /** 交易列表 */
  transactions: 60_000,
  /** 预算 */
  budgets: 2 * 60_000,
  /** 账本列表 */
  books: 30_000,
  /** 地图交易 / 商户 */
  map: 2 * 60_000,
  /** 地图成员列表 */
  mapMembers: 5 * 60_000,
  /** 年度账单：手动刷新前长期有效 */
  annualReport: Number.POSITIVE_INFINITY,
  /** 自定义图标 */
  customIcons: 5 * 60_000,
  /** 管理后台：尽量实时 */
  admin: 0,
  /** 登录用户资料 */
  authProfile: 5 * 60_000,
  /** 账本成员 */
  bookMembers: 30_000,
  /** 日历日汇总 */
  calendarDaily: 2 * 60_000,
  /** 单笔交易详情 */
  transactionDetail: 60_000,
} as const

/** 默认垃圾回收时间 */
export const GC_TIME = 10 * 60_000

/** 报表等重查询保留更久 */
export const GC_TIME_LONG = 30 * 60_000
