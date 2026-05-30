// === FeelFlick design tokens — single source of truth ======================
//
// The canonical values behind CLAUDE.md's "Editorial Language". The inline-style
// feature surfaces used to each declare their own near-identical `HP` object
// (14 copies that had quietly drifted); they now import from here.
//
// `HP` is the shared core. A surface that genuinely needs an extra/overridden
// value spreads this and adds it locally (see features/browse, features/discover)
// so any divergence is explicit rather than a silent copy-paste drift.
//
// WHY: one place to tune the palette; no more hunting 14 files. The v3 landing's
// `C` palette aligns with these same hexes and is a candidate to fold in next.

/** Core editorial palette for inline-style feature surfaces. */
export const HP = {
  bg: '#000000',
  bgDeep: '#06060a',
  panel: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#FAFAFA',
  textSoft: 'rgba(250,250,250,0.72)',
  textMuted: 'rgba(250,250,250,0.45)',
  // AA-large floor (~3.3:1). Was 0.28 ≈ 2.4:1, which failed AA outright across
  // every feature surface's faint labels. Matches the landing's C.textFaint.
  textFaint: 'rgba(250,250,250,0.40)',
  purple: '#A78BFA',
  purpleDeep: '#7C3AED',
  pink: '#EC4899',
  amber: '#F59E0B',
  red: '#EF4444',
  green: '#34D399',
}

/** The one brand gradient — purple-600 → pink-500. Never invent per-vibe variants. */
export const HP_GRAD = 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)'

/**
 * v3 landing palette. Same hexes as `HP`, different key names (hairline≈border,
 * textMid≈textSoft, bgPure≈bg) plus a few landing-only surface tints. Aliased to
 * `HP` where they align so the shared colors live in exactly one place.
 */
export const C = {
  bg: HP.bgDeep,
  bgPure: HP.bg,
  bgLight: '#0d0b14',
  bgPaper: '#0f0c18',
  text: HP.text,
  textHi: 'rgba(250,250,250,0.92)',
  textMid: HP.textSoft,
  textLow: 'rgba(250,250,250,0.55)',
  // Landing-scoped faint tier raised to an AA-large floor (~3.3:1). HP.textFaint
  // (0.28 ≈ 2.4:1) fails AA outright; small *informational* text uses textLow.
  textFaint: 'rgba(250,250,250,0.40)',
  hairline: HP.border,
  hairlineStrong: HP.borderStrong,
  purple: HP.purple,
  pink: HP.pink,
  amber: HP.amber,
  green: HP.green,
}
