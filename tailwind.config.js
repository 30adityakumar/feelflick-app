/** @type {import('tailwindcss').Config} */

import plugin from 'tailwindcss/plugin'

const defaultSans = [
  'ui-sans-serif', 'system-ui', 'sans-serif',
  '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"',
]

export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        md: '2rem',
        lg: '2.5rem',
        xl: '3rem',
        '2xl': '4rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },

    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
      '4k': '2560px',
    },

    extend: {
      colors: {
        /* Compatibility scales. Under `.theme-thoughtful` these resolve to the
           canonical neutral/editorial ramp defined in src/index.css. */
        purple: {
          50: 'var(--purple-50)',
          100: 'var(--purple-100)',
          200: 'var(--purple-200)',
          300: 'var(--purple-300)',
          400: 'var(--purple-400)',
          500: 'var(--purple-500)',
          600: 'var(--purple-600)',
          700: 'var(--purple-700)',
          800: 'var(--purple-800)',
          900: 'var(--purple-900)',
        },
        pink: {
          50: 'var(--pink-50)',
          100: 'var(--pink-100)',
          200: 'var(--pink-200)',
          300: 'var(--pink-300)',
          400: 'var(--pink-400)',
          500: 'var(--pink-500)',
          600: 'var(--pink-600)',
          700: 'var(--pink-700)',
          800: 'var(--pink-800)',
          900: 'var(--pink-900)',
        },
      },

      fontFamily: {
        sans: ['Inter', ...defaultSans],
        display: ['Inter', ...defaultSans],
      },

      fontSize: {
        micro: ['0.625rem', { lineHeight: '0.875rem' }],
        md: ['1.0625rem', { lineHeight: '1.5rem' }],
        display: ['clamp(4rem, 12vw, 9rem)', { lineHeight: '1.0', letterSpacing: '-0.04em' }],
        hero: ['clamp(2.5rem, 8vw, 6rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        section: ['clamp(1.75rem, 4vw, 3rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        title: ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
      },

      borderRadius: {
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
      },

      boxShadow: {
        soft: '0 10px 30px rgba(0, 0, 0, 0.3)',
        lift: '0 8px 24px rgba(0, 0, 0, 0.25)',
        hover: '0 20px 40px rgba(0, 0, 0, 0.4)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },

      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'gradient-radial-at-t': 'radial-gradient(ellipse at top, var(--tw-gradient-stops))',
        'gradient-radial-at-b': 'radial-gradient(ellipse at bottom, var(--tw-gradient-stops))',
      },

      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-soft': 'cubic-bezier(0.64, 0, 0.78, 0)',
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      transitionDuration: {
        400: '400ms',
        600: '600ms',
        800: '800ms',
      },

      /* Historical animation names stay available for compatibility. Product
         surfaces should prefer purposeful state motion and reduced-motion guards. */
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in-down': 'fadeInDown 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scale-in': 'scaleIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        shimmer: 'shimmer 2s ease-in-out infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-orb': 'float-orb 8s ease-in-out infinite',
        'float-orb-2': 'float-orb 8s ease-in-out 2.7s infinite',
        'float-orb-3': 'float-orb 8s ease-in-out 5.1s infinite',
        'scroll-left': 'scroll-left 60s linear infinite',
        'scroll-right': 'scroll-right 60s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'scroll-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-33.33%)' },
        },
        'scroll-right': {
          '0%': { transform: 'translateX(-33.33%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'float-orb': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-30px)' },
        },
      },

      spacing: {
        18: '4.5rem',
        112: '28rem',
        128: '32rem',
      },

      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        100: '100',
      },
    },
  },

  plugins: [
    plugin(function({ addUtilities }) {
      /* Compatibility glass utilities: neutral ink, low saturation, and clear
         borders. New dense/editorial surfaces should prefer solid layers. */
      addUtilities({
        '.glass': {
          background: 'color-mix(in srgb, var(--color-surface-2, #222427) 78%, transparent)',
          backdropFilter: 'blur(24px) saturate(120%)',
          WebkitBackdropFilter: 'blur(24px) saturate(120%)',
          border: '1px solid color-mix(in srgb, var(--color-border-strong, #747a82) 48%, transparent)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        },
        '.glass-strong': {
          background: 'color-mix(in srgb, var(--color-surface-raised, #2e3135) 88%, transparent)',
          backdropFilter: 'blur(32px) saturate(120%)',
          WebkitBackdropFilter: 'blur(32px) saturate(120%)',
          border: '1px solid color-mix(in srgb, var(--color-border-strong, #747a82) 64%, transparent)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        },
        '.glass-subtle': {
          background: 'color-mix(in srgb, var(--color-surface-1, #171819) 66%, transparent)',
          backdropFilter: 'blur(16px) saturate(110%)',
          WebkitBackdropFilter: 'blur(16px) saturate(110%)',
          border: '1px solid color-mix(in srgb, var(--color-border-subtle, #3a3d41) 72%, transparent)',
        },
      })

      /* Legacy utility name, intentionally rendered as a solid accessible accent
         rather than a brand gradient. */
      addUtilities({
        '.gradient-text': {
          color: 'var(--color-brand-accent-text, #ed7a87)',
          background: 'none',
          WebkitTextFillColor: 'currentColor',
        },
      })

      addUtilities({
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
          touchAction: 'manipulation',
        },
      })
    }),
  ],

  future: {
    hoverOnlyWhenSupported: true,
  },
}
