// === Thoughtful Seatmate — Stage 1 scoped foundation tokens =================
//
// SCOPED + ISOLATED. These are the accepted Thoughtful Seatmate target-system
// values (visual-system closure: docs/ui/thoughtful-seatmate-visual-system-closure.md),
// exported here as a feature-scoped token object following the repo's established
// token pattern (named const exports, like HP / WARM / RADIUS in
// src/shared/lib/tokens.js). They are NOT global, do NOT replace any existing
// token, and are NOT imported by any production surface — only by the Stage 1
// primitives in this directory and the dev-only showcase. They mirror, 1:1, the
// `--ts-*` CSS custom properties declared in `./foundations.css` (scoped to the
// `.ts-root` class, never `:root`).
//
// Stage 1 is foundations only: nothing here is adopted into a production page.
// A future pilot (Tonight, then Film File) opts in by importing these primitives.
//
// HARD CONSTRAINTS (do not change in Stage 1):
//   • exactly one restrained solid rose accent (`brandRose`); `brandRoseContrast`
//     is ONLY the white-on-rose AA contrast variant, not a second accent identity
//   • NO gradient token, NO decision-signal color token, NO contextual-film-color
//     token, NO purple/plum target tokens

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
  canvas: '#15120f',
  surface1: '#1d1814',
  surface2: '#241e19',
  surfaceRaised: '#2d2621',
  // — Projection-ivory text hierarchy —
  textPrimary: '#f3ecdf',
  textSecondary: '#beb8ad',
  textMuted: '#8d887f',
  // — Subtle graphite borders —
  borderSubtle: '#302c28',
  borderStrong: '#46423d',
  // — Neutral primary action (projection-ivory fill, dark warm text) —
  actionPrimaryFill: '#efe7d7',
  actionPrimaryText: '#221b13',
  // — Focus (projection ivory) —
  focus: '#f3ecdf',
  // — One restrained solid rose accent (+ white-on-rose contrast variant only) —
  brandRose: '#dd4e83',
  brandRoseContrast: '#c0356c',
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
