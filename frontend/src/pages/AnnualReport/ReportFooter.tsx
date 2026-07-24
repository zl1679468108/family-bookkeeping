import React from 'react';
import { TAGLINE_BOOKKEEPING_CLEARER } from '../../utils/sectionCopy'
import { annualReportGeneratedAt, annualReportCopyright } from '../../utils/annualReport'
import { APP_NAME } from '../../config/version'

const ReportFooter: React.FC = () => {
  return (
    <div className="text-center py-8 px-4">
      <div className="flex justify-center gap-2 mb-4">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-full"
          style={{ background: 'var(--incBg)', color: 'var(--inc)' }}
        >
          💰
        </span>
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-full"
          style={{ background: 'var(--infoBg)', color: 'var(--info)' }}
        >
          📊
        </span>
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-full"
          style={{ background: 'var(--warnBg)', color: 'var(--warn)' }}
        >
          🎯
        </span>
      </div>
      <div className="text-sm mb-2 font-medium" style={{ color: 'var(--fg3)' }}>
        {TAGLINE_BOOKKEEPING_CLEARER}
      </div>
      <div className="text-xs" style={{ color: 'var(--fg3)' }}>
        {annualReportGeneratedAt()}
      </div>
      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--bdL)' }}>
        <div className="text-xs" style={{ color: 'var(--fg3)', opacity: 0.7 }}>
          {annualReportCopyright(APP_NAME)}
        </div>
      </div>
    </div>
  );
};

export default ReportFooter;
