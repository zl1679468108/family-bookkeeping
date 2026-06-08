import React, { useState, useRef, useMemo } from 'react';
import { Header } from '../../components/Header';
import { useAnnualReport } from '../../hooks/useAnnualReport';
import { useBook } from '../../hooks/useBook';
import { useAuth } from '../../utils/auth';
import { captureLongImage } from '../../utils/exportImage';
import { notify } from '../../utils/notifications';
import { Skeleton } from '../../components/ui/Skeleton';
import ReportCover from './ReportCover';
import ReportOverview from './ReportOverview';
import ReportMonthlyTrend from './ReportMonthlyTrend';
import ReportCategoryRank from './ReportCategoryRank';
import ReportRecords from './ReportRecords';
import ReportBookBreakdown from './ReportBookBreakdown';
import ReportMemberRanking from './ReportMemberRanking';
import ReportFunFact from './ReportFunFact';
import ReportFooter from './ReportFooter';

const CURRENT_YEAR = new Date().getFullYear();

const AnnualReport: React.FC = () => {
  const [year, setYear] = useState(CURRENT_YEAR);
  const reportRef = useRef<HTMLDivElement>(null);
  const { currentBook } = useBook();
  const { user } = useAuth();

  const bookId = currentBook?.id;
  const { data, isLoading, error } = useAnnualReport(year, bookId);

  // 生成年份选项（近 5 年）
  const yearOptions = useMemo(() => {
    const options: number[] = [];
    for (let y = CURRENT_YEAR; y >= CURRENT_YEAR - 4; y--) {
      options.push(y);
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
      notify({ type: 'error', message: `保存图片失败: ${(err as Error)?.message || '未知错误'}` });
    }
  };

  const reportData = data as any;

  return (
    <div className="page-container">
      <Header title="年度报告" />

      {/* 控件区 */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* 当前账本名称 */}
        <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
          {currentBook?.name || '未选择账本'}
        </span>

        {/* 年份选择器 */}
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--fg)',
            fontSize: '14px',
          }}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y} 年
            </option>
          ))}
        </select>
      </div>

      {/* Loading 状态 */}
      {isLoading && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px' }}>
          {/* 封面骨架 */}
          <Skeleton width="70%" height="36px" marginBottom="32px" />
          <Skeleton width="40%" height="20px" marginBottom="48px" />
          {/* 总览卡片骨架 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '32px' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ padding: '16px', borderRadius: '12px', background: '#fff' }}>
                <Skeleton width="60%" height="12px" marginBottom="8px" />
                <Skeleton width="80%" height="24px" />
              </div>
            ))}
          </div>
          {/* 图表骨架 */}
          <Skeleton width="100%" height="200px" borderRadius="12px" marginBottom="24px" />
          <Skeleton width="100%" height="200px" borderRadius="12px" marginBottom="24px" />
          {/* 列表骨架 */}
          {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Skeleton width="40px" height="40px" borderRadius="8px" />
              <div style={{ flex: 1, marginLeft: '12px', marginRight: '12px' }}>
                <Skeleton width="55%" height="14px" marginBottom="6px" />
                <Skeleton width="35%" height="12px" />
              </div>
              <Skeleton width="64px" height="14px" />
            </div>
          ))}
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
          {(error as any)?.message || '数据加载失败，请稍后重试'}
        </div>
      )}

      {/* 报告内容 */}
      {!isLoading && !error && reportData && (
        <>
          {/* 报告容器 */}
          <div
            ref={reportRef}
            style={{
              width: '100%',
              maxWidth: '640px',
              margin: '0 auto',
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
                gap: '8px',
                padding: '12px 32px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102,126,234,0.35)',
              }}
            >
              💾 保存长图
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AnnualReport;
