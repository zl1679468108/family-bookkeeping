import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MapTransaction, MerchantSummary } from '../../types/map';
import { formatAmountWithType } from '../../utils/common';
import { useCategoryLookup } from '../../hooks/useCategories';
import { fetchMerchantTransactions } from '../../services/mapApi';
import './index.scss';

interface TransactionHistoryModalProps {
  merchant: MerchantSummary;
  onClose: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ merchant, onClose }) => {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['merchant-transactions', merchant.poi_id, merchant.location_name],
    queryFn: () => fetchMerchantTransactions(
      merchant.poi_id,
      merchant.location_name,
    ),
  });

  const { getCategoryName, getCategoryIcon } = useCategoryLookup();

  const filtered = useMemo(() => {
    if (filterType === 'all') return transactions;
    return transactions.filter((t) => t.type === filterType);
  }, [transactions, filterType]);

  return (
    <div className="merchant-history-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="merchant-history-modal">
        <div className="merchant-history-header">
          <div>
            <h3>🏪 {merchant.location_name}</h3>
            <div className="merchant-history-summary">
              {merchant.expense_count > 0 && (
                <span className="history-tag expense">支出 ¥{merchant.expense_total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} · {merchant.expense_count}次</span>
              )}
              {merchant.income_count > 0 && (
                <span className="history-tag income">收入 ¥{merchant.income_total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} · {merchant.income_count}次</span>
              )}
            </div>
          </div>
          <button className="merchant-history-close" onClick={onClose}>✕</button>
        </div>

        {/* 筛选标签 */}
        <div className="merchant-history-tabs">
          <button className={`map-chip ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>
            全部 ({transactions.length})
          </button>
          <button className={`map-chip ${filterType === 'expense' ? 'active' : ''}`} onClick={() => setFilterType('expense')}>
            支出 ({merchant.expense_count})
          </button>
          <button className={`map-chip ${filterType === 'income' ? 'active' : ''}`} onClick={() => setFilterType('income')}>
            收入 ({merchant.income_count})
          </button>
        </div>

        {/* 交易列表 */}
        <div className="merchant-history-list">
          {isLoading ? (
            <div className="merchant-history-loading">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="merchant-history-empty">暂无交易记录</div>
          ) : (
            filtered.map((tx) => (
              <div key={tx.id} className={`merchant-history-item ${tx.type}`}>
                <div className="history-item-left">
                  <span className={`history-item-type ${tx.type}`}>
                    {tx.type === 'income' ? '收' : '支'}
                  </span>
                  <div className="history-item-info">
                    <span className="history-item-category">
                      {getCategoryIcon(tx.category)} {getCategoryName(tx.category)}
                    </span>
                    {tx.description && (
                      <span className="history-item-desc">{tx.description}</span>
                    )}
                  </div>
                </div>
                <div className="history-item-right">
                  <span className={`history-item-amount ${tx.type}`}>
                    {formatAmountWithType(tx.amount, tx.type === 'income')}
                  </span>
                  <span className="history-item-date">{tx.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
