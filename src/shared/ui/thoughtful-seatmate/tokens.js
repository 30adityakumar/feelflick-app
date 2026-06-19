// === FeelFlick — canonical Adaptive Editorial Cinema tokens =================
//
// CSS mirror: ./foundations.css. The website applies the theme once at the app
// root; changing this contract and its CSS mirror propagates to every route.
//
// HARD CONSTRAINTS:
//   • Inter is the single core typeface
//   • deep neutral ink + paper-white text
//   • neutral inverse primary action
//   • one cinematic coral-red signature family, separate from semantic colors
//   • no purple/plum target tokens and no brand-gradient token
//   • flat canvas is the default; atmospheric depth is opt-in

export const CANONICAL_THEME = {
  colorCanvas: '#0f1010',
  colorSurface1: '#171819',
  colorSurface2: '#222427',
  colorSurfaceRaised: '#2e3135',
  colorTextPrimary: '#f5f2eb',
  colorTextSecondary: '#c9c5bc',
  colorTextMuted: '#a5a198',
  colorBorderSubtle: '#3a3d41',
  colorBorderStrong: '#747a82',
  colorActionPrimaryFill: '#f0ece4',
  colorActionPrimaryText: '#0f1010',
  colorFocus: '#f5f2eb',
  colorDecision: '#f5f2eb',
  colorBrandAccent: '#e5636f',
  colorBrandAccentText: '#ed7a87',
  colorBrandAccentStrong: '#b83d4f',
  fontUi: "'Inter', system-ui, -apple-system, sans-serif",
  fontDisplay: "'Inter', system-ui, -apple-system, sans-serif",
}

/**
 * Composition-scoped aliases consumed by the Thoughtful Seatmate primitives.
 * The historical TS_TOKENS name remains to avoid a disruptive API rename.
 */
export const TS_TOKENS = {
  canvas: CANONICAL_THEME.colorCanvas,
  surface1: CANONICAL_THEME.colorSurface1,
  surface2: CANONICAL_THEME.colorSurface2,
  surfaceRaised: CANONICAL_THEME.colorSurfaceRaised,
  textPrimary: CANONICAL_THEME.colorTextPrimary,
  textSecondary: CANONICAL_THEME.colorTextSecondary,
  textMuted: CANONICAL_THEME.colorTextMuted,
  borderSubtle: CANONICAL_THEME.colorBorderSubtle,
  borderStrong: CANONICAL_THEME.colorBorderStrong,
  actionPrimaryFill: CANONICAL_THEME.colorActionPrimaryFill,
  actionPrimaryText: CANONICAL_THEME.colorActionPrimaryText,
  focus: CANONICAL_THEME.colorFocus,
  brandAccent: CANONICAL_THEME.colorBrandAccent,
  brandAccentText: CANONICAL_THEME.colorBrandAccentText,
  brandAccentStrong: CANONICAL_THEME.colorBrandAccentStrong,
}

/**
 * Opt-in soft-stage recipes. `none` is the default composition state.
 */
export const TS_PAGE_DEPTH = {
  radial: `radial-gradient(circle at 50% 0%, ${TS_TOKENS.surface2} 0%, ${TS_TOKENS.surface1} 34%, ${TS_TOKENS.canvas} 78%)`,
  linear: `linear-gradient(180deg, ${TS_TOKENS.surface2} 0%, ${TS_TOKENS.surface1} 38%, ${TS_TOKENS.canvas} 82%)`,
  none: TS_TOKENS.canvas,
}
