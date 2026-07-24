/** 成员配色 Map — PC Map 页 / 日后 Taro 地图共用 */

export type MemberColorSource = {
  userId: string
  color?: string | null
}

/**
 * 多成员（≥2）时构建 userId → color；
 * 单成员返回空 Map（与 UI「不着色」约定一致）
 */
export function buildMemberColorMap(
  members: readonly MemberColorSource[] | undefined | null,
  minMembers = 2,
): Map<string, string> {
  const map = new Map<string, string>()
  if (!members || members.length < minMembers) return map
  for (const m of members) {
    if (m.userId && m.color) map.set(m.userId, m.color)
  }
  return map
}

export function isMultiMember(
  members: readonly unknown[] | undefined | null,
  min = 2,
): boolean {
  return (members?.length ?? 0) >= min
}
