import React, { useState, useMemo } from 'react';
import type { MerchantSummary } from '../../../../types/map';
import { TransactionHistoryModal } from '../TransactionHistoryModal';
import './index.scss';

interface MerchantListProps {
  merchants: MerchantSummary[];
  loading: boolean;
}

type SortKey = 'expense' | 'income' | 'expense_count' | 'income_count';

export const MerchantList: React.FC<MerchantListProps> = ({ merchants, loading }) => {
  const [sortKey, setSortKey] = useState<SortKey>('expense');
  const [historyMerchant, setHistoryMerchant] = useState<MerchantSummary | null>(null);

  const sorted = useMemo(() => {
    return [...merchants].sort((a, b) => {
      switch (sortKey) {
        case 'income':
          return b.income_total - a.income_total;
        case 'expense_count':
          return b.expense_count - a.expense_count;
        case 'income_count':
          return b.income_count - a.income_count;
        case 'expense':
        default:
          return b.expense_total - a.expense_total;
      }
    });
  }, [merchants, sortKey]);

  if (loading) {
    return (
      <div className="merchant-list-loading">加载中…</div>
    );
  }

  if (merchants.length === 0) {
    return (
      <div className="merchant-list-empty">
        <div className="merchant-list-empty-icon">🏪</div>
        <div className="merchant-list-empty-title">暂无商户数据</div>
        <div className="merchant-list-empty-desc">记一笔时添加位置信息，系统会自动按商户聚合消费数据</div>
      </div>
    );
  }

  return (
    <>
      <div className="merchant-list">
        <div className="merchant-list-header">
          <div className="merchant-list-title">商户足迹排行</div>
          <div className="merchant-sort-group">
            <button
              className={`merchant-sort-btn ${sortKey === 'expense' ? 'active' : ''}`}
              onClick={() => setSortKey('expense')}
            >
              支出金额
            </button>
            <button
              className={`merchant-sort-btn ${sortKey === 'income' ? 'active' : ''}`}
              onClick={() => setSortKey('income')}
            >
              收入金额
            </button>
            <button
              className={`merchant-sort-btn ${sortKey === 'expense_count' ? 'active' : ''}`}
              onClick={() => setSortKey('expense_count')}
            >
              支出次数
            </button>
            <button
              className={`merchant-sort-btn ${sortKey === 'income_count' ? 'active' : ''}`}
              onClick={() => setSortKey('income_count')}
            >
              收入次数
            </button>
          </div>
        </div>

        <div className="merchant-list-body">
          {sorted.map((m, idx) => (
            <div
              key={idx}
              className="merchant-row"
              onClick={() => setHistoryMerchant(m)}
            >
              <div className="merchant-row-rank">#{idx + 1}</div>
              <div className="merchant-row-info">
                <div className="merchant-row-name">🏪 {m.location_name}</div>

                <div className="merchant-row-stats">
                  {/* 支出 */}
                  {m.expense_count > 0 && (
                    <div className="merchant-stat-item expense">
                      <span className="merchant-stat-label">支出</span>
                      <span className="merchant-stat-amount">
                        ¥{m.expense_total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="merchant-stat-count">{m.expense_count} 次</span>
                    </div>
                  )}
                  {/* 收入 */}
                  {m.income_count > 0 && (
                    <div className="merchant-stat-item income">
                      <span className="merchant-stat-label">收入</span>
                      <span className="merchant-stat-amount">
                        ¥{m.income_total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="merchant-stat-count">{m.income_count} 次</span>
                    </div>
                  )}
                </div>

                <div className="merchant-row-date">最近交易: {m.last_transaction_date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {historyMerchant && (
        <TransactionHistoryModal
          merchant={historyMerchant}
          onClose={() => setHistoryMerchant(null)}
        />
      )}
    </>
  );
};

export default MerchantList;
