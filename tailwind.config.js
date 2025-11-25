/** @type {import('tailwindcss').Config} */

const { fontFamily } = require('tailwindcss/defaultTheme');
const plugin = require('tailwindcss/plugin');

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
      xs: '375px',    // iPhone SE
      sm: '640px',    // Small tablets
      md: '768px',    // Tablets
      lg: '1024px',   // Laptops
      xl: '1280px',   // Desktops
      '2xl': '1536px', // Large screens
      '3xl': '1920px', // Full HD
      '4k': '2560px',  // 4K displays
    },
    
    extend: {
      colors: {
        // Base colors driven by CSS variables
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        panel: 'var(--panel)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        
        // FeelFlick signature gradient palette
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
        rose: {
          50: 'var(--rose-50)',
          100: 'var(--rose-100)',
          200: 'var(--rose-200)',
          300: 'var(--rose-300)',
          400: 'var(--rose-400)',
          500: 'var(--rose-500)',
          600: 'var(--rose-600)',
          700: 'var(--rose-700)',
          800: 'var(--rose-800)',
          900: 'var(--rose-900)',
        },
        amber: {
          50: 'var(--amber-50)',
          100: 'var(--amber-100)',
          200: 'var(--amber-200)',
          300: 'var(--amber-300)',
          400: 'var(--amber-400)',
          500: 'var(--amber-500)',
          600: 'var(--amber-600)',
          700: 'var(--amber-700)',
          800: 'var(--amber-800)',
          900: 'var(--amber-900)',
        },
        orange: {
          50: 'var(--orange-50)',
          100: 'var(--orange-100)',
          200: 'var(--orange-200)',
          300: 'var(--orange-300)',
          400: 'var(--orange-400)',
          500: 'var(--orange-500)',
          600: 'var(--orange-600)',
          700: 'var(--orange-700)',
          800: 'var(--orange-800)',
          900: 'var(--orange-900)',
        },
      },
      
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
        display: ['Inter', ...fontFamily.sans],
      },
      
      fontSize: {
        'hero': ['clamp(2.5rem, 8vw, 6rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'section': ['clamp(1.75rem, 4vw, 3rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'title': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
      },
      
      borderRadius: {
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      
      boxShadow: {
        'soft': '0 10px 30px rgba(0, 0, 0, 0.3)',
        'lift': '0 8px 24px rgba(0, 0, 0, 0.25)',
        'hover': '0 20px 40px rgba(0, 0, 0, 0.4)',
        'glow-purple': '0 0 40px rgba(168, 85, 247, 0.4)',
        'glow-pink': '0 0 40px rgba(236, 72, 153, 0.4)',
        'glow-amber': '0 0 40px rgba(245, 158, 11, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      
      backdropBlur: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, var(--purple-500) 0%, var(--pink-500) 50%, var(--amber-500) 100%)',
        'gradient-secondary': 'linear-gradient(135deg, var(--purple-600) 0%, var(--rose-500) 100%)',
        'gradient-accent': 'linear-gradient(135deg, var(--pink-500) 0%, var(--orange-500) 100%)',
        'gradient-warm': 'linear-gradient(135deg, var(--amber-500) 0%, var(--orange-500) 100%)',
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
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in-down': 'fadeInDown 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scale-in': 'scaleIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
      },
      
      // Custom spacing for consistent rhythm
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem',
      },
      
      // Z-index scale
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  
  plugins: [
    // Container queries
    require('@tailwindcss/container-queries'),
    
    // Custom plugin for additional utilities
    plugin(function({ addUtilities, addComponents, theme }) {
      // Glassmorphism utilities
      addUtilities({
        '.glass': {
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(248, 250, 252, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        },
        '.glass-strong': {
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(248, 250, 252, 0.15)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        },
        '.glass-subtle': {
          background: 'rgba(30, 41, 59, 0.3)',
          backdropFilter: 'blur(16px) saturate(150%)',
          WebkitBackdropFilter: 'blur(16px) saturate(150%)',
          border: '1px solid rgba(248, 250, 252, 0.08)',
        },
      });
      
      // Gradient text
      addUtilities({
        '.gradient-text': {
          background: 'linear-gradient(135deg, var(--purple-500) 0%, var(--pink-500) 50%, var(--amber-500) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          backgroundSize: '200% 200%',
        },
      });
      
      // Touch targets
      addUtilities({
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
          touchAction: 'manipulation',
        },
      });
    }),
  ],
  
  future: {
    hoverOnlyWhenSupported: true,
  },
};
