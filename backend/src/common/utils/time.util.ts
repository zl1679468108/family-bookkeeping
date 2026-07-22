/**
 * 北京时间工具（统一使用 Asia/Shanghai 时区）
 *
 * 原因：new Date().toISOString() 返回 UTC 时间，
 * 东八区 00:00 ~ 07:59 的 toISOString() 日期会回退一天（UTC 还是前一天）。
 * 所有 DATE 类型字段的比较/生成都必须走这里。
 */

/** 获取北京时间 YYYY-MM-DD */
export const getBeijingDate = (): string =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })

/** 将任意日期字符串按北京时间解析后返回 YYYY-MM-DD */
export const toBeijingDate = (date: Date | string): string =>
  new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
