import React from 'react';

interface Props {
  year: number;
  nickname?: string;
}

const ReportCover: React.FC<Props> = ({ year, nickname }) => {

  return (
    <div
      className="text-white text-center py-16 px-6"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div className="text-sm opacity-80 mb-4">{year}</div>
      <h1 className="text-2xl font-bold mb-3">年度消费报告</h1>
      <div className="text-lg mb-2">{nickname}</div>
      <div className="text-sm opacity-80 mt-8">
        记录每一笔，看见每一步
      </div>
    </div>
  );
};

export default ReportCover;
