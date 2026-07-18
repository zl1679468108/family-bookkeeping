/**
 * 版本信息配置 — 纯静态，不走后端 API
 * 内容对齐 PC 端 frontend/src/config/version.ts
 */

export interface VersionChange {
  version: string
  date: string
  highlights?: string
  changes: string[]
}

export const APP_NAME = '静记'
export const APP_SLOGAN = '安静记录每一笔'
export const APP_VERSION = '1.0.1'
export const APP_BUILD_DATE = '2026-07-18'

export const CHANGELOG: VersionChange[] = [
  {
    version: '1.0.1',
    date: '2026-07-18',
    highlights: '稳定性与小程序上架合规',
    changes: [
      '认证升级为双 Token（Access + Refresh），登录态更稳定、支持会话即时吊销',
      '微信小程序上架合规：新增《用户协议》《隐私政策》页与注册协议勾选',
      '新增账号注销功能',
      '小程序端暗色模式与全局体验对齐',
      '修复若干交互与样式问题',
    ],
  },
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
