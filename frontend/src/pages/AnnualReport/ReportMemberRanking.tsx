import React, { useMemo } from 'react';
import { getChartPalette } from '../../utils/themeColors'
import { useTheme } from '../../utils/theme'
import { formatMoney } from '../../utils/budget'
import { userDisplayName } from '../../utils/userDisplay'
import { TITLE_REPORT_MEMBER_SPEND, LABEL_REPORT_SPENDER, LABEL_REPORT_SAVER } from '../../utils/sectionCopy'

interface MemberItem {
  user_id: string;
  nickname: string;
  expense: number;
  percentage: number;
}

interface Props {
  data: MemberItem[];
}

const ReportMemberRanking: React.FC<Props> = ({ data }) => {
  const { resolvedTheme } = useTheme();
  const colors = useMemo(() => getChartPalette(), [resolvedTheme]);

  if (!data || data.length <= 1) return null;

  return (
    <div className="mb-6 px-4">
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--fg)' }}>{TITLE_REPORT_MEMBER_SPEND}</h2>
      <div className="space-y-3">
        {data.map((member, i) => (
          <div
            key={member.user_id}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'var(--srfH)' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: colors[i % colors.length], color: 'var(--on-pr)' }}
            >
              {i + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                  {userDisplayName({ username: member.nickname, name: member.nickname })}
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--fg2)' }}>
                  {formatMoney(member.expense, { compact: true })}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs" style={{ color: 'var(--fg3)' }}>{member.percentage}%</span>
                {i === 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--warnBg)', color: 'var(--warn)' }}
                  >
                    {LABEL_REPORT_SPENDER}
                  </span>
                )}
                {i === data.length - 1 && data.length > 1 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--incBg)', color: 'var(--inc)' }}
                  >
                    {LABEL_REPORT_SAVER}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportMemberRanking;
