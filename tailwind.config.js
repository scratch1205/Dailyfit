/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // DailyFit 主题色：中性灰 + 米白
        cream: '#FAFAF9',
        warm: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
      },
      // 确保点击区域 ≥ 44px
      minHeight: {
        'tap': '44px',
      },
      minWidth: {
        'tap': '44px',
      },
    },
  },
  plugins: [],
}