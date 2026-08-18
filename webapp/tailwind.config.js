/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#050A06',
          900: '#080F0A',
          850: '#0B130E',
          800: '#121A15',
          700: '#18241E',
          600: '#22332A',
        },
        timber: {
          dark: '#080F0A',
          card: '#121A15',
          input: '#0B130E',
          primary: '#1E4620',
          emerald: '#10B981',
          accent: '#34D399',
          amber: '#D97706',
          amberLight: '#F59E0B',
          amberDark: '#B45309',
        },
        brand: {
          green: '#1E4620',
          emerald: '#10B981',
          amber: '#D97706',
          gold: '#F59E0B',
          dark: '#080F0A',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glow-emerald': '0 0 40px -10px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 40px -10px rgba(217, 119, 6, 0.35)',
      },
      keyframes: {
        auroraFloat1: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(60px, -40px) scale(1.15)' },
        },
        auroraFloat2: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(-50px, 50px) scale(1.2)' },
        },
        auroraFloat3: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1.1)' },
          '50%': { transform: 'translate(40px, 60px) scale(0.95)' },
        },
      },
      animation: {
        'aurora-1': 'auroraFloat1 18s ease-in-out infinite',
        'aurora-2': 'auroraFloat2 24s ease-in-out infinite',
        'aurora-3': 'auroraFloat3 20s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
