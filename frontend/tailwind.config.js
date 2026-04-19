/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // Brand accent — Indigo
        primary: {
          DEFAULT: '#4f46e5',
          hover:   '#4338ca',
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Semantic surface tokens
        surface: '#ffffff',
        main:    '#f8fafc',
        subtle:  '#f1f5f9',
        muted:   '#64748b',
        border:  '#e2e8f0',
      },
      borderColor: {
        subtle: '#f1f5f9',
        active: '#4f46e5',
      },
      backgroundColor: {
        main:    '#f8fafc',
        surface: '#ffffff',
        subtle:  '#f1f5f9',
      },
      textColor: {
        main:  '#0f172a',
        muted: '#64748b',
      },
      boxShadow: {
        card:       '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-md':  '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.04)',
        'card-lg':  '0 8px 24px 0 rgb(0 0 0 / 0.10)',
        'btn':      '0 1px 2px 0 rgb(0 0 0 / 0.08)',
        'btn-primary': '0 2px 6px 0 rgb(79 70 229 / 0.35)',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' },         to: { opacity: '1' } },
        slideUp:      { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        zoomIn95:     { from: { transform: 'scale(0.95)', opacity: '0' },     to: { transform: 'scale(1)',     opacity: '1' } },
        pulse:        { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease both',
        'slide-up':   'slideUp 0.25s ease both',
        'zoom-in-95': 'zoomIn95 0.15s ease both',
      },
    },
  },
  plugins: [],
}
