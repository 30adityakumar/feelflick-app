// src/shared/styles/colors.js

/**
 * 🎨 FeelFlick Brand Colors
 * 
 * Primary: Purple (Creativity, Magic, Discovery)
 * Secondary: Pink (Passion, Excitement)
 * Background: Near-black (Cinematic)
 */

export const colors = {
  // Primary Palette
  primary: {
    main: '#A855F7',      // Vibrant purple
    light: '#C084FC',     // Lighter purple (hover states)
    dark: '#9333EA',      // Deeper purple (pressed states)
  },

  // Secondary Palette
  secondary: {
    main: '#EC4899',      // Hot pink
    light: '#F472B6',     // Lighter pink
    dark: '#DB2777',      // Deeper pink
  },

  // Accent Colors
  accent: {
    violet: '#8B5CF6',    // Deep violet
    fuchsia: '#D946EF',   // Fuchsia
  },

  // Backgrounds
  background: {
    primary: '#0a0a0a',   // Near black
    secondary: '#1a1a1a', // Dark surface
    elevated: '#262626',  // Elevated surface
  },

  // Text Colors
  text: {
    primary: '#ffffff',           // White
    secondary: 'rgba(255,255,255,0.7)',  // 70% white
    muted: 'rgba(255,255,255,0.5)',      // 50% white
    disabled: 'rgba(255,255,255,0.3)',   // 30% white
  },

  // Semantic Colors
  success: '#10B981',   // Green
  warning: '#F59E0B',   // Amber
  error: '#EF4444',     // Red
  info: '#3B82F6',      // Blue
}

/**
 * 🎨 Gradient Utilities
 * Use these for headlines, CTAs, and accents
 */
export const gradients = {
  // Purple → Pink (Primary brand gradient)
  primary: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
  
  // Purple → Violet (Subtle variant)
  subtle: 'linear-gradient(135deg, #A855F7 0%, #8B5CF6 100%)',
  
  // Pink → Fuchsia (Accent gradient)
  accent: 'linear-gradient(135deg, #EC4899 0%, #D946EF 100%)',
  
  // Dark overlay for hero sections
  darkOverlay: 'linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.8) 60%, rgba(10,10,10,1) 100%)',
}

/**
 * 🎨 Tailwind CSS Class Utilities
 * Use these in your components
 */
export const classNames = {
  // Gradient text
  gradientText: 'bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent',
  
  // Gradient background
  gradientBg: 'bg-gradient-to-r from-purple-500 to-pink-500',
  
  // Glass effect
  glass: 'bg-white/10 backdrop-blur-md border border-white/20',
  
  // Card surface
  card: 'bg-neutral-900 border border-white/10',
  
  // Hover glow effect
  glowHover: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-shadow duration-300',
}
