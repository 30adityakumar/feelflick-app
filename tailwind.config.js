/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.25rem',
        lg: '2rem',
        xl: '2.5rem',
      },
    },
    extend: {
      colors: {
        // driven by CSS variables in index.css
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        panel: 'var(--panel)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        ring: 'var(--ring)',
        brand: {
          DEFAULT: 'var(--brand)',
          50:  'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          900: 'var(--brand-900)',
        },
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,.28)',
        lift: '0 8px 18px rgba(0,0,0,.22)',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [
    // enables @container variants like `@md:...` when container-type is set
    require('@tailwindcss/container-queries'),
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
}