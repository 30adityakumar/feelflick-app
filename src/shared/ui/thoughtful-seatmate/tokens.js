// === Thoughtful Seatmate — canonical website theme tokens ===================
//
// CANONICAL. These are the single JS source of truth for the website-wide theme,
// mirroring 1:1 the `--color-*` custom properties in `./foundations.css`
// (`.theme-thoughtful`). The website-wide globalization applies that theme once at
// the app root, so changing a value here (and in foundations.css) propagates to
// the shell, every route, and every shared component.
//
// `CANONICAL_THEME` keys mirror the `--color-*` / `--font-*` names; `TS_TOKENS`
// keeps the original Stage-1 key names (consumed by the primitives + the dev
// showcase) and is now derived from the canonical values so the two can never
// drift. CSS consumers should read `var(--color-*)` (or the temporary `--ts-*` /
// legacy aliases); JS inline styles read these objects.
//
// HARD CONSTRAINTS:
//   • exactly one restrained solid rose accent (`brandRose`); `brandRoseContrast`
//     is ONLY the white-on-rose AA contrast variant, not a second accent identity
//   • NO gradient token, NO decision-signal color token, NO contextual-film-color
//     token, NO purple/plum target tokens

/**
 * Canonical semantic theme tokens — the JS mirror of the canonical token contract.
 * The CSS mirror is `.theme-thoughtful` in `./foundations.css`; the two are kept in
 * sync by drift tests (neither is generated from the other). Together they are the one
 * canonical token contract behind every surface.
 */
export const CANONICAL_THEME = {
  colorCanvas: '#15120f',
  colorSurface1: '#1d1814',
  colorSurface2: '#241e19',
  colorSurfaceRaised: '#2d2621',
  colorTextPrimary: '#f3ecdf',
  colorTextSecondary: '#beb8ad',
  colorTextMuted: '#8d887f',
  colorBorderSubtle: '#302c28',
  colorBorderStrong: '#46423d',
  colorActionPrimaryFill: '#efe7d7',
  colorActionPrimaryText: '#221b13',
  colorFocus: '#f3ecdf',
  colorDecision: '#f3ecdf',
  colorBrandRose: '#dd4e83',
  colorBrandRoseContrast: '#c0356c',
  fontUi: "'Inter', system-ui, -apple-system, sans-serif",
  fontDisplay: "'Inter', system-ui, -apple-system, sans-serif",
}

/**
 * Stage 1 (Thoughtful Seatmate) foundation tokens. Mirrors `.ts-root` in
 * `./foundations.css`. Consumed in JS inline styles; CSS consumers use `var(--ts-*)`.
 * @type {{
 *   canvas:string, surface1:string, surface2:string, surfaceRaised:string,
 *   textPrimary:string, textSecondary:string, textMuted:string,
 *   borderSubtle:string, borderStrong:string,
 *   actionPrimaryFill:string, actionPrimaryText:string, focus:string,
 *   brandRose:string, brandRoseContrast:string
 * }}
 */
export const TS_TOKENS = {
  // — Background depth + solid graphite surfaces (near-black → warm graphite) —
  canvas: CANONICAL_THEME.colorCanvas,
  surface1: CANONICAL_THEME.colorSurface1,
  surface2: CANONICAL_THEME.colorSurface2,
  surfaceRaised: CANONICAL_THEME.colorSurfaceRaised,
  // — Projection-ivory text hierarchy —
  textPrimary: CANONICAL_THEME.colorTextPrimary,
  textSecondary: CANONICAL_THEME.colorTextSecondary,
  textMuted: CANONICAL_THEME.colorTextMuted,
  // — Subtle graphite borders —
  borderSubtle: CANONICAL_THEME.colorBorderSubtle,
  borderStrong: CANONICAL_THEME.colorBorderStrong,
  // — Neutral primary action (projection-ivory fill, dark warm text) —
  actionPrimaryFill: CANONICAL_THEME.colorActionPrimaryFill,
  actionPrimaryText: CANONICAL_THEME.colorActionPrimaryText,
  // — Focus (projection ivory) —
  focus: CANONICAL_THEME.colorFocus,
  // — One restrained solid rose accent (+ white-on-rose contrast variant only) —
  brandRose: CANONICAL_THEME.colorBrandRose,
  brandRoseContrast: CANONICAL_THEME.colorBrandRoseContrast,
}

/**
 * The neutral background-depth recipes (CSS strings), expressed over the scoped
 * surface tokens. This is a NEUTRAL atmospheric treatment, NOT a brand gradient
 * and NOT a replacement for the retired legacy purple→pink gradient. Radial is
 * preferred; linear is permitted only where the surface geometry requires it.
 */
export const TS_PAGE_DEPTH = {
  radial: `radial-gradient(circle at 50% 0%, ${TS_TOKENS.surface2} 0%, ${TS_TOKENS.surface1} 38%, ${TS_TOKENS.canvas} 100%)`,
  linear: `linear-gradient(180deg, ${TS_TOKENS.surface2} 0%, ${TS_TOKENS.surface1} 42%, ${TS_TOKENS.canvas} 100%)`,
  none: TS_TOKENS.canvas,
}
