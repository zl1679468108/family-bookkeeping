import React from 'react';

const ReportFooter: React.FC = () => {
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="text-center py-8 px-4">
      <div className="text-xs text-gray-400 mb-2">生成于 {today}</div>
      <div className="text-sm text-gray-300 font-medium">记账让生活更清晰</div>
      <div className="mt-6 border-t border-gray-100" />
    </div>
  );
};

export default ReportFooter;
