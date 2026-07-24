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
    <div style={{ marginBottom: '24px' }}>
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--fg)',
          marginBottom: '16px',
        }}
      >
        🎉 趣味彩蛋
      </h2>
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, #FFF8E1 0%, #E8F5E9 100%)',
          border: '1px solid rgba(255,193,7,0.2)',
        }}
      >
        <svg className="absolute bottom-0 right-0 w-32 h-32 opacity-20" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="#FFC107" />
          <circle cx="30" cy="30" r="8" fill="#FFEB3B" />
          <circle cx="70" cy="40" r="6" fill="#FFEB3B" />
          <circle cx="60" cy="70" r="10" fill="#FFEB3B" />
        </svg>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span className="text-4xl">🧋</span>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--fg3)', marginBottom: '4px' }}>
                这一年，你为奶茶付出了...
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--exp)' }}>
                ¥{data.dining_total.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--warn)', marginTop: '2px' }}>
                相当于 {milkTeaCups.toLocaleString()} 杯奶茶（¥15/杯）
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[140px] p-4 bg-white/60 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💳</span>
                <span style={{ fontSize: '12px', color: 'var(--fg3)' }}>日均支出</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--info)' }}>
                ¥{data.daily_avg_expense.toFixed(0)}
              </div>
            </div>
            
            <div className="flex-1 min-w-[140px] p-4 bg-white/60 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🔥</span>
                <span style={{ fontSize: '12px', color: 'var(--fg3)' }}>最长连续记账</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--inc)' }}>
                {data.max_continuous_days} 天
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white/40 rounded-lg">
            <div style={{ fontSize: '13px', color: 'var(--exp)' }}>
              ☕ <span style={{ fontWeight: 500 }}>小贴士：</span>少喝一杯奶茶，存下更多美好回忆吧！
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFunFact;