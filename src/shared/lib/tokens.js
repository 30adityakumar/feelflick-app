// === FeelFlick design tokens — single source of truth ======================
//
// The canonical values behind CLAUDE.md's "Editorial Language". The inline-style
// feature surfaces used to each declare their own near-identical `HP` object
// (14 copies that had quietly drifted); they now import from here.
//
// `HP` is the shared core. A surface that genuinely needs an extra/overridden
// value spreads this and adds it locally (see features/browse, features/discover —
// both already import `HP as baseHP` and spread it; the old "inline HP holdout"
// is resolved) so any divergence is explicit rather than a silent copy-paste drift.
//
// BRAND vs SEMANTIC (F3 hardening): the palette is two groups —
//   • BRAND — purple + pink (+ the single `HP_GRAD`). These, and ONLY these, are
//     the gradient/identity hues. Never invent per-vibe variants; never use
//     amber/orange/rose for brand ambient or accents.
//   • SEMANTIC accents — amber / red / green. NOT brand colors, but load-bearing:
//     amber = gold rating-stars + "stale"/caution, red = destructive/error,
//     green = success/public/watched. Keep them — removing breaks ratings,
//     destructive states, and status badges across the app.
//
// WHY: one place to tune the palette. The v3 landing's `C` palette aligns with
// these same hexes and is a candidate to fold in next (deferred — `C` is used
// across the visual-regression-tested landing).

/** Core editorial palette for inline-style feature surfaces. */
export const HP = {
  // — Surfaces & text —
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
  // — Brand (the ONLY identity / gradient hues) —
  purple: '#A78BFA',
  purpleDeep: '#7C3AED',
  pink: '#EC4899',
  // — Semantic accents (NOT brand; never use in brand gradients/ambient) —
  amber: '#F59E0B', // gold rating-stars · "stale" / caution
  red: '#EF4444',   // destructive / error
  green: '#34D399', // success / public / watched
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

// === Shape / elevation / surface scales (F11B.1) ===========================
//
// The non-color side of the system. F11A found radii were ad-hoc inline values
// (3/4/5/6/8/10/14/999 across 300+ call sites) with no scale, and shadows were
// one-off inline strings. These give the inline-style surfaces a shared target.
//
// ADDITIVE + non-breaking: nothing consumes these yet beyond the `Card` primitive
// and docs examples — existing call sites are migrated deliberately in later F11B
// waves (where any visual-baseline route change is re-baselined on purpose).

/**
 * Radius scale (px). Covers the ad-hoc inline values F11A catalogued; `pill` is
 * the fully-rounded value (Tailwind `rounded-full` ≈ 9999px).
 * @type {{ xs: number, sm: number, md: number, lg: number, xl: number, pill: number }}
 */
export const RADIUS = {
  xs: 4, // chips / tiny controls (was 3–5)
  sm: 6, // small buttons / inputs (the most common inline value)
  md: 8, // cards / callouts (the next most common)
  lg: 12, // larger panels (was 10)
  xl: 16, // hero panels / sheets (was 14; matches EmptyState's rounded-2xl)
  pill: 9999, // fully rounded — buttons, mood/genre chips
}

/**
 * Elevation. FeelFlick prefers BORDERS over shadows (doctrine); these are the few
 * sanctioned uses. `focus` is the brand purple ring (#A78BFA = HP.purple).
 * @type {{ card: string, hover: string, focus: string }}
 */
export const SHADOW = {
  card: '0 1px 2px rgba(0,0,0,0.30)', // barely-there base (optional; borders do most of the work)
  hover: '0 10px 30px -12px rgba(0,0,0,0.55)', // subtle lift for an interactive card
  focus: '0 0 0 3px rgba(167,139,250,0.45)', // brand focus ring (HP.purple @ 0.45)
}

/**
 * Surface tints — semantic aliases over the existing surface hexes so callouts
 * name their tint instead of repeating raw values. Same values as HP/C today;
 * named separately so a future divergence is explicit, not a copy-paste.
 * @type {{ base: string, panel: string, card: string, elevated: string }}
 */
export const SURFACE = {
  base: HP.bgDeep, // #06060a — page base
  panel: HP.panel, // rgba(255,255,255,0.04) — faint panel tint
  card: HP.panel, // callout / card tint (= panel today)
  elevated: C.bgLight, // #0d0b14 — modals / menus (matches --bg-elevated)
}
