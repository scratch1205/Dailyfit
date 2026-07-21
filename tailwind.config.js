/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 中性米白底色
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
        // 主强调色：柔和陶土橙（非紫色系）
        clay: {
          50: '#FBF5F0',
          100: '#F5E6DC',
          200: '#EBCDB8',
          300: '#DFAE8C',
          400: '#D08E60',
          500: '#B8703F',
          600: '#9A5A30',
          700: '#7C4726',
          800: '#5E361D',
          900: '#422615',
        },
        // 辅助：沉静蓝灰
        slate2: {
          50: '#F4F6F8',
          100: '#E7EBEF',
          200: '#D0D7DE',
          300: '#B0BAC6',
          400: '#7A8B9E',
          500: '#5B7185',
          600: '#46596B',
          700: '#344453',
        },
        // 辅助：温暖琥珀（鞋子）
        amber: {
          50: '#FEF6E4',
          100: '#FDE9B8',
          200: '#FBD581',
          300: '#F9C04A',
          400: '#E8A317',
          500: '#C8850F',
          600: '#A66A0A',
          700: '#825008',
        },
        // 辅助：清新翠绿（包包）
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
      },
      minHeight: {
        'tap': '44px',
      },
      minWidth: {
        'tap': '44px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.8) translate(-50%, -50%)' },
          '60%': { opacity: '1', transform: 'scale(1.03) translate(-50%, -50%)' },
          '100%': { opacity: '1', transform: 'scale(1) translate(-50%, -50%)' },
        },
      },
    },
  },
  plugins: [],
}
