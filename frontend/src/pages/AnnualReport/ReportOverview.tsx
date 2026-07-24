import React from 'react';
import { formatMoney } from '../../utils/budget';
import { FIELD_YEAR_INCOME, FIELD_YEAR_EXPENSE, FIELD_YEAR_BALANCE, FIELD_BALANCE_RATE } from '../../utils/fieldCopy'
import { TITLE_REPORT_OVERVIEW } from '../../utils/sectionCopy'

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
    <div className="text-xs mb-1 relative z-10" style={{ color: 'var(--fg3)' }}>{label}</div>
    <div className="text-xl font-bold relative z-10" style={{ color }}>{value}</div>
  </div>
);

const ReportOverview: React.FC<Props> = ({ data }) => {
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
        {TITLE_REPORT_OVERVIEW}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Card
          label={FIELD_YEAR_INCOME}
          value={formatMoney(data.total_income, { compact: true })}
          color="var(--inc)"
          bgColor="var(--incBg)"
          icon="📈"
        />
        <Card
          label={FIELD_YEAR_EXPENSE}
          value={formatMoney(data.total_expense, { compact: true })}
          color="var(--warn)"
          bgColor="var(--warnBg)"
          icon="💳"
        />
        <Card
          label={FIELD_YEAR_BALANCE}
          value={formatMoney(data.balance, { compact: true })}
          color={data.balance >= 0 ? 'var(--info)' : 'var(--exp)'}
          bgColor={data.balance >= 0 ? 'var(--infoBg)' : 'var(--expBg)'}
          icon="💰"
        />
        <Card
          label={FIELD_BALANCE_RATE}
          value={`${data.balance_rate}%`}
          color="var(--pr)"
          bgColor="var(--prBg)"
          icon="📉"
        />
      </div>
    </div>
  );
};

export default ReportOverview;