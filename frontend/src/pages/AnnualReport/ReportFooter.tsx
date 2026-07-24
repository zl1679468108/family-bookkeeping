import React from 'react';

const ReportFooter: React.FC = () => {
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="text-center py-8 px-4">
      <div className="flex justify-center gap-2 mb-4">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-full"
          style={{ background: 'var(--incBg)', color: 'var(--inc)' }}
        >
          💰
        </span>
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-full"
          style={{ background: 'var(--infoBg)', color: 'var(--info)' }}
        >
          📊
        </span>
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-full"
          style={{ background: 'var(--warnBg)', color: 'var(--warn)' }}
        >
          🎯
        </span>
      </div>
      <div className="text-sm mb-2 font-medium" style={{ color: 'var(--fg3)' }}>
        记账让生活更清晰
      </div>
      <div className="text-xs" style={{ color: 'var(--fg3)' }}>
        生成于 {today}
      </div>
      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--bdL)' }}>
        <div className="text-xs" style={{ color: 'var(--fg3)', opacity: 0.7 }}>
          © 静记 - 记录每一笔，看见每一步
        </div>
      </div>
    </div>
  );
};

export default ReportFooter;
