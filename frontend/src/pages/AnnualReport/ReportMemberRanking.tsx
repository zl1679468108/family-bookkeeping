import React from 'react';

interface MemberItem {
  user_id: string;
  nickname: string;
  expense: number;
  percentage: number;
}

interface Props {
  data: MemberItem[];
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const ReportMemberRanking: React.FC<Props> = ({ data }) => {
  if (!data || data.length <= 1) return null;

  return (
    <div className="mb-6 px-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">👥 成员消费</h2>
      <div className="space-y-3">
        {data.map((member, i) => (
          <div
            key={member.user_id}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
          >
            {/* 排名 */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            >
              {i + 1}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-800">
                  {member.nickname || '用户'}
                </span>
                <span className="text-sm font-bold text-gray-700">
                  ¥{member.expense.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-400">{member.percentage}%</span>
                {i === 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                    消费主力
                  </span>
                )}
                {i === data.length - 1 && data.length > 1 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    省钱达人
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
