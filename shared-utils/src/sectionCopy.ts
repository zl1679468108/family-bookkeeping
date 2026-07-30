/**
 * 页面/卡片/分区标题 — 双端 UI 文案对齐
 */

import {
  ENTITY_BUDGET,
  ENTITY_CATEGORY,
  ENTITY_TEMPLATE,
  ENTITY_BOOK,
  ENTITY_TRANSACTION,
} from './entityCopy'

/** 分区标题 */
export const SECTION_SHORTCUTS = '快捷方式'
export const SECTION_BILL_INFO = '账单信息'
export const SECTION_CATEGORY_TYPE = '分类类型'
export const SECTION_BASIC_INFO = '基本信息'
export const SECTION_EMOJI_ICONS = '表情图标'
export const SECTION_SHOPPING_ICONS = '购物与生活服务'
export const SECTION_CUSTOM_ICONS = '自定义图标'
export const SECTION_TEMPLATE_INFO = '模板信息'

/** 首页 / 报表卡片 */
export const TITLE_RECENT_TXN_MONTH = '本月最近交易'
export const TITLE_BUDGET_MONTH = '本月预算'
export const TITLE_CATEGORY_RATIO = '分类占比'
export const TITLE_WORKBENCH = '工作台'
export const TITLE_ABOUT = '关于财猫家庭记账'
export const TITLE_DATA_ANALYSIS = '数据分析'
export const TITLE_MEMBER_COMPARE = '成员对比'

/** 管理页标题：分类管理 / 模板管理 … */
export function entityManageTitle(entity: string): string {
  return `${entity}管理`
}

export const TITLE_CATEGORY_MANAGE = entityManageTitle(ENTITY_CATEGORY)
export const TITLE_TEMPLATE_MANAGE = entityManageTitle(ENTITY_TEMPLATE)
export const TITLE_BUDGET_MANAGE = entityManageTitle(ENTITY_BUDGET)
export const TITLE_BOOK_MANAGE = entityManageTitle(ENTITY_BOOK)
export const TITLE_MY_BOOKS = '我的账本'
export const TITLE_TRANSACTION_TEMPLATES = '交易模板'
export const TITLE_SELECT_TEMPLATE = '选择模板'
export const TITLE_TRANSACTION_MANAGE = entityManageTitle(ENTITY_TRANSACTION)
export const TITLE_MEMBER_MANAGE = entityManageTitle('成员')

/** 成员对比卡片 */
export const TITLE_MEMBER_SPEND = '成员支出分布'
export const TITLE_CATEGORY_COMPARE = '分类对比'
export const TITLE_MONTHLY_ESTIMATE = '月度估算'

/** 标题 · 周期 */
export function withPeriodLabel(title: string, periodLabel: string): string {
  const p = String(periodLabel || '').trim()
  return p ? `${title} · ${p}` : title
}


/** 位置选择 */
export const TITLE_SELECT_LOCATION = '选择消费位置'
export const TITLE_LOCATE_CURRENT = '定位到当前位置'
export const TITLE_MERCHANT_FOOTPRINT = '商户足迹'
export const TITLE_JOIN_BY_INVITE = '使用邀请码加入账本'
export const TITLE_TRANSFER_OWNERSHIP = '转移所有权'

/** 报表趋势图标题（按视图） */
export const CHART_TITLE_DAILY = '本月每日总支出/总收入'
export const CHART_TITLE_MONTHLY = '月度总支出/总收入汇总'
export const CHART_TITLE_MONTH_COMPARE = '月对比'
export const CHART_TITLE_YEAR_COMPARE = '年对比'

export function reportChartTitle(flags: {
  isDailyView?: boolean
  isMonthlyView?: boolean
  isMonthCompare?: boolean
  isYearCompare?: boolean
}): string {
  if (flags.isDailyView) return CHART_TITLE_DAILY
  if (flags.isMonthlyView) return CHART_TITLE_MONTHLY
  if (flags.isMonthCompare) return CHART_TITLE_MONTH_COMPARE
  if (flags.isYearCompare) return CHART_TITLE_YEAR_COMPARE
  return ''
}

/** Onboarding 入口 */
export const ONBOARDING_CREATE_TITLE = '我自己创建账本'
export const ONBOARDING_CREATE_DESC = '新建一个空账本，开始记录收支'
export const ONBOARDING_JOIN_DESC = '输入他人分享的邀请码，加入已有账本'
export const ONBOARDING_SUBTITLE = '创建属于你自己的账本，或通过邀请码加入他人的账本'
export const TITLE_JOIN_BY_INVITE_CODE = '输入邀请码加入'

export const TITLE_EDIT_PROFILE = '编辑资料'
export const TITLE_BOOK_SETTINGS = '账本设置'
export const TITLE_PRIVACY_POLICY = '隐私政策'
export const TITLE_USER_AGREEMENT = '用户协议'
export const PAGE_TITLE_TRANSACTIONS_FULL = '交易流水'
export const PAGE_TITLE_PROFILE_CENTER = '个人中心'
export const PAGE_TITLE_ANNUAL_BILL = '年度账单'
export const PAGE_TITLE_ONBOARDING = '开始使用'
export const PAGE_TITLE_ADMIN = '管理后台'

/** 地图视图 */
export const MAP_VIEW_FOOTPRINTS = '足迹'
export const MAP_VIEW_HEATMAP = '热力图'


/** 年报区块标题 / 标签 */
export const TITLE_REPORT_RECORDS = '🏆 记录之最'
export const TITLE_REPORT_MEMBER_SPEND = '👥 成员消费'
export const TITLE_REPORT_OVERVIEW = '📊 年度总览'
export const TITLE_REPORT_CATEGORY_TOP5 = '🏷️ 支出分类 TOP5'
export const TITLE_REPORT_BOOK_VIEW = '📊 账本视角'
export const TITLE_REPORT_FUN_FACT = '🎉 趣味彩蛋'
export const TITLE_REPORT_MONTHLY_TREND = '📈 12个月收支趋势'
export const TITLE_REPORT_ANNUAL_SPEND = '年度消费报告'
export const LABEL_REPORT_MAX_EXPENSE = '单笔最高支出'
export const LABEL_REPORT_BUSIEST_DAY = '最忙碌消费日'
export const LABEL_REPORT_TOP_MERCHANT = '最常消费商户'
export const LABEL_REPORT_SPENDER = '消费主力'
export const LABEL_REPORT_SAVER = '省钱达人'
export const LABEL_REPORT_DAILY_AVG = '日均支出'
export const LABEL_REPORT_MAX_STREAK = '最长连续记账'
export const LABEL_REPORT_TIP = '小贴士：'
export const FUN_FACT_MILK_TEA_INTRO = '这一年，你为奶茶付出了...'
export const FUN_FACT_TIP_BODY = '少喝一杯奶茶，存下更多美好回忆吧！'
export const TAGLINE_BOOKKEEPING_CLEARER = '记账让生活更清晰'
