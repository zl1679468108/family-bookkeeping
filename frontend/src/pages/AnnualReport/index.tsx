import React, { useState, useRef, useMemo } from 'react';
import { useAnnualReport } from '../../hooks/useAnnualReport';
import { generateYearOptions } from '../../utils/month';
import { useBook } from '../../hooks/useBook';
import { useAuth } from '../../utils/auth';
import { captureLongImage } from '../../utils/exportImage';
import { Skeleton } from '../../components/ui/Skeleton';
import { DropdownSelect } from '../../components/ui/Dropdown';
import ReportCover from './ReportCover';
import ReportOverview from './ReportOverview';
import ReportMonthlyTrend from './ReportMonthlyTrend';
import ReportCategoryRank from './ReportCategoryRank';
import ReportRecords from './ReportRecords';
import ReportBookBreakdown from './ReportBookBreakdown';
import ReportMemberRanking from './ReportMemberRanking';
import ReportFunFact from './ReportFunFact';
import ReportFooter from './ReportFooter';
import { notifySuccess, notifyError } from '../../utils/notifyError'
import { Button } from '../../components/ui/Button'
import { ERROR_REPORT_NOT_LOADED, ERROR_SAVE_IMAGE } from '../../utils/errorCopy';
import { SUCCESS_REPORT_SAVED } from '../../utils/successCopy';

interface AnnualOverview {
  total_income: number;
  total_expense: number;
  balance: number;
  balance_rate: number;
}

interface AnnualMonthlyItem {
  month: number;
  income: number;
  expense: number;
}

interface AnnualCategoryItem {
  category_name: string;
  category_icon: string;
  category_type: string;
  amount: number;
  percentage: number;
}

interface AnnualRecordItem {
  amount: number;
  description?: string;
  counterparty?: string;
  date?: string;
  count?: number;
}

interface AnnualRecords {
  max_expense: AnnualRecordItem | null;
  max_expense_day: AnnualRecordItem | null;
  max_expense_merchant: AnnualRecordItem | null;
}

interface AnnualBookItem {
  book_id: string;
  book_name: string;
  amount: number;
  percentage: number;
}

interface AnnualMemberItem {
  user_id: string;
  nickname: string;
  expense: number;
  percentage: number;
}

interface AnnualFunFact {
  dining_total: number;
  daily_avg_expense: number;
  max_continuous_days: number;
}

interface AnnualReportData {
  overview: AnnualOverview;
  monthly: AnnualMonthlyItem[];
  top_categories: AnnualCategoryItem[];
  records: AnnualRecords;
  book_breakdown: AnnualBookItem[];
  member_ranking: AnnualMemberItem[];
  fun_fact: AnnualFunFact;
}

const CURRENT_YEAR = new Date().getFullYear();

const EMPTY_OVERVIEW: AnnualOverview = {
  total_income: 0,
  total_expense: 0,
  balance: 0,
  balance_rate: 0,
};

const EMPTY_RECORDS: AnnualRecords = {
  max_expense: null,
  max_expense_day: null,
  max_expense_merchant: null,
};

const EMPTY_FUN_FACT: AnnualFunFact = {
  dining_total: 0,
  daily_avg_expense: 0,
  max_continuous_days: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) return numericValue;
  }
  return fallback;
}

function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function clampPercent(value: unknown): number {
  return Math.min(100, Math.max(0, Math.round(toFiniteNumber(value))));
}

function normalizeRecordItem(value: unknown): AnnualRecordItem | null {
  if (!isRecord(value)) return null;

  const countValue = toFiniteNumber(value.count, NaN);
  return {
    amount: Math.max(0, toFiniteNumber(value.amount)),
    description: toStringValue(value.description),
    counterparty: toStringValue(value.counterparty),
    date: toStringValue(value.date),
    count: Number.isFinite(countValue) ? Math.max(0, Math.round(countValue)) : undefined,
  };
}

function normalizeAnnualReport(rawData: unknown): AnnualReportData | undefined {
  if (rawData === null || rawData === undefined) return undefined;

  const source = isRecord(rawData) ? rawData : {};
  const overview = isRecord(source.overview) ? source.overview : {};
  const records = isRecord(source.records) ? source.records : {};
  const funFact = isRecord(source.fun_fact) ? source.fun_fact : {};

  return {
    overview: {
      total_income: Math.max(0, toFiniteNumber(overview.total_income, EMPTY_OVERVIEW.total_income)),
      total_expense: Math.max(0, toFiniteNumber(overview.total_expense, EMPTY_OVERVIEW.total_expense)),
      balance: toFiniteNumber(overview.balance, EMPTY_OVERVIEW.balance),
      balance_rate: clampPercent(overview.balance_rate),
    },
    monthly: Array.isArray(source.monthly)
      ? source.monthly.map((item, index) => {
          const monthlyItem = isRecord(item) ? item : {};
          return {
            month: Math.min(12, Math.max(1, Math.round(toFiniteNumber(monthlyItem.month, index + 1)))),
            income: Math.max(0, toFiniteNumber(monthlyItem.income)),
            expense: Math.max(0, toFiniteNumber(monthlyItem.expense)),
          };
        })
      : [],
    top_categories: Array.isArray(source.top_categories)
      ? source.top_categories.map((item, index) => {
          const category = isRecord(item) ? item : {};
          return {
            category_name: toStringValue(category.category_name, `分类 ${index + 1}`),
            category_icon: toStringValue(category.category_icon, '📦'),
            category_type: toStringValue(category.category_type, 'expense'),
            amount: Math.max(0, toFiniteNumber(category.amount)),
            percentage: clampPercent(category.percentage),
          };
        })
      : [],
    records: {
      max_expense: normalizeRecordItem(records.max_expense) ?? EMPTY_RECORDS.max_expense,
      max_expense_day: normalizeRecordItem(records.max_expense_day) ?? EMPTY_RECORDS.max_expense_day,
      max_expense_merchant: normalizeRecordItem(records.max_expense_merchant) ?? EMPTY_RECORDS.max_expense_merchant,
    },
    book_breakdown: Array.isArray(source.book_breakdown)
      ? source.book_breakdown.map((item, index) => {
          const book = isRecord(item) ? item : {};
          return {
            book_id: toStringValue(book.book_id, `book-${index}`),
            book_name: toStringValue(book.book_name, `账本 ${index + 1}`),
            amount: Math.max(0, toFiniteNumber(book.amount)),
            percentage: clampPercent(book.percentage),
          };
        })
      : [],
    member_ranking: Array.isArray(source.member_ranking)
      ? source.member_ranking.map((item, index) => {
          const member = isRecord(item) ? item : {};
          return {
            user_id: toStringValue(member.user_id, `member-${index}`),
            nickname: toStringValue(member.nickname, `成员 ${index + 1}`),
            expense: Math.max(0, toFiniteNumber(member.expense)),
            percentage: clampPercent(member.percentage),
          };
        })
      : [],
    fun_fact: {
      dining_total: Math.max(0, toFiniteNumber(funFact.dining_total, EMPTY_FUN_FACT.dining_total)),
      daily_avg_expense: Math.max(0, toFiniteNumber(funFact.daily_avg_expense, EMPTY_FUN_FACT.daily_avg_expense)),
      max_continuous_days: Math.max(0, Math.round(toFiniteNumber(funFact.max_continuous_days, EMPTY_FUN_FACT.max_continuous_days))),
    },
  };
}

const AnnualReport: React.FC = () => {
  const [year, setYear] = useState(CURRENT_YEAR);
  const reportRef = useRef<HTMLDivElement>(null);
  const { currentBook } = useBook();
  const { user } = useAuth();

  const { data, isLoading, error } = useAnnualReport(year);

  // 生成年份选项（前后各 5 年，新→旧）
  const yearOptions = useMemo(
    () =>
      generateYearOptions({
        yearsBefore: 5,
        yearsAfter: 5,
        descending: true,
        labelStyle: 'spaced',
      }),
    [],
  );

  const handleSaveImage = async () => {
    if (!reportRef.current) {
      notifyError(ERROR_REPORT_NOT_LOADED);
      return;
    }
    try {
      await captureLongImage(reportRef.current, `${year}年度报告.png`);
      notifySuccess(SUCCESS_REPORT_SAVED);
    } catch (err) {
      console.error('AnnualReport captureLongImage error:', err);
      notifyError(ERROR_SAVE_IMAGE);
    }
  };

  const reportData = useMemo(() => normalizeAnnualReport(data), [data]);

  return (
    <div className="page-container">
      {/* 账本 & 年份选择区 */}
      <div
        style={{
          paddingBottom: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--bd)',
        }}
      >
        {/* 账本信息 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--srf)',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--fg)',
          }}
        >
          <span>📒</span>
          <span style={{ fontWeight: 500 }}>
            {currentBook?.name || '未选择账本'}
          </span>
        </div>

        {/* 年份选择器 */}
        <DropdownSelect
          options={yearOptions}
          value={String(year)}
          onChange={(key) => setYear(Number(key))}
          allowClear={false}
          width="auto"
          showSearch
          searchPlaceholder="搜索年份..."
        />
      </div>

      {/* Loading 状态 */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div style={{ width: '672px', minWidth: '672px', maxWidth: '672px', boxSizing: 'border-box', padding: '20px 16px', background: 'var(--bg)' }}>
            {/* 封面骨架 */}
            <Skeleton width="70%" height="36px" marginBottom="32px" />
            <Skeleton width="40%" height="20px" marginBottom="48px" />
            {/* 总览卡片骨架 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '32px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ padding: '16px', borderRadius: '12px', background: 'var(--srf)' }}>
                  <Skeleton width="60%" height="12px" marginBottom="8px" />
                  <Skeleton width="80%" height="24px" />
                </div>
              ))}
            </div>
            {/* 图表骨架 */}
            <Skeleton width="100%" height="200px" borderRadius="12px" marginBottom="24px" />
            <Skeleton width="100%" height="200px" borderRadius="12px" marginBottom="24px" />
            {/* 列表骨架 */}
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--bdL)' }}>
                <Skeleton width="40px" height="40px" borderRadius="8px" />
                <div style={{ flex: 1, marginLeft: '12px', marginRight: '12px' }}>
                  <Skeleton width="55%" height="14px" marginBottom="6px" />
                  <Skeleton width="35%" height="12px" />
                </div>
                <Skeleton width="64px" height="14px" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error 状态 */}
      {error && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--exp)',
            fontSize: '14px',
          }}
        >
          {error?.message || '数据加载失败，请稍后重试'}
        </div>
      )}

      {/* 报告内容 */}
      {!isLoading && !error && reportData && (
        <>
          {/* 居中 wrapper — 仅负责水平居中，不参与导出测量 */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {/* 报告容器 */}
            <div
              ref={reportRef}
              style={{
                width: '672px',
                minWidth: '672px',
                maxWidth: '672px',
                boxSizing: 'border-box',
                padding: '20px 16px',
                background: 'var(--bg)',
              }}
            >
              <ReportCover year={year} nickname={user?.username || '用户'} />
              <ReportOverview data={reportData.overview} />
              <ReportMonthlyTrend data={reportData.monthly} />
              <ReportCategoryRank data={reportData.top_categories} />
              <ReportRecords data={reportData.records} />
              <ReportBookBreakdown data={reportData.book_breakdown} />
              <ReportMemberRanking data={reportData.member_ranking} />
              <ReportFunFact data={reportData.fun_fact} />
              <ReportFooter />
            </div>
          </div>

          {/* 底部保存按钮 */}
          <div
            style={{
              padding: '16px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleSaveImage}
            >
              📷 保存为图片
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AnnualReport;
