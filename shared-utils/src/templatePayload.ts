/**
 * 交易模板 — 表单 ↔ API payload / 应用到记一笔 的纯函数
 */

import { FORM_TEMPLATE_NAME_REQUIRED, FORM_CATEGORY_REQUIRED } from './formCopy'

export type TemplateType = 'expense' | 'income'

/** 端侧表单字符串态（坐标等用 string 便于 input） */
export type TemplateFormFields = {
  name: string
  type: TemplateType
  category_id: string
  amount: string
  note: string
  latitude: string
  longitude: string
  location_name: string
  poi_id: string
  sort_order: number
  frequency: string
  start_date: string
  end_date: string
  /** 部分端用 merchant_name 表示品牌 */
  merchant_name: string
  brand: string
}

/** 对齐 CreateTemplateInput 的纯对象（不依赖 shared-types） */
export type TemplatePayload = {
  name: string
  type: TemplateType
  category_id?: string
  amount?: number
  note?: string
  latitude?: number
  longitude?: number
  location_name?: string
  poi_id?: string
  sort_order?: number
  frequency?: string
  start_date?: string
  end_date?: string
  merchant_name?: string
}

export type TemplateLike = {
  id?: string | null
  name?: string | null
  type?: string | null
  category_id?: string | null
  amount?: number | string | null
  note?: string | null
  description?: string | null
  latitude?: number | null
  longitude?: number | null
  location_name?: string | null
  poi_id?: string | null
  sort_order?: number | null
  frequency?: string | null
  start_date?: string | null
  end_date?: string | null
  merchant_name?: string | null
  brand?: string | null
}

function optionalTrim(value?: string | null): string | undefined {
  const v = String(value ?? '').trim()
  return v ? v : undefined
}

function optionalFloat(value?: string | number | null): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : undefined
}

/** 表单字段 → 创建/更新模板 payload */
export function buildTemplatePayload(
  form: TemplateFormFields,
  options: { includeEmptyCategory?: boolean } = {},
): TemplatePayload {
  const { includeEmptyCategory = false } = options
  const payload: TemplatePayload = {
    name: form.name.trim(),
    type: form.type,
  }

  const categoryId = optionalTrim(form.category_id)
  if (categoryId) payload.category_id = categoryId
  else if (includeEmptyCategory) payload.category_id = undefined

  const amount = optionalFloat(form.amount)
  if (amount !== undefined) payload.amount = amount

  const note = optionalTrim(form.note)
  if (note) payload.note = note

  const lat = optionalFloat(form.latitude)
  const lng = optionalFloat(form.longitude)
  if (lat !== undefined) payload.latitude = lat
  if (lng !== undefined) payload.longitude = lng

  const locationName = optionalTrim(form.location_name)
  if (locationName) payload.location_name = locationName

  const poiId = optionalTrim(form.poi_id)
  if (poiId) payload.poi_id = poiId

  if (typeof form.sort_order === 'number' && Number.isFinite(form.sort_order)) {
    payload.sort_order = form.sort_order
  }

  const frequency = optionalTrim(form.frequency)
  if (frequency) payload.frequency = frequency
  const startDate = optionalTrim(form.start_date)
  if (startDate) payload.start_date = startDate
  const endDate = optionalTrim(form.end_date)
  if (endDate) payload.end_date = endDate

  const merchant = optionalTrim(form.merchant_name) || optionalTrim(form.brand)
  if (merchant) payload.merchant_name = merchant

  return payload
}

export type TemplateFormValidation =
  | { ok: true }
  | { ok: false; field: 'name' | 'category'; message: string }

/** 模板表单校验；Taro 要求分类，PC 可仅要求名称 */
export function validateTemplateFormFields(
  form: Pick<TemplateFormFields, 'name' | 'category_id'>,
  options: { requireCategory?: boolean } = {},
): TemplateFormValidation {
  if (!form.name.trim()) {
    return { ok: false, field: 'name', message: FORM_TEMPLATE_NAME_REQUIRED }
  }
  if (options.requireCategory && !String(form.category_id ?? '').trim()) {
    return { ok: false, field: 'category', message: FORM_CATEGORY_REQUIRED }
  }
  return { ok: true }
}

/** 实体 → 编辑表单（字符串态） */
export function templateToFormFields(
  t: TemplateLike,
  defaults: Partial<TemplateFormFields> = {},
): TemplateFormFields {
  return {
    name: t.name || '',
    type: t.type === 'income' ? 'income' : 'expense',
    category_id: t.category_id || '',
    amount: t.amount != null && t.amount !== '' ? String(t.amount) : '',
    note: t.note || t.description || '',
    latitude: t.latitude != null ? String(t.latitude) : '',
    longitude: t.longitude != null ? String(t.longitude) : '',
    location_name: t.location_name || '',
    poi_id: t.poi_id || '',
    sort_order: t.sort_order ?? defaults.sort_order ?? 0,
    frequency: t.frequency || '',
    start_date: t.start_date || '',
    end_date: t.end_date || '',
    merchant_name: t.merchant_name || t.brand || '',
    brand: t.brand || t.merchant_name || '',
    ...defaults,
  }
}

/** 复制模板：名称加副本后缀，清空周期字段 */
export function templateToCopyFormFields(
  t: TemplateLike,
  copySuffix = ' (副本)',
): TemplateFormFields {
  const base = templateToFormFields(t)
  return {
    ...base,
    name: `${base.name}${copySuffix}`,
    frequency: '',
    start_date: '',
    end_date: '',
  }
}

export type EmptyTemplateFormOptions = {
  type?: TemplateType
  sort_order?: number
}

export function emptyTemplateFormFields(
  options: EmptyTemplateFormOptions = {},
): TemplateFormFields {
  return {
    name: '',
    type: options.type || 'expense',
    category_id: '',
    amount: '',
    note: '',
    latitude: '',
    longitude: '',
    location_name: '',
    poi_id: '',
    sort_order: options.sort_order ?? 0,
    frequency: '',
    start_date: '',
    end_date: '',
    merchant_name: '',
    brand: '',
  }
}

/** 模板 → 记一笔表单补丁 */
export type TransactionFormPatch = {
  type: TemplateType
  category: string
  amount: string
  brand: string
  note: string
  location: {
    locationName: string
    name: string
    latitude: number
    longitude: number
    poiId: string | null
  } | null
}

export function applyTemplateToTransactionForm(template: TemplateLike): TransactionFormPatch {
  const type: TemplateType = template.type === 'income' ? 'income' : 'expense'
  const hasLocation =
    template.latitude != null &&
    template.longitude != null &&
    Number.isFinite(Number(template.latitude)) &&
    Number.isFinite(Number(template.longitude))

  return {
    type,
    category: template.category_id || '',
    amount: template.amount != null && template.amount !== '' ? String(template.amount) : '',
    brand: template.merchant_name || template.brand || '',
    note: template.note || template.description || '',
    location: hasLocation
      ? {
          locationName: template.location_name || '',
          name: template.location_name || '',
          latitude: Number(template.latitude),
          longitude: Number(template.longitude),
          poiId: template.poi_id || null,
        }
      : null,
  }
}

/** 分类 id → 展示信息（模板列表/详情） */
export function resolveCategoryDisplay(
  categories: ReadonlyArray<{ id: string; name: string; icon: string }>,
  categoryId?: string | null,
  fallbackName = '未分类',
): { icon: string; name: string } {
  if (!categoryId) return { icon: '', name: fallbackName }
  const cat = categories.find((c) => c.id === categoryId)
  return cat ? { icon: cat.icon, name: cat.name } : { icon: '', name: fallbackName }
}
