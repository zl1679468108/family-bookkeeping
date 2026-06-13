/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主色 — 绿色系
        primary:    '#2D9D8A',
        'primary-hover': '#248B78',
        'primary-bg':    '#E7F5F2',
        'primary-border':'#C4E5DE',
        // 中性色 — 暖灰绿调
        bg:         '#F6F7F4',
        surface:    '#FFFFFF',
        'surface-hover': '#F9FAF8',
        fg:         '#1A1C19',
        muted:      '#5A5D58',
        'fg-tertiary': '#8B8E89',
        border:     '#E0E2DD',
        'border-light': '#EDEEE9',
        // 语义色
        income:     '#3BA272',
        'income-bg':'#EAF7F0',
        expense:    '#E06055',
        'expense-bg':'#FCEEED',
        warning:    '#E8A838',
        'warning-bg':'#FDF6E8',
        info:       '#4A90D9',
        'info-bg':  '#ECF3FB',
      },
      fontFamily: {
        display: ['"DM Sans"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'system-ui', 'sans-serif'],
        body:    ['"DM Sans"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', 'sans-serif'],
        mono:    ['"DM Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '18px',
        'xl': '24px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.04)',
        'md': '0 2px 8px rgba(0,0,0,0.06)',
        'lg': '0 8px 24px rgba(0,0,0,0.08)',
        'xl': '0 16px 48px rgba(0,0,0,0.12)',
      },
    },
    screens: {
      'sm': '360px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1440px',
      '2xl': '1920px'
    }
  },
  plugins: [],
}
