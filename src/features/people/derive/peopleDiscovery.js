// src/features/people/derive/peopleDiscovery.js
// PURE People discovery derivation (no React, no Supabase). Turns the caller's similarity pairs +
// the consent-gated opt-in taste projection + the least-data identity projection into the Strongest /
// More / Suggested rails.
//
// Consent rule (the P0 fix): a similarity or FOF candidate may appear ONLY when its id is in the
// opt-in taste projection (get_discoverable_taste_profiles) — i.e. present in `discoverableTasteIds`.
// The projection is the single authoritative opt-in membership; identity (name/avatar) alone never
// makes someone discoverable. There is NO client-side cross-user user_settings read.
//
// Presentation honesty lives in peoplePresentation.js (qualitative bands, evidence floor). Bios use
// ONLY the candidate's consent-exposed `total` watched count — never movies_in_common. No generated
// handles are produced (no real username contract exists). Follow state is NOT baked onto cards; the
// render layer derives it from the single `followingIds` authority.

import { deriveTasteMatchPresentation } from './peoplePresentation'

const AVATAR_PALETTE = ['#c7a8d6', '#8dbbd1', '#c5b985', '#9eb798', '#c99e90', '#aaa0c9', '#8bb7aa', '#cf9caf']

export function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''
}
export function initialOf(name) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?'
}
export function avatarBg(id) {
  if (!id) return AVATAR_PALETTE[0]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

// Bio from the candidate's OWN consent-exposed taste fingerprint. The count is the candidate's
// projected total watched (fingerprint.total) — NEVER movies_in_common (which is shared-film
// evidence, shown separately). Omitted entirely when no real total is available.
export function deriveBio({ fingerprint } = {}) {
  const topMood = fingerprint?.topMoodTags?.[0]?.key
  const topTone = fingerprint?.topToneTags?.[0]?.key
  const topFit = fingerprint?.topFitProfiles?.[0]?.key
  const total = Number.isFinite(fingerprint?.total) && fingerprint.total > 0 ? fingerprint.total : null
  if (topMood && topTone) return `${capitalize(topMood)} + ${capitalize(topTone)} films${total ? ` · ${total} watched` : ''}`
  if (topMood) return `${capitalize(topMood)}-driven${total ? ` · ${total} films` : ''}`
  if (topFit) return `${capitalize(topFit)} energy${total ? ` · ${total} films` : ''}`
  if (total) return `Building taste · ${total} film${total === 1 ? '' : 's'} logged`
  return 'Just getting started'
}

// Deterministic candidate ordering: raw similarity desc → films-in-common desc → user-id asc.
export function compareCandidates(a, b) {
  return (b.match - a.match) || ((b.inCommon || 0) - (a.inCommon || 0)) || String(a.id).localeCompare(String(b.id))
}

// Normalize both stored similarity directions to {id (counterpart), match (0-100), inCommon},
// dedupe by counterpart (keep the highest similarity), drop self, sort deterministically.
export function mergeSimilarity({ simAsA = [], simAsB = [], selfId } = {}) {
  const byId = new Map()
  const add = (counterpartId, sim, inCommon) => {
    if (!counterpartId || counterpartId === selfId) return
    const match = Math.max(0, Math.min(100, Math.round((sim ?? 0) * 100)))
    const ic = Number.isFinite(inCommon) ? inCommon : null
    const prev = byId.get(counterpartId)
    if (!prev || match > prev.match) byId.set(counterpartId, { id: counterpartId, match, inCommon: ic })
  }
  for (const r of simAsA) add(r.user_b_id, r.overall_similarity, r.movies_in_common)
  for (const r of simAsB) add(r.user_a_id, r.overall_similarity, r.movies_in_common)
  return [...byId.values()].sort(compareCandidates)
}

function buildCandidate(row, { usersById, fingerprintByUser }) {
  const u = usersById.get(row.id)
  if (!u) return null
  const fingerprint = fingerprintByUser.get(row.id)
  return {
    id: row.id,
    name: u.name || 'Anonymous',
    avatarUrl: u.avatar_url || null,
    initial: initialOf(u.name),
    avatarBg: avatarBg(row.id),
    match: row.match,
    inCommon: row.inCommon,
    total: fingerprint?.total ?? null,
    matchPresentation: deriveTasteMatchPresentation({ matchPct: row.match, moviesInCommon: row.inCommon, total: fingerprint?.total ?? null }),
    bio: deriveBio({ fingerprint }),
    viaFriend: null,
  }
}

// Strongest = qualified candidates (≤4). More = the rest, qualified first then forming/insufficient,
// each in rank order. Consent gate: keep only ids present in BOTH the opt-in projection
// (discoverableTasteIds) and the identity projection (usersById).
export function deriveDiscovery({ mergedSimilarity = [], discoverableTasteIds, usersById, fingerprintByUser, strongMax = 4, moreMax = 9 } = {}) {
  const optedIn = mergedSimilarity.filter((r) => discoverableTasteIds.has(r.id) && usersById.has(r.id))
  const cards = optedIn.map((r) => buildCandidate(r, { usersById, fingerprintByUser })).filter(Boolean)
  const qualified = cards.filter((c) => c.matchPresentation.qualified)
  const unqualified = cards.filter((c) => !c.matchPresentation.qualified)
  const strongest = qualified.slice(0, strongMax)
  const strongestIds = new Set(strongest.map((c) => c.id))
  const more = [...qualified.filter((c) => !strongestIds.has(c.id)), ...unqualified].slice(0, moreMax)
  const shownIds = new Set([...strongest, ...more].map((c) => c.id))
  return { strongest, more, shownIds }
}

// Suggested = friend-of-follows ONLY, and ONLY when consent-projection-eligible. Every returned card
// has a genuine `viaFriend`. Excludes self, already-following, and anyone already shown in
// Strongest/More. Tally by recommending-friend count; cap at 6.
export function deriveSuggestedFOF({ fofRows = [], followingIds, selfId, usersById, fingerprintByUser, discoverableTasteIds, shownIds, viaNames, max = 6 } = {}) {
  const tally = new Map() // candidateId → { friends, viaName }
  for (const row of fofRows) {
    const cid = row.suggested_user_id
    const viaId = row.via_user_id
    if (!cid || cid === selfId) continue
    if (followingIds.has(cid)) continue
    if (shownIds.has(cid)) continue
    if (!discoverableTasteIds.has(cid)) continue // opt-in required
    if (!usersById.has(cid)) continue            // identity required
    const viaName = viaNames.get(viaId) || null
    if (!viaName) continue                        // never fabricate "via"
    const entry = tally.get(cid) || { friends: 0, viaName }
    entry.friends += 1
    if (!entry.viaName) entry.viaName = viaName
    tally.set(cid, entry)
  }
  return [...tally.entries()]
    .sort((a, b) => (b[1].friends - a[1].friends) || String(a[0]).localeCompare(String(b[0])))
    .slice(0, max)
    .map(([cid, info]) => {
      const u = usersById.get(cid)
      const fingerprint = fingerprintByUser.get(cid)
      return {
        id: cid,
        name: u.name || 'Anonymous',
        avatarUrl: u.avatar_url || null,
        initial: initialOf(u.name),
        avatarBg: avatarBg(cid),
        bio: deriveBio({ fingerprint }),
        viaFriend: info.viaName,
      }
    })
}
