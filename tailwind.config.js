/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'oklch(58% 0.18 255)',
        secondary: 'oklch(54% 0.012 250)',
        accent: 'oklch(58% 0.18 255)',
        bg: 'oklch(99% 0.002 240)',
        surface: 'oklch(100% 0 0)',
        fg: 'oklch(18% 0.012 250)',
        muted: 'oklch(54% 0.012 250)',
        border: 'oklch(92% 0.005 250)'
      },
      fontFamily: {
        display: ['"SF Pro Display"', '"Inter"', 'system-ui', 'sans-serif'],
        body: ['"SF Pro Text"', '"Inter"', 'system-ui', 'sans-serif']
      }
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