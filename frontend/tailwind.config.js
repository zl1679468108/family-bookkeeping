/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主色 — 绿色系（映射设计令牌，随 data-theme 切换）
        primary:    'var(--pr)',
        'primary-hover': 'var(--prH)',
        'primary-bg':    'var(--prBg)',
        'primary-border':'var(--prBd)',
        // 中性色 — 暖灰绿调
        bg:         'var(--bg)',
        surface:    'var(--srf)',
        'surface-hover': 'var(--srfH)',
        fg:         'var(--fg)',
        muted:      'var(--fg2)',
        'fg-tertiary': 'var(--fg3)',
        border:     'var(--bd)',
        'border-light': 'var(--bdL)',
        // 语义色
        income:     'var(--inc)',
        'income-bg':'var(--incBg)',
        expense:    'var(--exp)',
        'expense-bg':'var(--expBg)',
        warning:    'var(--warn)',
        'warning-bg':'var(--warnBg)',
        info:       'var(--info)',
        'info-bg':  'var(--infoBg)',
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
        'sm': 'var(--sh1)',
        'md': 'var(--sh2)',
        'lg': 'var(--sh3)',
        'xl': 'var(--sh4)',
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
