/**
 * Modal Z-Index 动态管理器 — 双端共用
 * 实际 z = base + openCount，解决详情→编辑→确认多层遮挡
 */

/** 与 design-tokens.css --z-detail / --z-modal / --z-critical 对齐 */
export const MODAL_BASE_Z_INDEX = {
  /** 详情弹窗（第一层） */
  detail: 1000,
  /** 编辑/创建/邀请弹窗 */
  modal: 1500,
  /** 关键确认弹窗 */
  critical: 2500,
} as const

export type ModalType = keyof typeof MODAL_BASE_Z_INDEX

let openCount = 0

/** 打开时申请：计数 +1，返回 base + count；须与 release 配对 */
export function acquire(type: ModalType): number {
  openCount += 1
  return MODAL_BASE_Z_INDEX[type] + openCount
}

/** 关闭/卸载时释放 */
export function release(): void {
  if (openCount > 0) openCount -= 1
}

/** 调试：当前打开弹窗计数 */
export function getOpenCount(): number {
  return openCount
}

/** 测试用：重置计数 */
export function resetModalZIndexForTests(): void {
  openCount = 0
}
