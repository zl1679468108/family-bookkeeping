import React, { useMemo } from 'react';
import { getThemeColors } from '../../utils/themeColors';
import { useTheme } from '../../utils/theme';
import { USER_FALLBACK } from '../../utils/userDisplay'
import { TITLE_REPORT_ANNUAL_SPEND } from '../../utils/sectionCopy'
import { annualYearLabel, annualReportSubtitle } from '../../utils/annualReport'

interface Props {
  year: number;
  nickname?: string;
}

const ReportCover: React.FC<Props> = ({ year, nickname }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const palette = useMemo(() => {
    const c = getThemeColors();
    if (isDark) {
      return {
        background: `linear-gradient(180deg, ${c.infoBg} 0%, ${c.prBg} 48%, ${c.bg} 100%)`,
        text: c.fg,
        hill1: c.pr,
        hill2: c.inc,
        tree: c.prH,
        glow: c.srf,
        flower: c.warn,
        flowerAlt: c.exp,
        chipBg: 'color-mix(in srgb, var(--srf) 22%, transparent)',
      };
    }
    return {
      // 亮色保持插画饱和度，文字用 on-pr 白以保证对比
      background: `linear-gradient(180deg, color-mix(in srgb, ${c.info} 72%, ${c.onPr}) 0%, color-mix(in srgb, ${c.pr} 55%, ${c.inc}) 48%, color-mix(in srgb, ${c.incBg} 55%, ${c.pr}) 100%)`,
      text: c.onPr,
      hill1: c.pr,
      hill2: c.inc,
      tree: c.prH,
      glow: `color-mix(in srgb, ${c.onPr} 22%, transparent)`,
      flower: c.warn,
      flowerAlt: c.exp,
      chipBg: 'color-mix(in srgb, var(--on-pr) 20%, transparent)',
    };
  }, [isDark, resolvedTheme]);

  return (
    <div
      className="py-16 px-6 relative overflow-hidden"
      style={{
        background: palette.background,
        color: palette.text,
        borderRadius: '16px',
        marginBottom: '24px',
        boxShadow: 'var(--sh3)',
      }}
    >
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="100" cy="180" rx="150" ry="40" fill={palette.glow} opacity={isDark ? 0.12 : 1} />
        <ellipse cx="400" cy="190" rx="200" ry="35" fill={palette.glow} opacity={isDark ? 0.1 : 0.7} />
        <ellipse cx="500" cy="170" rx="100" ry="25" fill={palette.glow} opacity={isDark ? 0.08 : 0.5} />
        <path d="M0,140 Q50,100 100,120 T200,110 T300,125 T400,105 T500,130 T600,115 L600,200 L0,200 Z" fill={palette.hill1} opacity="0.55" />
        <path d="M0,150 Q60,130 120,145 T240,135 T360,150 T480,130 T600,145 L600,200 L0,200 Z" fill={palette.hill2} opacity="0.45" />
        <circle cx="50" cy="120" r="30" fill={palette.tree} opacity="0.65">
          <animate attributeName="cx" values="50;55;50" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="480" cy="110" r="25" fill={palette.tree} opacity="0.55">
          <animate attributeName="cx" values="480;475;480" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="550" cy="100" r="20" fill={palette.hill1} opacity="0.45">
          <animate attributeName="cx" values="550;555;550" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="160" r="8" fill={palette.flower} opacity="0.6" />
        <circle cx="120" cy="155" r="6" fill={palette.flowerAlt} opacity="0.5" />
        <circle cx="450" cy="165" r="7" fill={palette.flower} opacity="0.5" />
        <circle cx="470" cy="175" r="5" fill={palette.flowerAlt} opacity="0.55" />
        <circle cx="520" cy="160" r="6" fill={palette.flower} opacity="0.4" />
      </svg>

      <div className="relative z-10 text-center">
        <div className="text-sm opacity-90 mb-3">{annualYearLabel(year)}</div>
        <h1 className="text-3xl font-bold mb-4" style={{ textShadow: '0 2px 4px color-mix(in srgb, var(--fg) 12%, transparent)' }}>
          {TITLE_REPORT_ANNUAL_SPEND}
        </h1>
        <div className="text-lg opacity-95 mb-6">{annualReportSubtitle(nickname || USER_FALLBACK)}</div>
        <div className="flex justify-center gap-3">
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-sm"
            style={{ background: palette.chipBg }}
          >
            👨‍👩‍👧‍👦
          </span>
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-sm"
            style={{ background: palette.chipBg }}
          >
            💰
          </span>
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-sm"
            style={{ background: palette.chipBg }}
          >
            📊
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReportCover;
