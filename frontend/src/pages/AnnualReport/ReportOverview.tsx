import React from 'react';

interface Props {
  data: {
    total_income: number;
    total_expense: number;
    balance: number;
    balance_rate: number;
  };
}

const Card: React.FC<{ label: string; value: string; color: string; bgColor: string; icon: string }> = ({
  label,
  value,
  color,
  bgColor,
  icon,
}) => (
  <div
    className="rounded-xl p-4 text-center relative overflow-hidden"
    style={{
      background: bgColor,
      boxShadow: 'var(--sh2)',
    }}
  >
    <div
      className="absolute top-2 right-2 opacity-20"
      style={{ fontSize: '32px' }}
    >
      {icon}
    </div>
    <div className="text-xs text-gray-500 mb-1 relative z-10">{label}</div>
    <div className={`text-xl font-bold ${color} relative z-10`}>{value}</div>
  </div>
);

const ReportOverview: React.FC<Props> = ({ data }) => {
  const formatNumber = (n: number) => {
    if (n >= 10000) {
      return '¥' + (n / 10000).toFixed(1) + 'w';
    }
    return '¥' + n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

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
        📊 年度总览
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Card
          label="年度总收入"
          value={formatNumber(data.total_income)}
          color="text-green-600"
          bgColor="var(--incBg)"
          icon="📈"
        />
        <Card
          label="年度总支出"
          value={formatNumber(data.total_expense)}
          color="text-orange-500"
          bgColor="var(--warnBg)"
          icon="💳"
        />
        <Card
          label="年度结余"
          value={formatNumber(data.balance)}
          color={data.balance >= 0 ? 'text-blue-600' : 'text-red-500'}
          bgColor={data.balance >= 0 ? 'var(--infoBg)' : 'var(--expBg)'}
          icon="💰"
        />
        <Card
          label="结余率"
          value={`${data.balance_rate}%`}
          color="text-purple-600"
          bgColor="var(--prBg)"
          icon="📉"
        />
      </div>
    </div>
  );
};

export default ReportOverview;