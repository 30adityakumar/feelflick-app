// FeelFlick — Movie page v2 static defaults.
//
// What's here:
//   - Visual brand tokens (HP, HP_GRAD) — used directly by every section
//   - Default film palette (FILM_PALETTE) — accent colors for the Mood Radar
//     filled-shape, confetti, etc., when no per-film palette is curated. Once
//     the overlay row has `film_palette`, it overrides this.
//   - TIMELINE — fallback Parasite milestones used by TimelineSection when
//     a film has no real release-path data. PR-5 follow-up may move this.
//   - DNA_DELTA — projected motif weights used by the locked DNADelta until
//     PR 5 lands real before/after snapshots.
//
// Everything else (WHY, MOOD_FINGERPRINT, FF_TAKE, CRITIC_QUOTES, MV, etc.)
// now lives in movies_editorial_overlay (curated) or is derived from TMDB +
// taste-engine data at fetch time — see ./useMovieData.jsx, ./derive/.

// === Default film palette (override per-film via overlay.film_palette) ===
const FILM_PALETTE = {
  primary:   '#C8392F',
  secondary: '#F2C24B',
  glow:      '#7B2A1F',
  accent:    '#A78BFA',
  rgb: {
    primary:   '200, 57, 47',
    secondary: '242, 194, 75',
    glow:      '123, 42, 31',
    accent:    '167, 139, 250',
  },
}

// === Release timeline fallback ===
// Used by TimelineSection when the curated overlay doesn't provide one and
// we have no richer signal than the film's release_date. Currently the
// Parasite milestones serve as a placeholder visual — PR 5 will swap for
// per-film derived data.
const TIMELINE = [
  { date: 'May 21, 2019', label: 'Cannes premiere',  note: 'Palme d’Or' },
  { date: 'May 30, 2019', label: 'Korean release',   note: null },
  { date: 'Oct 11, 2019', label: 'US theatrical',    note: 'Limited → wide' },
  { date: 'Feb 9, 2020',  label: 'Oscar sweep',      note: '4 wins · 6 nominations' },
  { date: 'Jul 8, 2020',  label: 'Streaming debut',  note: 'Hulu' },
]

// === DNA delta (projected) — replaced by real before/after in PR 5 ===
const DNA_DELTA = [
  { motif: 'Class tension',  before: 0.68, after: 0.72 },
  { motif: 'Director: Bong', before: 0.00, after: 1.00 },
  { motif: 'Dark-comic',     before: 0.34, after: 0.39 },
]

// === Brand tokens ===
const HP = {
  bg:           '#000000',
  bgDeep:       '#06060a',
  border:       'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text:         '#FAFAFA',
  textSoft:     'rgba(250,250,250,0.72)',
  textMuted:    'rgba(250,250,250,0.45)',
  textFaint:    'rgba(250,250,250,0.28)',
  purple:       '#A78BFA',
  purpleDeep:   '#7C3AED',
  pink:         '#EC4899',
  amber:        '#F59E0B',
}
const HP_GRAD = 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)'

export { FILM_PALETTE, TIMELINE, DNA_DELTA, HP, HP_GRAD }
