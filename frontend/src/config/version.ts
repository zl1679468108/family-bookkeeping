/**
 * 版本信息配置 — 纯静态，不走后端 API
 */

export interface VersionChange {
  version: string
  date: string
  highlights?: string
  changes: string[]
}

export const APP_NAME = '静记'
export const APP_SLOGAN = '安静记录每一笔'
export const APP_VERSION = '1.0.0'
export const APP_BUILD_DATE = '2026-07-02'

export const CHANGELOG: VersionChange[] = [
  {
    version: '1.0.0',
    date: '2026-07-02',
    highlights: '正式版发布',
    changes: [
      '支持多账本管理与成员协作',
      '收支记账、分类管理、预算控制',
      '多维度报表与年度账单',
      '日历视图与地图标记',
      '快捷模版与账本设置',
    ],
  },
]
