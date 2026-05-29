import React, { useState, useMemo } from 'react';
import type { MerchantSummary } from '../../types/map';
import './index.scss';

interface MerchantListProps {
  merchants: MerchantSummary[];
  loading: boolean;
}

type SortKey = 'total_amount' | 'transaction_count';

export const MerchantList: React.FC<MerchantListProps> = ({ merchants, loading }) => {
  const [sortKey, setSortKey] = useState<SortKey>('total_amount');

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
      <div className="merchant-list-loading">
        <div className="map-loading-spinner" />
        <span>加载商户数据中...</span>
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
    <div className="merchant-list">
      <div className="merchant-list-header">
        <h3>商户消费排行</h3>
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
            <div key={idx} className="merchant-row">
              <div className="merchant-row-rank">#{idx + 1}</div>
              <div className="merchant-row-info">
                <div className="merchant-row-name">🏪 {m.location_name}</div>
                <div className="merchant-row-bars">
                  <div className="merchant-bar-row">
                    <span className="merchant-bar-label">金额</span>
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
                <div className="merchant-row-date">最近: {m.last_transaction_date}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
