// src/features/preferences/derive/preferenceValidation.js
// Pure client-side validation mirroring the RPC contract. The RPC is the
// authority; this gives fast, friendly local guarantees and prevents most
// PT400s from ever reaching the server.

import {
  MOOD_IDS, BOUNDARY_IDS, LANGUAGES, SUBTITLE_MODES, SPOILER_TIERS,
  RUNTIME_MIN, RUNTIME_MAX, RUNTIME_GAP, MAX_GENRES, MAX_DIRECTORS, MAX_DIRECTOR_LEN, MAX_LANGUAGES,
} from '../data'

const norm = (s) => (s || '').trim().toLowerCase()

export function clampRuntimeFloor(floor, cap) {
  let f = Math.round(Number(floor))
  if (!Number.isFinite(f)) f = RUNTIME_MIN
  f = Math.max(RUNTIME_MIN, Math.min(f, RUNTIME_MAX))
  // Keep at least RUNTIME_GAP below the cap.
  return Math.min(f, cap - RUNTIME_GAP)
}
export function clampRuntimeCap(cap, floor) {
  let c = Math.round(Number(cap))
  if (!Number.isFinite(c)) c = RUNTIME_MAX
  c = Math.max(RUNTIME_MIN, Math.min(c, RUNTIME_MAX))
  return Math.max(c, floor + RUNTIME_GAP)
}

// Returns { ok: true } or { ok: false, reason } — reason is for tests/logging,
// never shown raw to the user.
export function validateDraft(draft) {
  if (!draft || typeof draft !== 'object') return { ok: false, reason: 'no draft' }

  const drawn = draft.drawnGenreIds || []
  const avoid = draft.avoidGenreIds || []
  if (drawn.length > MAX_GENRES || avoid.length > MAX_GENRES) return { ok: false, reason: 'too many genres' }
  if (new Set(drawn).size !== drawn.length) return { ok: false, reason: 'duplicate drawn genres' }
  if (new Set(avoid).size !== avoid.length) return { ok: false, reason: 'duplicate avoid genres' }
  if (drawn.some((id) => avoid.includes(id))) return { ok: false, reason: 'genre overlap' }
  if (drawn.some((id) => !Number.isInteger(id) || id <= 0)) return { ok: false, reason: 'bad genre id' }

  const mw = draft.moodWeights || {}
  for (const [k, v] of Object.entries(mw)) {
    if (!MOOD_IDS.includes(k)) return { ok: false, reason: `bad mood ${k}` }
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) return { ok: false, reason: 'bad mood value' }
  }

  const trusted = draft.trustedDirectors || []
  const muted = draft.mutedDirectors || []
  if (trusted.length > MAX_DIRECTORS || muted.length > MAX_DIRECTORS) return { ok: false, reason: 'too many directors' }
  for (const d of [...trusted, ...muted]) {
    if (typeof d !== 'string' || d.trim().length === 0 || d.length > MAX_DIRECTOR_LEN) return { ok: false, reason: 'bad director' }
  }
  const tset = new Set(trusted.map(norm))
  if (muted.some((d) => tset.has(norm(d)))) return { ok: false, reason: 'director overlap' }

  const f = draft.runtimeFloor, c = draft.runtimeCap
  if (!Number.isFinite(f) || !Number.isFinite(c)) return { ok: false, reason: 'bad runtime' }
  if (f < RUNTIME_MIN || c > RUNTIME_MAX || c < f + RUNTIME_GAP) return { ok: false, reason: 'runtime bounds' }

  const b = draft.boundaries || {}
  for (const [k, v] of Object.entries(b)) {
    if (!BOUNDARY_IDS.includes(k)) return { ok: false, reason: `bad boundary ${k}` }
    if (typeof v !== 'boolean') return { ok: false, reason: 'bad boundary value' }
  }

  if (!SUBTITLE_MODES.some((s) => s.v === draft.subtitles)) return { ok: false, reason: 'bad subtitles' }
  if (!SPOILER_TIERS.some((s) => s.v === draft.spoilerTier)) return { ok: false, reason: 'bad spoiler' }

  const langs = draft.languages || []
  if (langs.length > MAX_LANGUAGES) return { ok: false, reason: 'too many languages' }
  if (langs.some((l) => !LANGUAGES.includes(l))) return { ok: false, reason: 'bad language' }

  return { ok: true }
}
