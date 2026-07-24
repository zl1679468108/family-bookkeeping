/** EmptyState 高频描述文案 */

export const EMPTY_TEMPLATES = '还没有交易模板，创建后记账可一键套用'
export const EMPTY_BOOKS = '还没有任何账本，创建第一个或等待他人邀请加入'
export const EMPTY_NO_TRANSACTIONS_PERIOD = '当前时间段内没有交易记录'
export const EMPTY_NO_CATEGORY_DATA = '暂无分类数据，请等待加载或切换时间段'
export const EMPTY_BUDGET_NO_EXPENSE_CATEGORIES = '暂无支出分类，请先在分类管理中添加'
export const EMPTY_LOAD_FAILED = '加载失败'

/** 暂无{支出|收入}分类，添加第一个… */
export function emptyCategories(typeLabel: string): string {
  return `暂无${typeLabel}分类，添加第一个让收支归类更清晰`
}
