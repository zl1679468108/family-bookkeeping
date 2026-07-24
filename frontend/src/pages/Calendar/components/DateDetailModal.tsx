import React from 'react';
import { GlobalModal } from '../../../components/ui';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useCategoryLookup } from '../../../hooks/useCategories';
import { formatAmountWithType } from '../../../utils/common';
import { getLunarInfo } from '../utils/lunarUtils';
import { formatMoney } from '../../../utils/budget';
import type { Transaction } from '../../../services/api';
import type { DailySummaryItem } from '@family-bookkeeping/shared-types';

interface DateDetailModalProps {
  open: boolean;
  selectedDate: string | null;
  cellData: DailySummaryItem | undefined;
  dayTransactions: Transaction[];
  txsLoading: boolean;
  onClose: () => void;
}

export const DateDetailModal: React.FC<DateDetailModalProps> = ({
  open, selectedDate, cellData, dayTransactions, txsLoading, onClose,
}) => {
  const { getCategoryName, getCategoryIcon } = useCategoryLookup();

  return (
    <GlobalModal
      type="detail"
      open={open}
      onClose={onClose}
      title={selectedDate || ''}
    >
      {selectedDate && (() => {
        const lunarInfo = getLunarInfo(selectedDate);
        const dayNum = parseInt(selectedDate.slice(8, 10), 10);

        return (
          <div className="cal-detail-modal">
            <div className="cal-detail-header">
              <div className="cal-detail-day-wrap">
                <div className="cal-detail-day">{dayNum}</div>
                <div className="cal-detail-lunar-info">
                  <div className="cal-detail-lunar-text">{lunarInfo.lunarFull}</div>
                  {lunarInfo.holidayInfo && (
                    <div className={`cal-detail-holiday${lunarInfo.isWork === true ? ' work' : lunarInfo.isWork === false ? ' rest' : ' normal'}`}>
                      {lunarInfo.holidayInfo}
                    </div>
                  )}
                </div>
              </div>
              <div className="cal-detail-stats">
                <div className="cal-detail-stat-row">
                  <span className="cal-detail-stat-label">总支出</span>
                  <span className="cal-detail-stat-value exp">{cellData ? formatMoney(cellData.total_expense, { compact: true }) : '¥0'}</span>
                </div>
                <div className="cal-detail-stat-row">
                  <span className="cal-detail-stat-label">总收入</span>
                  <span className="cal-detail-stat-value inc">{cellData ? formatMoney(cellData.total_income, { compact: true }) : '¥0'}</span>
                </div>
                <div className="cal-detail-stat-row">
                  <span className="cal-detail-stat-label">总笔数</span>
                  <span className="cal-detail-stat-value neutral">{cellData ? cellData.transaction_count : 0}笔</span>
                </div>
              </div>
            </div>

            <div className="cal-detail-txn-section">
              {txsLoading ? (
                <div className="cal-detail-txn-list" style={{ pointerEvents: 'none' }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="txn-row">
                      <div className="txn-icon"><Skeleton width="100%" height="100%" borderRadius="8px" /></div>
                      <div className="txn-info">
                        <Skeleton width="50%" height="13px" marginBottom="4px" />
                        <Skeleton width="35%" height="11px" />
                      </div>
                      <Skeleton width="64px" height="14px" />
                    </div>
                  ))}
                </div>
              ) : dayTransactions.length === 0 ? (
                <EmptyState variant="compact" description="当天暂无交易记录" />
              ) : (
                <div className="cal-detail-txn-list txn-list">
                  {dayTransactions.map((item) => {
                    const isIncome = item.type === 'income';
                    const categoryName = getCategoryName(item.category);
                    const icon = getCategoryIcon(item.category);
                    const name = item.description || categoryName;

                    return (
                      <div key={item.id} className="txn-row">
                        <div className="txn-icon">{icon}</div>
                        <div className="txn-info">
                          <div className="txn-title">{name}</div>
                          <div className="txn-meta">
                            <span>{categoryName}</span>
                            <span>{item.created_at ? item.created_at.slice(11, 16) : ''}</span>
                          </div>
                        </div>
                        <div className={`txn-amount ${isIncome ? 'credit' : 'debit'}`}>
                          {formatAmountWithType(parseFloat(String(item.amount)), isIncome)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </GlobalModal>
  );
};
