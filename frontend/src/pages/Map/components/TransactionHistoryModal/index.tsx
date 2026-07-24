import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MerchantSummary } from '@family-bookkeeping/shared-types'
import { formatAmount, formatAmountByType } from '../../../../utils/common';
import { useCategoryLookup } from '../../../../hooks/useCategories';
import { fetchMerchantTransactions } from '../../../../services/mapApi';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { SegControl } from '../../../../components/ui/SegControl';
import './index.scss';
import { useBook } from '../../../../hooks/useBook';
import { queryKeys } from '../../../../utils/queryKeys';
import { STALE } from '../../../../utils/cachePolicy';
import { Icon } from '../../../../components/ui/Icon'
import { transactionTypeShortLabel } from '../../../../utils/transactionType'
import { EMPTY_TRANSACTIONS } from '../../../../utils/emptyCopy';

interface TransactionHistoryModalProps {
  merchant: MerchantSummary;
  onClose: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ merchant, onClose }) => {
  const { currentBook } = useBook();
  const bookId = currentBook?.id || '';
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: queryKeys.map.merchantTx(bookId, merchant.poi_id, merchant.location_name),
    queryFn: () => fetchMerchantTransactions(
      merchant.poi_id,
      merchant.location_name,
    ),
    enabled: !!bookId,
    staleTime: STALE.map,
  });

  const { getCategoryName, getCategoryIconNode } = useCategoryLookup();

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
                <span className="history-tag expense">总支出 {formatAmount(merchant.expense_total)} · {merchant.expense_count}次</span>
              )}
              {merchant.income_count > 0 && (
                <span className="history-tag income">总收入 {formatAmount(merchant.income_total)} · {merchant.income_count}次</span>
              )}
            </div>
          </div>
          <button type="button" className="merchant-history-close" onClick={onClose} aria-label="关闭"><Icon name="close" size={16} /></button>
        </div>

        {/* 筛选标签 */}
        <div className="merchant-history-tabs">
          <SegControl
            size="sm"
            variant="pill"
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: 'all', label: `全部 (${transactions.length})` },
              { value: 'expense', label: `支出 (${merchant.expense_count})` },
              { value: 'income', label: `收入 (${merchant.income_count})` },
            ]}
          />
        </div>

        {/* 交易列表 */}
        <div className="merchant-history-list">
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 0' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px' }}>
                  <Skeleton width="32px" height="32px" borderRadius="6px" />
                  <div style={{ flex: 1, marginLeft: '12px', marginRight: '12px' }}>
                    <Skeleton width="65%" height="14px" marginBottom="6px" />
                    <Skeleton width="40%" height="12px" />
                  </div>
                  <Skeleton width="72px" height="14px" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState variant="compact" description={EMPTY_TRANSACTIONS} />
          ) : (
            filtered.map((tx) => (
              <div key={tx.id} className={`merchant-history-item ${tx.type}`}>
                <div className="history-item-left">
                  <span className={`history-item-type ${tx.type}`}>
                    {transactionTypeShortLabel(tx.type)}
                  </span>
                  <div className="history-item-info">
                    <span className="history-item-category">
                      {getCategoryIconNode(tx.category, 16)} {getCategoryName(tx.category)}
                    </span>
                    {tx.description && (
                      <span className="history-item-desc">{tx.description}</span>
                    )}
                  </div>
                </div>
                <div className="history-item-right">
                  <span className={`history-item-amount ${tx.type}`}>
                    {formatAmountByType(tx.amount, tx.type)}
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
