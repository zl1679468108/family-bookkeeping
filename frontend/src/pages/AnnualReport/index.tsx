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
import { ERROR_REPORT_NOT_LOADED, ERROR_SAVE_IMAGE, ERROR_DATA_LOAD_FAILED_RETRY } from '../../utils/errorCopy';
import { SUCCESS_REPORT_SAVED } from '../../utils/successCopy';
import { FORM_SEARCH_YEAR } from '../../utils/formCopy'
import { userDisplayName } from '../../utils/userDisplay'
import { EMPTY_BOOK_UNSELECTED } from '../../utils/entityCopy'
import { normalizeAnnualReport, annualReportFilename } from '../../utils/annualReport'
import { ACTION_SAVE_AS_IMAGE } from '../../utils/actionCopy'
import { reportClientError } from '../../utils/clientDiagnostics'

const CURRENT_YEAR = new Date().getFullYear();

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
      await captureLongImage(reportRef.current, annualReportFilename(year));
      notifySuccess(SUCCESS_REPORT_SAVED);
    } catch (err) {
      reportClientError('AnnualReport.captureLongImage', err);
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
            {currentBook?.name || EMPTY_BOOK_UNSELECTED}
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
          searchPlaceholder={FORM_SEARCH_YEAR}
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
          {error?.message || ERROR_DATA_LOAD_FAILED_RETRY}
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
              <ReportCover year={year} nickname={userDisplayName(user)} />
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
              {ACTION_SAVE_AS_IMAGE}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AnnualReport;
