import React, { useState, useRef, useMemo } from 'react';
import { useAnnualReport } from '../../hooks/useAnnualReport';
import { useBook } from '../../hooks/useBook';
import { useAuth } from '../../utils/auth';
import { captureLongImage } from '../../utils/exportImage';
import { notify } from '../../utils/notifications';
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

interface AnnualReportData {
  overview: any;
  monthly: any[];
  top_categories: any[];
  records: any;
  book_breakdown: any[];
  member_ranking: any[];
  fun_fact: any;
}

const CURRENT_YEAR = new Date().getFullYear();

const AnnualReport: React.FC = () => {
  const [year, setYear] = useState(CURRENT_YEAR);
  const reportRef = useRef<HTMLDivElement>(null);
  const { currentBook } = useBook();
  const { user } = useAuth();

  const bookId = currentBook?.id;
  const { data, isLoading, error } = useAnnualReport(year, bookId);

  // 生成年份选项（前后各 5 年）
  const yearOptions = useMemo(() => {
    const options: { key: string; label: string }[] = [];
    for (let y = CURRENT_YEAR + 5; y >= CURRENT_YEAR - 5; y--) {
      options.push({ key: String(y), label: `${y} 年` });
    }
    return options;
  }, []);

  const handleSaveImage = async () => {
    if (!reportRef.current) {
      notify({ type: 'error', message: '报告内容未加载' });
      return;
    }
    try {
      await captureLongImage(reportRef.current, `${year}年度报告.png`);
      notify({ type: 'success', message: '年度报告已保存为图片' });
    } catch (err) {
      console.error('AnnualReport captureLongImage error:', err);
      notify({ type: 'error', message: '保存图片失败，请重试' });
    }
  };

  const reportData = data as AnnualReportData | undefined;

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
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* 账本信息 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--surface)',
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
                <div key={i} style={{ padding: '16px', borderRadius: '12px', background: 'var(--surface, #fff)' }}>
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
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border, #f0f0f0)' }}>
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
            color: 'var(--danger)',
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
            <button
              type="button"
              onClick={handleSaveImage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 40px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #4CAF50 0%, #45B74A 100%)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                transition: 'all 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(76, 175, 80, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
              }}
            >
              📷 保存为图片
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AnnualReport;
