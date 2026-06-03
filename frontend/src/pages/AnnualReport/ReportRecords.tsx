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

/**
 * 记录之最 - 3张卡片
 */
export const ReportRecords: React.FC<ReportRecordsProps> = ({ data }) => {
  const formatAmount = (n: number) => '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2 });

  const cards = [
    {
      icon: '💸',
      label: '最大单笔消费',
      value: data.max_expense && data.max_expense.amount > 0 ? formatAmount(data.max_expense.amount) : '无',
      sub: data.max_expense?.description || '',
      sub2: data.max_expense?.date || '',
    },
    {
      icon: '📅',
      label: '最多消费日',
      value: data.max_expense_day?.count ? `${data.max_expense_day.count} 笔` : '无',
      sub: data.max_expense_day?.date || '',
      sub2: data.max_expense_day?.amount && data.max_expense_day.amount > 0 ? formatAmount(data.max_expense_day.amount) : '',
    },
    {
      icon: '🏪',
      label: '最多消费商户',
      value: data.max_expense_merchant && data.max_expense_merchant.amount > 0
        ? formatAmount(data.max_expense_merchant.amount)
        : '无',
      sub: data.max_expense_merchant?.counterparty || data.max_expense_merchant?.description || '',
      sub2: data.max_expense_merchant?.count
        ? `${data.max_expense_merchant.count} 次`
        : '',
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: 'var(--surface)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: '28px' }}>{card.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                {card.label}
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--fg)',
                  marginBottom: '2px',
                }}
              >
                {card.value}
              </div>
              {card.sub && (
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{card.sub}</div>
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
