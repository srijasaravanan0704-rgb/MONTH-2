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
        dark: {
          black: '#080808',
          charcoal: '#121212',
          graphite: '#1A1A1A',
          surface: '#222222',
          hover: '#262626',
        },
        gold: {
          DEFAULT: '#D4AF37',
          metallic: '#D4AF37',
          bright: '#FFD700',
          light: '#F5E6B3',
          dark: '#AA820A',
          border: '#66521A',
          dim: '#4D3D10',
          glow: 'rgba(212, 175, 55, 0.25)',
        },
        luxury: {
          black: '#080808',
          charcoal: '#121212',
          graphite: '#1A1A1A',
          border: '#66521A',
          gold: '#D4AF37',
          bright: '#FFD700',
          text: '#F5F5F5',
          muted: '#A0A0A0',
        },
        navy: {
          950: '#080808', // Main background: Deep black
          900: '#121212', // Secondary background: Rich charcoal
          850: '#161616',
          800: '#1A1A1A', // Cards and panels: Dark graphite
          700: '#222222',
          600: '#2E2E2E',
        },
        accent: {
          gold: '#D4AF37',
          brightGold: '#FFD700',
          darkGold: '#66521A',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
          orange: '#F97316',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
