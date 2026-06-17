/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#0A84FF',
          700: '#0066cc',
          800: '#004499',
          900: '#003377',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F2F2F7',
          tertiary: '#E5E5EA',
        },
        dark: {
          surface: '#1C1C1E',
          secondary: '#2C2C2E',
          tertiary: '#3A3A3C',
        },
        success: '#34C759',
        warning: '#FF9500',
        danger:  '#FF3B30',
        info:    '#0A84FF',
      },
      fontFamily: {
        sans: ['SF Pro Display', 'System'],
        mono: ['SF Mono', 'Courier New'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
};
