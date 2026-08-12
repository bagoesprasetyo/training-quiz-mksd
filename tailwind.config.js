/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#0000FF', // Corporate Pure Blue primary per user choice
          700: '#0000cc',
          800: '#000099',
          900: '#000066',
          dark: '#050716',
        },
        surface: {
          light: '#FAFAFC',
          card: '#FFFFFF',
          dark: '#0F172A',
          cardDark: '#1E293B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'elevated': '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 20px rgba(0, 0, 255, 0.25)',
      },
      borderRadius: {
        'card': '16px',
      }
    },
  },
  plugins: [],
}
