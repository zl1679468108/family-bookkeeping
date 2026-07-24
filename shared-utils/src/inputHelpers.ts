import { cx, type ClassValue } from './cx'

/** 输入框纯逻辑 — 双端 Input / SearchInput 共用 */

/** 是否展示清除按钮 */
export function shouldShowInputClear(
  allowClear: boolean | undefined,
  value: unknown,
  disabled?: boolean,
): boolean {
  if (!allowClear || disabled) return false
  if (value == null) return false
  return String(value).length > 0
}

/** password 可见切换后的实际 type */
export function resolvePasswordInputType(
  baseType: string | undefined,
  showPasswordToggle: boolean | undefined,
  showPassword: boolean,
): string | undefined {
  if (showPasswordToggle && baseType === 'password') {
    return showPassword ? 'text' : 'password'
  }
  return baseType
}

/** 字数统计展示：`12 / 500` */
export function formatCharCount(current: number, max: number): string {
  return `${Number(current) || 0} / ${max}`
}

/** 字数统计紧凑：`12/500`（无空格） */
export function formatCharCountCompact(current: number, max: number): string {
  return `${Number(current) || 0}/${max}`
}



/** 字段展示：有值显示值，否则占位 */
export function fieldDisplayText(
  value: string | null | undefined,
  placeholder: string,
): string {
  const v = String(value ?? '').trim()
  return v || placeholder
}

/** 字段是否有非空文本 */
export function hasFieldText(value: string | null | undefined): boolean {
  return String(value ?? '').trim().length > 0
}


/** PC 表单必填 class（::before 星号） */
export const FIELD_REQUIRED_CLASS = 'field-required'

/** Taro FieldRow 必填标记文本（含前导空格） */
export const FIELD_REQUIRED_MARK = ' *'

/** 拼接 label class：base + 可选 field-required */
export function fieldRequiredClassName(
  baseClass: string,
  required?: boolean,
): string {
  const base = String(baseClass || '').trim()
  if (!required) return base
  return base ? `${base} ${FIELD_REQUIRED_CLASS}` : FIELD_REQUIRED_CLASS
}


/** 输入外壳 class（PC/Taro ui-input-wrap） */
export function buildInputWrapClassName(opts: {
  error?: boolean
  search?: boolean
  number?: boolean
  className?: ClassValue
  prefix?: string
  /** pc: 错误在内层 has-error；bem: 错误在 wrap --error */
  mode?: 'pc' | 'bem'
} = {}): string {
  const prefix = opts.prefix || 'ui-input-wrap'
  const mode = opts.mode || 'pc'
  return cx(
    prefix,
    mode === 'bem' && opts.error && `${prefix}--error`,
    opts.search && `${prefix}--search`,
    opts.number && `${prefix}--number`,
    opts.className,
  )
}

/** 输入框本体 class */
export function buildInputClassName(opts: {
  error?: boolean
  focused?: boolean
  disabled?: boolean
  search?: boolean
  className?: ClassValue
  prefix?: string
  mode?: 'pc' | 'bem'
} = {}): string {
  const prefix = opts.prefix || 'ui-input'
  const mode = opts.mode || 'pc'
  return cx(
    prefix,
    mode === 'pc' && opts.error && 'has-error',
    mode === 'bem' && opts.focused && `${prefix}--focus`,
    mode === 'bem' && opts.disabled && `${prefix}--disabled`,
    opts.search && `${prefix}--search`,
    opts.className,
  )
}

/** Textarea 外壳 */
export function buildTextareaWrapClassName(opts: {
  error?: boolean
  className?: ClassValue
  prefix?: string
  mode?: 'pc' | 'bem'
} = {}): string {
  const prefix = opts.prefix || 'ui-textarea-wrap'
  const mode = opts.mode || 'pc'
  return cx(
    prefix,
    mode === 'bem' && opts.error && `${prefix}--error`,
    opts.className,
  )
}

/** Textarea 本体 */
export function buildTextareaClassName(opts: {
  error?: boolean
  className?: ClassValue
  prefix?: string
  mode?: 'pc' | 'bem'
} = {}): string {
  const prefix = opts.prefix || 'ui-textarea'
  const mode = opts.mode || 'pc'
  return cx(
    prefix,
    mode === 'pc' && opts.error && 'has-error',
    opts.className,
  )
}

/** FormField 外壳 form-group */
export function buildFormGroupClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'form-group'
  return cx(prefix, opts.className)
}

/** PC 搜索框外壳 ui-search */
export function buildSearchWrapClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-search'
  return cx(prefix, opts.className)
}

/** PC 搜索 input 本体 */
export function buildSearchFieldClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-search-field'
  return cx(prefix, opts.className)
}

/** PC number field */
export function buildNumberFieldClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-number-field'
  return cx(prefix, opts.className)
}

/** PC select 外壳 */
export function buildSelectWrapClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-select-wrap'
  return cx(prefix, opts.className)
}

/** PC select field */
export function buildSelectFieldClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-select-field'
  return cx(prefix, opts.className)
}

/** PC 输入本体 disabled 修饰（is-disabled） */
export function buildPcInputShellClassName(opts: {
  disabled?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-input'
  return cx(prefix, opts.disabled && 'is-disabled', opts.className)
}

