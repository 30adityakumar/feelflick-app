// src/features/landing-v2/theme.js
// Shared design tokens for the v2 ("Conversational") landing only.
// Imported by all v2 sections — keeps colors, gradients, and helpers consistent.

export const BRAND = {
  bg:        '#000000',
  bgDeep:    '#06060A',
  card:      'rgba(255,255,255,0.05)',
  cardHi:    'rgba(255,255,255,0.10)',
  border:    'rgba(255,255,255,0.10)',
  borderHi:  'rgba(255,255,255,0.18)',
  white:     '#ffffff',
  w60:       'rgba(255,255,255,0.60)',
  w40:       'rgba(255,255,255,0.40)',
  w20:       'rgba(255,255,255,0.20)',
  purple:    '#a855f7',
  pink:      '#ec4899',
  amber:     '#fbbf24',
  gradient:      'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
  gradientHero:  'linear-gradient(90deg, #a855f7 0%, #ec4899 45%, #fbbf24 100%)',
}

export const tmdbImg = (size, path) => `https://image.tmdb.org/t/p/${size}${path}`
