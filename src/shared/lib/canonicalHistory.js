// src/shared/lib/canonicalHistory.js
// One canonical row per film, shared by every taste computation.
//
// user_history is an append-only event log: the DB's only uniqueness is
// (user_id, movie_id, watched_at), and different watch paths (onboarding, Discover,
// Home, Film File) stamp fresh watched_at values, so the same film can have 2–3 rows.
// Any surface that counts taste evidence — the Diary, the Profile / Cinematic DNA
// metrics, the taste fingerprint, the generated-summary input — must collapse those
// rows to ONE per film FIRST, or duplicate watches inflate the result.
//
// This is the neutral home for that rule (introduced for the Diary in F6.10, lifted out
// of the history feature in F7.3 so Profile + fingerprinting don't depend on a Diary
// module). The rule is intentionally identical to F6.10:
//
//   1. one canonical row per valid movie_id
//   2. exclude rows without a valid movie_id
//   3. exclude rows without a valid watched_at (the Diary "watched" rule)
//   4. keep the row with the most-recent valid watched_at
//   5. on a tie, keep the EARLIER original-array row (stable, deterministic)
//   6. preserve the complete selected row (fields verbatim)
//   7. never merge fields from older rows
//   8. never mutate the input
//   9. never create a rewatch count or synthetic field
//  10. never touch the database
//
// CONTRACT: the product shows one entry per film; multiple history rows are collapsed to
// the latest watch until an explicit rewatch product model exists (this is NOT a rewatch).
export function dedupeHistoryByMovie(history = []) {
  const byMovie = new Map()
  for (let i = 0; i < history.length; i++) {
    const row = history[i]
    if (!row || row.movie_id == null) continue                 // rule 1/2: need a movie_id
    const t = row.watched_at ? new Date(row.watched_at).getTime() : NaN
    if (!Number.isFinite(t)) continue                          // rule 3: need a valid watched_at
    const existing = byMovie.get(row.movie_id)
    // rule 4/5: keep the most-recent watched_at; replace only when STRICTLY newer, so a tie
    // keeps the earlier original-array row → stable + deterministic.
    if (!existing || t > existing.t) byMovie.set(row.movie_id, { row, t })
  }
  return [...byMovie.values()].map(v => v.row)                 // rules 6/7/8: new array, original row refs
}
