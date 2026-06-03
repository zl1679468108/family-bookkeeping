import React from 'react';

interface FunFactData {
  dining_total: number;
  daily_avg_expense: number;
  max_continuous_days: number;
}

interface Props {
  data: FunFactData;
}

const ReportFunFact: React.FC<Props> = ({ data }) => {
  const milkTeaCups = Math.round(data.dining_total / 15);

  return (
    <div className="mb-6 px-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">🎉 趣味彩蛋</h2>
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
          <span className="text-2xl">🧋</span>
          <div>
            <div className="text-sm text-gray-700">
              你在餐饮上花了 <span className="font-bold">¥{data.dining_total.toFixed(0)}</span>
            </div>
            <div className="text-xs text-orange-500">
              相当于 {milkTeaCups.toLocaleString()} 杯奶茶（¥15/杯）
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
          <span className="text-2xl">💳</span>
          <div>
            <div className="text-sm text-gray-700">日均支出</div>
            <div className="text-xs text-blue-500 font-bold">
              ¥{data.daily_avg_expense.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
          <span className="text-2xl">🔥</span>
          <div>
            <div className="text-sm text-gray-700">最长连续记账</div>
            <div className="text-xs text-green-500 font-bold">
              {data.max_continuous_days} 天
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFunFact;
