// FeelFlick — Movie page v2 static defaults.
//
// What's here:
//   - Visual brand tokens (HP, HP_GRAD) — used directly by every section
//   - Default film palette (FILM_PALETTE) — accent colors for the Mood Radar
//     filled-shape, confetti, etc., when no per-film palette is curated. Once
//     the overlay row has `film_palette`, it overrides this.
//   - PARASITE_TIMELINE_SAMPLE / PARASITE_DNA_DELTA_SAMPLE — curated Parasite-ONLY
//     samples, rendered exclusively for Parasite (id 496243) behind the
//     PARASITE_TMDB_ID gate in sections-bottom. NOT per-film data; never broaden
//     them to other films (that would fabricate a timeline / DNA delta).
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

// === Parasite-ONLY curated sample: release timeline ===
// Hand-coded Parasite milestones, rendered ONLY for Parasite (id 496243) via the
// PARASITE_TMDB_ID gate in sections-bottom (TimelineSection). Every other film
// falls back to its real release_date — never these. Do NOT broaden to all films
// (that would fabricate a Cannes→Oscar path for unrelated movies). A per-film
// `release_timeline` overlay column could retire this later.
const PARASITE_TIMELINE_SAMPLE = [
  { date: 'May 21, 2019', label: 'Cannes premiere',  note: 'Palme d’Or' },
  { date: 'May 30, 2019', label: 'Korean release',   note: null },
  { date: 'Oct 11, 2019', label: 'US theatrical',    note: 'Limited → wide' },
  { date: 'Feb 9, 2020',  label: 'Oscar sweep',      note: '4 wins · 6 nominations' },
  { date: 'Jul 8, 2020',  label: 'Streaming debut',  note: 'Hulu' },
]

// === Parasite-ONLY curated sample: DNA delta (projected) ===
// Projected motif before/after, rendered ONLY for Parasite via the
// PARASITE_TMDB_ID gate (DNADelta in sections-bottom). Not real per-film data;
// do NOT broaden to other films.
const PARASITE_DNA_DELTA_SAMPLE = [
  { motif: 'Class tension',  before: 0.68, after: 0.72 },
  { motif: 'Director: Bong', before: 0.00, after: 1.00 },
  { motif: 'Dark-comic',     before: 0.34, after: 0.39 },
]

// === Brand tokens ===
export { HP, HP_GRAD } from '@/shared/lib/tokens'
export { FILM_PALETTE, PARASITE_TIMELINE_SAMPLE, PARASITE_DNA_DELTA_SAMPLE }
