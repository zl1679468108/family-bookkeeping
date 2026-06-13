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
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
          💰
        </span>
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
          📊
        </span>
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600">
          🎯
        </span>
      </div>
      <div className="text-sm text-gray-500 mb-2 font-medium">记账让生活更清晰</div>
      <div className="text-xs text-gray-400">生成于 {today}</div>
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="text-xs text-gray-300">© 静记 - 记录每一笔，看见每一步</div>
      </div>
    </div>
  );
};

export default ReportFooter;