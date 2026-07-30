/**
 * 版本信息配置 — 纯静态，不走后端 API
 */

export interface VersionChange {
  version: string
  date: string
  highlights?: string
  changes: string[]
}

export const APP_NAME = '财猫家庭记账'
/** Logo 单字标 */
export const APP_BRAND_MARK = '财'

/** 欢迎来到{APP_NAME} */
export function appWelcomeTitle(name: string = APP_NAME): string {
  return `欢迎来到${name}`
}

/** 浏览器标题：页面 - 应用名 */
export function appPageTitle(page: string, name: string = APP_NAME): string {
  return `${page} - ${name}`
}

/** {APP_NAME}客服 */
export function appCustomerServiceTitle(name: string = APP_NAME): string {
  return `${name}客服`
}
export const APP_SLOGAN = '记录家庭每一笔'
export const APP_VERSION = '1.0.3'
export const APP_BUILD_DATE = '2026-07-30'

export const CHANGELOG: VersionChange[] = [
  {
    version: '1.0.3',
    date: '2026-07-30',
    highlights: '品牌更名与小程序布局修复',
    changes: [
      '应用品牌统一更名为「财猫家庭记账」，三端文案与标识同步',
      '修复小程序 Tab 页底部被自定义 TabBar 遮挡问题',
      '修复 PageLayout 使用 100vh 导致可视区域被裁切的问题',
    ],
  },
  {
    version: '1.0.2',
    date: '2026-07-25',
    highlights: '质量门与上线交付收口',
    changes: [
      '三端 shared-utils 展示逻辑与文案统一，降低双端漂移',
      'CI 增加 source-quality / package exports / Taro 版本线校验与单测门禁',
      '诊断日志收口与生产构建 warning 清理',
      '部署流程强制同步 About 版本号与更新日志',
      '修复若干交互与体验问题',
    ],
  },
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

/** 应用信息字段标签 */
export const LABEL_APP_VERSION = '应用版本'
export const LABEL_UPDATE_DATE = '更新日期'
export const LABEL_RUNTIME_ENV = '运行环境'
export const LABEL_RUNTIME_WEB = 'Web'
export const LABEL_RUNTIME_MINIPROGRAM = '小程序'
export const SECTION_APP_INFO = '应用信息'
export const SECTION_CHANGELOG = '更新日志'
export const SECTION_LEGAL = '法律与协议'

/** 2026 年 7 月 18 日 */
export function formatVersionReleaseDate(dateStr: string): string {
  const [year, month, day] = String(dateStr || '').split('-')
  if (!year || !month || !day) return dateStr
  return `${year} 年 ${parseInt(month, 10)} 月 ${parseInt(day, 10)} 日`
}

/** {date} 发布 */
export function aboutReleasedLabel(dateStr: string): string {
  return `${formatVersionReleaseDate(dateStr)} 发布`
}

/** © {year} {appName} · {slogan} */
export function aboutFooterCopyright(
  year: number,
  appName: string = APP_NAME,
  slogan: string = APP_SLOGAN,
): string {
  return `© ${year} ${appName} · ${slogan}`
}
