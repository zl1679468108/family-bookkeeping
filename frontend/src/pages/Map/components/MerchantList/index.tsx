import React, { useState, useMemo } from 'react';
import type { MerchantSummary } from '../../../../types/map';
import { TransactionHistoryModal } from '../TransactionHistoryModal';
import { Skeleton } from '../../../../components/ui/Skeleton';
import './index.scss';

interface MerchantListProps {
  merchants: MerchantSummary[];
  loading: boolean;
}

type SortKey = 'total_amount' | 'transaction_count';

export const MerchantList: React.FC<MerchantListProps> = ({ merchants, loading }) => {
  const [sortKey, setSortKey] = useState<SortKey>('total_amount');
  const [historyMerchant, setHistoryMerchant] = useState<MerchantSummary | null>(null);

  const sorted = useMemo(() => {
    return [...merchants].sort((a, b) => {
      if (sortKey === 'total_amount') {
        return b.total_amount - a.total_amount;
      }
      return b.transaction_count - a.transaction_count;
    });
  }, [merchants, sortKey]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', background: '#fff' }}>
            <Skeleton width="36px" height="36px" borderRadius="8px" />
            <div style={{ flex: 1, marginLeft: '12px', marginRight: '12px' }}>
              <Skeleton width="55%" height="14px" marginBottom="6px" />
              <Skeleton width="35%" height="12px" />
            </div>
            <Skeleton width="64px" height="14px" />
          </div>
        ))}
      </div>
    );
  }

  if (merchants.length === 0) {
    return (
      <div className="merchant-list-empty">
        <div className="map-empty-icon">🏪</div>
        <h3>暂无商户数据</h3>
        <p>记一笔时添加位置信息，系统会自动按商户聚合消费数据</p>
      </div>
    );
  }

  const maxAmount = Math.max(...merchants.map((m) => m.total_amount));
  const maxCount = Math.max(...merchants.map((m) => m.transaction_count));

  return (
    <>
      <div className="merchant-list">
        <div className="merchant-list-header">
          <h3>商户足迹排行</h3>
          <div className="merchant-sort">
            <button
              className={`map-chip ${sortKey === 'total_amount' ? 'active' : ''}`}
              onClick={() => setSortKey('total_amount')}
            >
              按金额
            </button>
            <button
              className={`map-chip ${sortKey === 'transaction_count' ? 'active' : ''}`}
              onClick={() => setSortKey('transaction_count')}
            >
              按次数
            </button>
          </div>
        </div>

        <div className="merchant-list-body">
          {sorted.map((m, idx) => {
            const amountRatio = maxAmount > 0 ? m.total_amount / maxAmount : 0;
            const countRatio = maxCount > 0 ? m.transaction_count / maxCount : 0;

            return (
              <div
                key={idx}
                className="merchant-row"
                onClick={() => setHistoryMerchant(m)}
              >
                <div className="merchant-row-rank">#{idx + 1}</div>
                <div className="merchant-row-info">
                  <div className="merchant-row-name">🏪 {m.location_name}</div>

                  {/* 金额和次数进度条 */}
                  <div className="merchant-row-bars">
                    <div className="merchant-bar-row">
                      <span className="merchant-bar-label">总额</span>
                      <div className="merchant-bar-track">
                        <div
                          className="merchant-bar-fill amount"
                          style={{ width: `${Math.max(amountRatio * 100, 2)}%` }}
                        />
                      </div>
                      <span className="merchant-bar-value">
                        ¥ {m.total_amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="merchant-bar-row">
                      <span className="merchant-bar-label">次数</span>
                      <div className="merchant-bar-track">
                        <div
                          className="merchant-bar-fill count"
                          style={{ width: `${Math.max(countRatio * 100, 2)}%` }}
                        />
                      </div>
                      <span className="merchant-bar-value">{m.transaction_count} 次</span>
                    </div>
                  </div>

                  {/* 收入/支出明细 */}
                  <div className="merchant-row-detail">
                    {m.expense_count > 0 && (
                      <span className="detail-tag expense">支 {m.expense_count}次 · ¥{m.expense_total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                    )}
                    {m.income_count > 0 && (
                      <span className="detail-tag income">收 {m.income_count}次 · ¥{m.income_total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                    )}
                  </div>

                  <div className="merchant-row-date">最近: {m.last_transaction_date}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 交易历史弹窗 */}
      {historyMerchant && (
        <TransactionHistoryModal
          merchant={historyMerchant}
          onClose={() => setHistoryMerchant(null)}
        />
      )}
    </>
  );
};
