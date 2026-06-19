// === FeelFlick shared design tokens ==========================================
// Canonical color values live in the website theme. These aliases keep legacy
// inline-style surfaces aligned while preserving the emergency rollback values.

export const HP = {
  bg: 'var(--color-canvas, #0f1010)',
  bgDeep: 'var(--color-canvas, #0f1010)',
  panel: 'var(--color-surface-1, #171819)',
  border: 'var(--color-border-subtle, #3a3d41)',
  borderStrong: 'var(--color-border-strong, #747a82)',
  text: 'var(--color-text-primary, #f5f2eb)',
  textSoft: 'var(--color-text-secondary, #c9c5bc)',
  textMuted: 'var(--color-text-muted, #a5a198)',
  textFaint: 'var(--color-text-muted, #a5a198)',
  purple: 'var(--color-text-secondary, #a78bfa)',
  purpleDeep: 'var(--color-text-muted, #7c3aed)',
  pink: 'var(--color-brand-accent-text, #ed7a87)',
  amber: '#f59e0b',
  red: '#ef4444',
  green: '#34d399',
}

/** Legacy-only gradient. Production aliases neutralize it under the root theme. */
export const HP_GRAD = 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)'

/** Accessible coral-red text/signature accent on the dark theme. */
export const ROSE = 'var(--color-brand-accent-text, #ed7a87)'

/** Strong accent for rare white-text filled signature treatments. */
export const ROSE_DEEP = 'var(--color-brand-accent-strong, #b83d4f)'

/** Paper-white primary text. */
export const IVORY = 'var(--color-text-primary, #f5f2eb)'

/** Compatibility name retained for inline-style consumers. */
export const WARM = {
  ivory: '#f5f2eb',
  ivorySoft: 'rgba(245,242,235,0.82)',
  ivoryMeta: 'rgba(245,242,235,0.68)',
  ivoryLabel: 'rgba(245,242,235,0.76)',
  hairline: 'rgba(116,122,130,0.42)',
  warmKeyline: 'rgba(116,122,130,0.70)',
  roseMat: 'rgba(229,99,111,0.28)',
  roseFaint: 'rgba(229,99,111,0.14)',
}

export const C = {
  bg: HP.bgDeep,
  bgPure: HP.bg,
  bgLight: 'var(--color-surface-1, #171819)',
  bgPaper: 'var(--color-surface-2, #222427)',
  text: HP.text,
  textHi: 'var(--color-text-primary, #f5f2eb)',
  textMid: HP.textSoft,
  textLow: HP.textMuted,
  textFaint: HP.textMuted,
  hairline: HP.border,
  hairlineStrong: HP.borderStrong,
  purple: HP.textSoft,
  pink: HP.pink,
  amber: HP.amber,
  green: HP.green,
}

export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
}

export const SHADOW = {
  card: '0 1px 2px rgba(0,0,0,0.30)',
  hover: '0 12px 28px -16px rgba(0,0,0,0.72)',
  focus: '0 0 0 3px var(--color-focus-ring, rgba(245,242,235,0.48))',
}

export const SURFACE = {
  base: HP.bgDeep,
  panel: HP.panel,
  card: HP.panel,
  elevated: C.bgLight,
}

export const SPACE = {
  gutter: 88,
  gutterSm: 32,
  sectionLg: 80,
  section: 72,
  sectionMd: 56,
  sectionSm: 48,
  sectionXs: 40,
  stack: 24,
  stackSm: 16,
  stackXs: 12,
}

export const LAYOUT = {
  pageMax: 1280,
  pageWide: 1440,
  pageNarrow: 1080,
}

export const GUTTER = {
  mobile: 20,
  tablet: 32,
  desktop: 88,
}

export const TYPE = {
  pageTitle: { size: 'clamp(28px, 4vw, 44px)', weight: 300, spacing: '-0.03em', lineHeight: 1.05 },
  sectionTitle: { size: 'clamp(20px, 2.4vw, 28px)', weight: 500, spacing: '-0.02em', lineHeight: 1.1 },
  cardTitle: { size: 16, weight: 600, spacing: '-0.01em', lineHeight: 1.25 },
  body: { size: 'clamp(14px, 1vw, 15px)', weight: 400, spacing: '0em', lineHeight: 1.6 },
}

export const MOTION = {
  fast: '120ms',
  base: '180ms',
  slow: '240ms',
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  press: 'translateY(1px)',
}
