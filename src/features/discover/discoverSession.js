// src/features/discover/discoverSession.js
// Pure, deterministic Discover finite-session state machine. Owns the THREE
// semantic roles (closest / gentler / bolder), the currently FOCUSED film, the
// bounded set of films exposed this session, and the honest exhaustion reason.
//
// Two ideas are kept strictly separate (per the locked spec):
//   • ROLE  — the semantic slot a film occupies (closest/gentler/bolder). Roles
//             are recomputed ONLY when the visible set genuinely changes (skip,
//             watched, reserve refill, or new inputs) — never on focus change.
//   • FOCUS — which exposed film sits on the cinematic stage right now. Switching
//             focus changes neither roles nor the exposed set, and logs no new
//             impression.
//
// Exposure is bounded: at most MAX_SESSION_FILMS unique films are exposed per
// session. We distinguish two terminations:
//   • 'pool' — no remaining candidate clears the semantic/fit thresholds.
//   • 'cap'  — the bounded decision set is full although more candidates exist.
// Queue depth is never surfaced.

import { buildDiscoverDirections, pickAlternate, DIRECTION_PLACEMENT } from './discoverDirections'

// Bounded decision set: max unique films exposed in one Discover session. Tunable
// in one place; never exposed to the user. (lead + 2 directions + up to 4 reserves)
export const MAX_SESSION_FILMS = 7

const ROLE_ORDER = ['closest', 'gentler', 'bolder']

const visibleFilms = (roles) => ROLE_ORDER.map((r) => roles[r]).filter(Boolean)
const visibleIds = (roles) => new Set(visibleFilms(roles).map((f) => f.id))

function placementFor(role, { promoted = false } = {}) {
  if (role === 'closest') return promoted ? DIRECTION_PLACEMENT.promoted : DIRECTION_PLACEMENT.closest
  return DIRECTION_PLACEMENT[role]
}

// Annotate each role film with its semantic role + impression placement so role
// and placement travel with the film (correct attribution downstream).
function annotate(roles, { promotedClosest = false } = {}) {
  const out = {}
  for (const role of ROLE_ORDER) {
    const f = roles[role]
    out[role] = f
      ? { ...f, _direction: role, _placement: placementFor(role, { promoted: role === 'closest' && promotedClosest }) }
      : null
  }
  return out
}

// Admit candidate roles under the unique-film cap. The closest is essential; a
// role whose film is NOT already exposed may only be admitted while capacity
// remains. Returns the admitted roles, the grown exposed set, and whether the
// closest itself had to be dropped for cap (→ 'cap' exhaustion upstream).
function admitWithCap(candidateRoles, exposedIds) {
  const next = new Set(exposedIds)
  const out = { closest: null, gentler: null, bolder: null }
  let closestDroppedForCap = false
  for (const role of ROLE_ORDER) {
    const f = candidateRoles[role]
    if (!f) continue
    if (next.has(f.id)) { out[role] = f; continue }
    if (next.size < MAX_SESSION_FILMS) { out[role] = f; next.add(f.id) }
    else if (role === 'closest') closestDroppedForCap = true
    // a new alternate at the cap is simply omitted (render fewer)
  }
  return { roles: out, exposedIds: next, closestDroppedForCap }
}

const emptyState = (exhaustion) => ({
  roles: { closest: null, gentler: null, bolder: null },
  focusId: null, dismissedIds: new Set(), exposedIds: new Set(), exhaustion,
})

/**
 * Begin a session over a canonical ranked pool.
 * @param {{ranked, selected, profile, allowAlternates}} ctx
 */
export function initSession(ctx = {}) {
  const { ranked = [], selected = [], profile = null, allowAlternates = true } = ctx
  const built = buildDiscoverDirections(ranked, { selected, profile, allowAlternates })
  if (!built.closest) return emptyState('pool')
  const annotated = annotate({ closest: built.closest, gentler: built.gentler, bolder: built.bolder })
  const { roles, exposedIds } = admitWithCap(annotated, new Set())
  return { roles, focusId: roles.closest?.id ?? null, dismissedIds: new Set(), exposedIds, exhaustion: null }
}

/**
 * Reject (Not tonight) or mark watched the given film. Recomputes roles per the
 * removed role's contract; a dismissed film never returns this session.
 */
export function dismiss(state, filmId, ctx = {}) {
  const { ranked = [], selected = [], profile = null, allowAlternates = true } = ctx
  const removedRole = roleOf(state, filmId)
  const dismissedIds = new Set(state.dismissedIds); dismissedIds.add(filmId)
  const available = (ranked || []).filter((f) => f && !dismissedIds.has(f.id))

  // ── Closest removed → promote the strongest remaining qualified candidate and
  //    recompute Gentler/Bolder relative to the NEW lead. ──────────────────────
  if (removedRole === 'closest' || removedRole == null) {
    const built = buildDiscoverDirections(available, { selected, profile, allowAlternates })
    if (!built.closest) return { ...emptyState('pool'), dismissedIds, exposedIds: state.exposedIds }
    // A new closest that is a brand-new film consumes a cap slot; if the set is
    // already full this is a 'cap' stop, not a 'pool' stop (more films exist).
    if (!state.exposedIds.has(built.closest.id) && state.exposedIds.size >= MAX_SESSION_FILMS) {
      return { ...emptyState('cap'), dismissedIds, exposedIds: state.exposedIds }
    }
    const promoted = !state.exposedIds.has(built.closest.id) || roleOf(state, built.closest.id) !== 'closest'
    const annotated = annotate({ closest: built.closest, gentler: built.gentler, bolder: built.bolder }, { promotedClosest: promoted })
    const { roles, exposedIds } = admitWithCap(annotated, state.exposedIds)
    return { roles, focusId: roles.closest?.id ?? null, dismissedIds, exposedIds, exhaustion: null }
  }

  // ── Alternate removed → keep the closest, refill ONLY the vacated role from the
  //    unseen qualified pool. Do not promote an unrelated alternate to closest. ──
  const lead = state.roles.closest
  const kept = { closest: lead, gentler: state.roles.gentler, bolder: state.roles.bolder }
  kept[removedRole] = null
  const excludeIds = new Set([lead?.id, kept.gentler?.id, kept.bolder?.id, ...dismissedIds].filter(Boolean))
  const filled = (allowAlternates && lead) ? pickAlternate(removedRole, available, { lead, selected, profile, excludeIds }) : null
  const annotated = annotate({ ...kept, [removedRole]: filled })
  const { roles, exposedIds } = admitWithCap(annotated, state.exposedIds)
  // Focus returns to the closest (or any surviving visible film).
  const survivingFocus = roles.closest?.id ?? roles.gentler?.id ?? roles.bolder?.id ?? null
  return { roles, focusId: survivingFocus, dismissedIds, exposedIds, exhaustion: null }
}

/** Change focus only — no role change, no exposure, no impression. */
export function setFocus(state, filmId) {
  if (!visibleIds(state.roles).has(filmId)) return state
  if (state.focusId === filmId) return state
  return { ...state, focusId: filmId }
}

export function focusedFilm(state) {
  return visibleFilms(state.roles).find((f) => f.id === state.focusId) || state.roles.closest || null
}
export function roleOf(state, filmId) {
  return ROLE_ORDER.find((r) => state.roles[r]?.id === filmId) || null
}
export { visibleFilms }
