/**
 * 全局请求进度条状态管理
 * - 采用 "假进度 + 真实完成" 模式：进度 0~80% 缓慢前进，所有请求响应完冲刺到 100%
 * - 支持操作级分组：通过 runTask 包裹一组请求，仅在该组期间显示进度条
 * - 支持静默请求：给 request 传 showProgress: false 不参与进度条
 */

export interface ProgressState {
  progress: number
  isVisible: boolean
}

type Listener = (state: ProgressState) => void

const listeners = new Set<Listener>()
const pendingRequests = new Set<string>()
const activeTasks = new Set<string>()

let state: ProgressState = { progress: 0, isVisible: false }
let advanceTimer: number | null = null
let hideTimer: number | null = null
// 跟踪所有超时清理定时器，模块卸载/重置时可统一清理
const timersRef = new Set<number>()

const FAST_START_MS = 150
const ADVANCE_INTERVAL_MS = 250
const HIDE_DELAY_MS = 250
// 请求超时自动清理：防止 trackRequest('start') 后因异常未调用 'end' 导致 pendingRequests 无限增长（F-L12）
const REQUEST_TIMEOUT_MS = 120000

const nextId = (): string => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

const emit = (): void => {
  listeners.forEach((listener) => listener(state))
}

const shouldBeActive = (): boolean => pendingRequests.size > 0 || activeTasks.size > 0

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const stopAdvance = (): void => {
  if (advanceTimer !== null) {
    window.clearTimeout(advanceTimer)
    advanceTimer = null
  }
}

const scheduleAdvance = (): void => {
  stopAdvance()
  advanceTimer = window.setTimeout(() => {
    advanceTimer = null
    if (!shouldBeActive()) return

    // 越接近 80% 越慢，营造"快好了但还差一点"的感觉
    const remaining = 80 - state.progress
    if (remaining <= 0) return

    const step = clamp(remaining * 0.08, 1, 4)
    state = { ...state, progress: clamp(state.progress + step, 0, 80) }
    emit()
    scheduleAdvance()
  }, ADVANCE_INTERVAL_MS)
}

const show = (): void => {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }
  if (state.isVisible) return

  state = { progress: 0, isVisible: true }
  emit()

  // 快速起步到 ~15%
  window.setTimeout(() => {
    if (!state.isVisible || !shouldBeActive()) return
    state = { ...state, progress: 15 }
    emit()
    scheduleAdvance()
  }, FAST_START_MS)
}

const finish = (): void => {
  stopAdvance()
  state = { progress: 100, isVisible: true }
  emit()

  if (hideTimer !== null) {
    window.clearTimeout(hideTimer)
  }
  hideTimer = window.setTimeout(() => {
    hideTimer = null
    state = { progress: 0, isVisible: false }
    emit()
  }, HIDE_DELAY_MS)
}

/** 订阅进度条变化，返回取消订阅函数 */
export const subscribeProgress = (listener: Listener): (() => void) => {
  listeners.add(listener)
  listener(state)
  return () => {
    listeners.delete(listener)
  }
}

/** 手动查询当前状态 */
export const getProgressState = (): ProgressState => ({ ...state })

/** 请求层埋点：请求开始调 +1，请求结束（无论成功失败）调 -1 */
export const trackRequest = (id: string, action: 'start' | 'end'): void => {
  if (action === 'start') {
    pendingRequests.add(id)
    // 超时自动清理，防止异常情况下 'end' 未被调用导致 pendingRequests 泄漏（F-L12）
    const cleanupTimer = window.setTimeout(() => {
      pendingRequests.delete(id)
      timersRef.delete(cleanupTimer)
      if (pendingRequests.size === 0 && activeTasks.size === 0) {
        finish()
      }
    }, REQUEST_TIMEOUT_MS)
    timersRef.add(cleanupTimer)
    if (!state.isVisible) {
      show()
    }
  } else {
    pendingRequests.delete(id)
    if (pendingRequests.size === 0 && activeTasks.size === 0) {
      finish()
    }
  }
}

/** 操作级分组：显式包裹一段异步操作，仅在操作期间显示进度条 */
export const runTask = async <T>(fn: () => Promise<T>): Promise<T> => {
  const taskId = nextId()
  activeTasks.add(taskId)
  if (!state.isVisible) {
    show()
  }
  try {
    return await fn()
  } finally {
    activeTasks.delete(taskId)
    if (pendingRequests.size === 0 && activeTasks.size === 0) {
      finish()
    }
  }
}
