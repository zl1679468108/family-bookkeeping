import React from 'react';
import { formatMoney } from '../../utils/budget';
import { LABEL_NONE, transactionCountLabel, visitCountLabel, dayExpenseAmountLabel } from '../../utils/entityCopy'
import { TITLE_REPORT_RECORDS, LABEL_REPORT_MAX_EXPENSE, LABEL_REPORT_BUSIEST_DAY, LABEL_REPORT_TOP_MERCHANT } from '../../utils/sectionCopy'

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
  const cards = [
    {
      icon: '💸',
      label: LABEL_REPORT_MAX_EXPENSE,
      value: data.max_expense && data.max_expense.amount > 0 ? formatMoney(data.max_expense.amount, { compact: true }) : LABEL_NONE,
      sub: data.max_expense?.description || '',
      sub2: data.max_expense?.date || '',
      bgColor: 'var(--warnBg)',
      iconBg: 'var(--warn)',
    },
    {
      icon: '📅',
      label: LABEL_REPORT_BUSIEST_DAY,
      value: data.max_expense_day?.count ? transactionCountLabel(data.max_expense_day.count) : LABEL_NONE,
      sub: data.max_expense_day?.date || '',
      sub2: data.max_expense_day?.amount && data.max_expense_day.amount > 0 ? dayExpenseAmountLabel(formatMoney(data.max_expense_day.amount, { compact: true })) : '',
      bgColor: 'var(--infoBg)',
      iconBg: 'var(--info)',
    },
    {
      icon: '🏪',
      label: LABEL_REPORT_TOP_MERCHANT,
      value: data.max_expense_merchant && data.max_expense_merchant.amount > 0
        ? formatMoney(data.max_expense_merchant.amount, { compact: true })
        : LABEL_NONE,
      sub: data.max_expense_merchant?.counterparty || data.max_expense_merchant?.description || '',
      sub2: data.max_expense_merchant?.count
        ? visitCountLabel(data.max_expense_merchant.count)
        : '',
      bgColor: 'var(--incBg)',
      iconBg: 'var(--inc)',
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
        {TITLE_REPORT_RECORDS}
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
              border: '1px solid var(--bdL)',
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
              <div style={{ fontSize: '12px', color: 'var(--fg3)', marginBottom: '4px' }}>
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
                <div style={{ fontSize: '12px', color: 'var(--fg3)' }}>{card.sub2}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportRecords;