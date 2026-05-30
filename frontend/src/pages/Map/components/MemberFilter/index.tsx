import React from 'react';
import type { MapMember } from '../../../../types/map';
import './index.scss';

interface MemberFilterProps {
  /** 成员列表 */
  members: MapMember[];
  /** userId → 颜色值的映射表 */
  colorMap: Map<string, string>;
  /** 当前选中的成员 ID，null 表示"全部" */
  selectedId: string | null;
  /** 选中变更回调，null 表示"全部" */
  onChange: (userId: string | null) => void;
}

/**
 * MemberFilter — 成员筛选栏组件。
 *
 * 在地图工具栏中渲染「全部成员 | 👤 成员A | 👤 成员B ...」按钮组。
 * 仅在多成员场景（members.length >= 2）时渲染。
 * 选中的成员用其专属颜色高亮边框 + 底色。
 */
export const MemberFilter: React.FC<MemberFilterProps> = ({
  members,
  colorMap,
  selectedId,
  onChange,
}) => {
  // 单成员时不渲染
  if (members.length < 2) return null;

  return (
    <div className="member-filter">
      <button
        className={`member-filter-chip ${selectedId === null ? 'active' : ''}`}
        onClick={() => onChange(null)}
      >
        全部成员
      </button>
      {members.map((member) => {
        const color = colorMap.get(member.userId) || '#999';
        const isActive = selectedId === member.userId;
        return (
          <button
            key={member.userId}
            className={`member-filter-chip ${isActive ? 'active' : ''}`}
            style={{
              '--mf-color': color,
              '--mf-color-alpha': `${color}18`,
            } as React.CSSProperties}
            onClick={() => onChange(member.userId)}
          >
            <span className="member-filter-avatar" style={{ background: color }}>
              {member.username.charAt(0).toUpperCase()}
            </span>
            <span className="member-filter-name">{member.username}</span>
          </button>
        );
      })}
    </div>
  );
};
