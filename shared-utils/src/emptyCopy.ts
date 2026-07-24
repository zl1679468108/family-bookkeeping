/** EmptyState 高频描述文案 */

export const EMPTY_TEMPLATES = '还没有交易模板，创建后记账可一键套用'
export const EMPTY_NO_TEMPLATES_SHORT = '暂无模板'
export const EMPTY_BOOKS = '还没有任何账本，创建第一个或等待他人邀请加入'
export const EMPTY_NO_TRANSACTIONS_PERIOD = '当前时间段内没有交易记录'
export const EMPTY_NO_CATEGORY_DATA = '暂无分类数据，请等待加载或切换时间段'
export const EMPTY_BUDGET_NO_EXPENSE_CATEGORIES = '暂无支出分类，请先添加支出分类'
export const EMPTY_LOAD_FAILED = '加载失败'

/** 暂无{支出|收入}分类，添加第一个… */
export function emptyCategories(typeLabel: string): string {
  return `暂无${typeLabel}分类，添加第一个让收支归类更清晰`
}
export const EMPTY_TRANSACTIONS = '暂无交易记录'
export const EMPTY_TRANSACTIONS_HINT = '暂无交易记录，可调整筛选或新增一笔账单'
export const EMPTY_TRANSACTIONS_HOME = '暂无交易记录，记一笔开始掌握家庭收支'
export const EMPTY_NO_BUDGET = '暂未设置预算，设置后可以更好地控制支出'
export const EMPTY_CATEGORIES_GENERIC = '暂无分类，添加第一个让收支都有清晰归类'
export const EMPTY_NO_CATEGORIES_SHORT = '暂无分类'
export const EMPTY_TEMPLATES_SELECTOR = '暂无模板，请先在「模板管理」中创建'
export const EMPTY_BOOKS_SHORT = '暂无账本，点击右上角新建'
export const EMPTY_MEMBER_SPEND_PERIOD = '该时间段内还没有成员消费记录'
export const EMPTY_MEMBER_COMPARE_NEED_MULTI = '成员对比仅在多成员账本可用，请切换账本或邀请家人加入'
export const EMPTY_SELECT_BOOK = '请先在左侧选择要查看的账本'
export const EMPTY_NO_USERS = '暂无用户'
export const EMPTY_LOAD_FAILED_RETRY = '加载失败，请稍后重试'
export const EMPTY_DAY_TRANSACTIONS = '当天暂无交易记录'
export const EMPTY_NO_OTHER_MEMBERS = '还没有其他成员，邀请家人一起记账吧'
export const EMPTY_NO_MEMBERS = '暂无成员'
export const EMPTY_NO_PLATFORM_USERS = '平台还没有用户注册'
export const EMPTY_NO_MERCHANTS = '暂无商户数据，记一笔时添加位置可自动聚合'
export const EMPTY_NO_MERCHANT_MATCH = '未找到匹配的商户，试试其他关键词'
