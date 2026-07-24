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
