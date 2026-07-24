import React from 'react';

interface Props {
  year: number;
  nickname?: string;
}

const ReportCover: React.FC<Props> = ({ year, nickname }) => {
  return (
    <div
      className="text-white py-16 px-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #87CEEB 0%, #98D8AA 50%, #E8F5E9 100%)',
        borderRadius: '16px',
        marginBottom: '24px',
        boxShadow: 'var(--sh3)',
      }}
    >
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="100" cy="180" rx="150" ry="40" fill="rgba(255,255,255,0.2)" />
        <ellipse cx="400" cy="190" rx="200" ry="35" fill="rgba(255,255,255,0.15)" />
        <ellipse cx="500" cy="170" rx="100" ry="25" fill="rgba(255,255,255,0.1)" />
        <path d="M0,140 Q50,100 100,120 T200,110 T300,125 T400,105 T500,130 T600,115 L600,200 L0,200 Z" fill="#7CB342" opacity="0.6" />
        <path d="M0,150 Q60,130 120,145 T240,135 T360,150 T480,130 T600,145 L600,200 L0,200 Z" fill="#8BC34A" opacity="0.5" />
        <circle cx="50" cy="120" r="30" fill="#689F38" opacity="0.7">
          <animate attributeName="cx" values="50;55;50" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="480" cy="110" r="25" fill="#689F38" opacity="0.6">
          <animate attributeName="cx" values="480;475;480" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="550" cy="100" r="20" fill="#7CB342" opacity="0.5">
          <animate attributeName="cx" values="550;555;550" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="160" r="8" fill="#FFEB3B" opacity="0.6" />
        <circle cx="120" cy="155" r="6" fill="#FFC107" opacity="0.5" />
        <circle cx="450" cy="165" r="7" fill="#FFEB3B" opacity="0.5" />
        <circle cx="470" cy="175" r="5" fill="#FFC107" opacity="0.6" />
        <circle cx="520" cy="160" r="6" fill="#FFEB3B" opacity="0.4" />
      </svg>

      <div className="relative z-10 text-center">
        <div className="text-sm opacity-90 mb-3">{year}年度</div>
        <h1 className="text-3xl font-bold mb-4" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          年度消费报告
        </h1>
        <div className="text-lg opacity-95 mb-6">{nickname || '用户'}，您的年度财务总结</div>
        <div className="flex justify-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm">
            👨‍👩‍👧‍👦
          </span>
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm">
            💰
          </span>
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm">
            📊
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReportCover;