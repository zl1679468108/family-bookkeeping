import React from 'react';
import './index.scss';

interface MemberLocationToggleProps {
  /** 当前是否正在共享位置 */
  isSharing: boolean;
  /** 切换共享状态回调 */
  onToggle: () => void;
  /** 位置获取错误信息，非 null 时显示红色 tooltip */
  locationError: string | null;
}

/**
 * MemberLocationToggle — 位置共享开关组件。
 *
 * 显示 📍 图标 + "共享我的位置" 文本 + 状态指示（绿色=已开启，灰色=已关闭）。
 * locationError 非空时显示红色 tooltip 提示。
 */
export const MemberLocationToggle: React.FC<MemberLocationToggleProps> = ({
  isSharing,
  onToggle,
  locationError,
}) => {
  return (
    <div className="location-toggle-wrapper">
      <button
        className={`location-toggle ${isSharing ? 'sharing' : 'not-sharing'}`}
        onClick={onToggle}
        title={isSharing ? '点击关闭位置共享' : '点击开启位置共享'}
      >
        <span className="location-toggle-icon">📍</span>
        <span className="location-toggle-label">共享我的位置</span>
        <span className={`location-toggle-status ${isSharing ? 'on' : 'off'}`}>
          {isSharing ? '🟢 已开启' : '⚫ 已关闭'}
        </span>
        <span className="location-toggle-arrow">▼</span>
      </button>
      {locationError && (
        <div className="location-toggle-error-tooltip">
          {locationError}
        </div>
      )}
    </div>
  );
};
