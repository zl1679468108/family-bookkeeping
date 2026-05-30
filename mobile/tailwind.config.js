/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F6E56',
          light: '#1D9E75',
          bg: '#E1F5EE',
        },
        danger: '#D85A30',
        success: '#1D9E75',
        warning: '#F59E0B',
        bg: '#F0F4F3',
        card: '#FFFFFF',
        text: {
          DEFAULT: '#1A1A1A',
          secondary: '#8A8F8D',
        },
        category: {
          orange: '#FFF0E8',
          blue: '#E8F0FF',
          pink: '#FFE8F0',
          purple: '#F0E8FF',
          amber: '#FFF8E0',
          teal: '#E0FFF5',
          green: '#E8FFE8',
          red: '#FFE8E8',
        },
      },
      borderRadius: {
        '2xl': '16px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
