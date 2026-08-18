/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#122814',
          green: '#1E4620',
          lightGreen: '#F0FDF4',
          accent: '#86EFAC',
          amber: '#D97706',
          amberLight: '#FEF3C7',
          bg: '#F8FAFC',
          border: '#E2E8F0',
          adminHeader: '#16324f',
          adminAccent: '#f4c95d',
          adminCard: '#fffaf2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(30, 70, 32, 0.15)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
