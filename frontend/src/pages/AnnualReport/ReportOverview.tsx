import React from 'react';

interface Props {
  data: {
    total_income: number;
    total_expense: number;
    balance: number;
    balance_rate: number;
  };
}

const Card: React.FC<{ label: string; value: string; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div className="bg-gray-50 rounded-xl p-4 text-center">
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
  </div>
);

const ReportOverview: React.FC<Props> = ({ data }) => {
  return (
    <div className="px-4 py-8">
      <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">年度总览</h2>
      <div className="grid grid-cols-2 gap-3">
        <Card
          label="总收入"
          value={`¥${data.total_income.toFixed(0)}`}
          color="text-green-600"
        />
        <Card
          label="总支出"
          value={`¥${data.total_expense.toFixed(0)}`}
          color="text-red-500"
        />
        <Card
          label="结余"
          value={`¥${data.balance.toFixed(0)}`}
          color={data.balance >= 0 ? 'text-blue-600' : 'text-red-500'}
        />
        <Card
          label="结余率"
          value={`${data.balance_rate}%`}
          color="text-purple-600"
        />
      </div>
    </div>
  );
};

export default ReportOverview;
