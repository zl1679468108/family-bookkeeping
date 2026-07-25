/** 位置字段纯逻辑 — LocationDisplay / LocationField 共用 */

/** 高德 PlaceSearch 全国检索 */
export const LOCATION_SEARCH_CITY_NATIONWIDE = '全国'

export type LocationLike = {
  name?: string | null
  locationName?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
} | null | undefined

/** 是否有可展示的位置（名称或坐标任一） */
export function hasLocationValue(loc: LocationLike): boolean {
  if (!loc) return false
  const name = loc.name ?? loc.locationName
  if (name != null && String(name).trim() !== '') return true
  if (loc.latitude == null || loc.longitude == null) return false
  if (loc.latitude === '' || loc.longitude === '') return false
  return true
}

/** 格式化坐标展示；缺省返回 null */
export function formatCoords(
  latitude?: number | string | null,
  longitude?: number | string | null,
  digits = 4,
): string | null {
  if (latitude == null || longitude == null || latitude === '' || longitude === '') {
    return null
  }
  const lat =
    typeof latitude === 'number' && Number.isFinite(latitude)
      ? latitude.toFixed(digits)
      : String(latitude)
  const lng =
    typeof longitude === 'number' && Number.isFinite(longitude)
      ? longitude.toFixed(digits)
      : String(longitude)
  return `${lat}, ${lng}`
}

/**
 * 与 PC LocationPicker 逆地理文案一致：
 * - 有 POI 名且不同于地址 → `poiName + ' ' + address`
 * - 否则用地址 / POI 名
 * - 都没有时回退坐标
 */
export function formatLocationLabel(
  poiName?: string | null,
  address?: string | null,
  fallback?: { latitude: number; longitude: number } | null,
): string {
  const name = String(poiName || '').trim()
  const addr = String(address || '').trim()
  if (name && addr && name !== addr) return `${name} ${addr}`
  if (addr) return addr
  if (name) return name
  if (
    fallback &&
    Number.isFinite(fallback.latitude) &&
    Number.isFinite(fallback.longitude)
  ) {
    return `${fallback.latitude.toFixed(6)}, ${fallback.longitude.toFixed(6)}`
  }
  return ''
}

/** 与 PC PlaceSearch 选中文案一致：`name + ' ' + address` */
export function formatPoiSearchLabel(
  name?: string | null,
  address?: string | null,
): string {
  const n = String(name || '').trim()
  const a = String(address || '').trim()
  if (n && a) return `${n} ${a}`
  return n || a
}

