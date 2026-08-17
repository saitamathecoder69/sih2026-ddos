/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070b16',
          900: '#0a1020',
          850: '#0d1428',
          800: '#111a33',
          700: '#1a2547',
          600: '#28365f',
          500: '#3a4a78',
        },
        brand: {
          50: '#f3edff',
          100: '#e3d6ff',
          200: '#cbb0ff',
          300: '#b389ff',
          400: '#9a63ff',
          500: '#7c3aed',
          600: '#6326d4',
          700: '#4e1dab',
          800: '#3a1687',
          900: '#280f5e',
        },
        ok: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        warn: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        bad: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        info: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        tele: {
          400: '#22d3ee',
          500: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(124,58,237,0.25), 0 0 24px -6px rgba(124,58,237,0.35)',
      },
      keyframes: {
        pulseDot: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(0.85)' },
        },
        flowDash: {
          to: { strokeDashoffset: '-24' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
        flowDash: 'flowDash 0.9s linear infinite',
        slideUp: 'slideUp 0.25s ease-out',
        shimmer: 'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};
