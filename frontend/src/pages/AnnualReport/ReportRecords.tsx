import React from 'react';

interface RecordItem {
  amount: number;
  description?: string;
  counterparty?: string;
  date?: string;
  count?: number;
}

interface ReportRecordsProps {
  data: {
    max_expense: RecordItem | null;
    max_expense_day: RecordItem | null;
    max_expense_merchant: RecordItem | null;
  };
}

export const ReportRecords: React.FC<ReportRecordsProps> = ({ data }) => {
  const formatAmount = (n: number) => {
    if (n >= 10000) {
      return '¥' + (n / 10000).toFixed(1) + 'w';
    }
    return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 0 });
  };

  const cards = [
    {
      icon: '💸',
      label: '单笔最高支出',
      value: data.max_expense && data.max_expense.amount > 0 ? formatAmount(data.max_expense.amount) : '无',
      sub: data.max_expense?.description || '',
      sub2: data.max_expense?.date || '',
      bgColor: '#FFF3E0',
      iconBg: '#FF9800',
    },
    {
      icon: '📅',
      label: '最忙碌消费日',
      value: data.max_expense_day?.count ? `${data.max_expense_day.count} 笔` : '无',
      sub: data.max_expense_day?.date || '',
      sub2: data.max_expense_day?.amount && data.max_expense_day.amount > 0 ? `当日支出 ${formatAmount(data.max_expense_day.amount)}` : '',
      bgColor: '#E3F2FD',
      iconBg: '#2196F3',
    },
    {
      icon: '🏪',
      label: '最常消费商户',
      value: data.max_expense_merchant && data.max_expense_merchant.amount > 0
        ? formatAmount(data.max_expense_merchant.amount)
        : '无',
      sub: data.max_expense_merchant?.counterparty || data.max_expense_merchant?.description || '',
      sub2: data.max_expense_merchant?.count
        ? `光顾 ${data.max_expense_merchant.count} 次`
        : '',
      bgColor: '#E8F5E9',
      iconBg: '#4CAF50',
    },
  ];

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
        🏆 记录之最
      </h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:shadow-lg"
            style={{
              background: card.bgColor,
              border: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: card.iconBg,
                boxShadow: `0 4px 12px ${card.iconBg}40`,
              }}
            >
              <span style={{ fontSize: '24px' }}>{card.icon}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                {card.label}
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--fg)',
                  marginBottom: '2px',
                }}
              >
                {card.value}
              </div>
              {card.sub && (
                <div style={{ fontSize: '13px', color: 'var(--fg)', fontWeight: 500 }}>{card.sub}</div>
              )}
              {card.sub2 && (
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{card.sub2}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportRecords;