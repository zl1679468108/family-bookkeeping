/**
 * ════════════════════════════════════════════════════════════════
 *   Modal Z-Index 动态管理器
 *   —— 解决多层弹窗（详情→编辑→确认）遮挡问题
 *
 *   工作原理：
 *     1. 每个弹窗类型（DetailModal / ui/Modal / ConfirmDialog）
 *        有自己的基础 z-index（base）
 *     2. 全局维护一个 openCount 计数器，每打开一个弹窗 +1
 *     3. 每个弹窗实例的实际 z-index = base + openCount
 *     4. 弹窗关闭或卸载时计数器 -1，保证层级正确回退
 *
 *   典型交互链的层级：
 *     列表/卡片 → 详情弹窗(1000) → 编辑弹窗(1500) → 确认弹窗(2500)
 *     若编辑弹窗中再开一个编辑弹窗 → 第二个编辑弹窗(1501)
 *     若确认弹窗中再开一个确认弹窗 → 第二个确认弹窗(2501)
 *   ════════════════════════════════════════════════════════════════
 */

/** 三种弹窗的基础 z-index，与 design-tokens.css 保持一致 */
export const MODAL_BASE_Z_INDEX = {
  /** 详情弹窗（第一层弹窗） */
  detail: 1000,
  /** 编辑/创建/邀请弹窗（从详情弹窗打开的二次弹窗） */
  modal: 1500,
  /** 关键弹窗（确认删除、无账本提示等） */
  critical: 2500,
} as const;

export type ModalType = keyof typeof MODAL_BASE_Z_INDEX;

/** 全局打开的弹窗计数器，所有弹窗共享同一个计数 */
let openCount = 0;

/**
 * 申请一个动态 z-index。
 * 每次调用计数器 +1，返回 base + 当前计数值。
 * 注意：必须与 `release()` 配对调用，否则计数会无限递增。
 */
export function acquire(type: ModalType): number {
  openCount += 1;
  return MODAL_BASE_Z_INDEX[type] + openCount;
}

/**
 * 释放一个动态 z-index。
 * 计数器 -1，保证弹窗关闭后层级正确回退。
 */
export function release(): void {
  if (openCount > 0) {
    openCount -= 1;
  }
}

/** 获取当前打开的弹窗数量（主要用于调试） */
export function getOpenCount(): number {
  return openCount;
}
