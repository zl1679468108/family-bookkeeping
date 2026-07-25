/**
 * 找回/重置密码等鉴权流程展示 class — 双端共享
 * PC 前缀 step-dot/step-line/auth-message；Taro 前缀 fstep-dot/fstep-line
 */

import { cx, type ClassValue } from './cx'

/** 步骤圆点：active / done（直接传入已算好的修饰态） */
export function buildStepDotClassName(opts: {
  state?: 'active' | 'done' | '' | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'step-dot'
  return cx(prefix, opts.state || null, opts.className)
}

/** 步骤连线：done */
export function buildStepLineClassName(opts: {
  done?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'step-line'
  return cx(prefix, opts.done && 'done', opts.className)
}

/** 鉴权提示条：success / error 等语义类型直接拼接 */
export function buildAuthMessageClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'auth-message'
  return cx(prefix, opts.type || null, opts.className)
}

/** Taro 登录/注册/找回/引导页根节点：基础工具类 + 暗色主题 */
export function buildAuthShellClassName(opts: {
  dark?: boolean
  className?: ClassValue
  prefix?: string
  base?: string
} = {}): string {
  const prefix = opts.prefix || 'login-page'
  const base = opts.base ?? 'min-h-screen bg-bg flex flex-col'
  return cx(prefix, base, opts.dark && 'theme-dark', opts.className)
}

/** 协议 checkbox：checked */
export function buildAgreementCheckboxClassName(opts: {
  checked?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'register-checkbox'
  return cx(prefix, opts.checked && 'checked', opts.className)
}

/** 简单 BEM 选中态：prefix + prefix--selected */
export function buildSelectedBemClassName(opts: {
  selected?: boolean
  className?: ClassValue
  prefix: string
}): string {
  const prefix = opts.prefix
  return cx(prefix, opts.selected && `${prefix}--selected`, opts.className)
}

export function recoverFirstStepDotState(step: number): 'active' | 'done' {
  return step === 1 ? 'active' : 'done'
}

export function recoverSecondStepDotState(step: number): 'active' | '' {
  return step >= 2 ? 'active' : ''
}

export function isRecoverSecondStepReached(step: number): boolean {
  return step >= 2
}

const RESET_STEP_ORDER = ['email', 'code', 'success'] as const

export type ResetStep = (typeof RESET_STEP_ORDER)[number]

export function isResetStepAtLeast(step: ResetStep, target: ResetStep): boolean {
  return RESET_STEP_ORDER.indexOf(step) >= RESET_STEP_ORDER.indexOf(target)
}
