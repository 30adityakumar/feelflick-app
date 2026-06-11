import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import peopleSource from '../usePeopleData.jsx?raw'
import peopleJsxSource from '../People.jsx?raw'
import * as peopleData from '../data.js'
import peopleDataSource from '../data.js?raw'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// people.css read from disk — vitest returns '' for `*.css?raw`, so read the file directly (the same
// pattern DiscoverResolve.test.jsx uses for discover.css).
const peopleCssSource = readFileSync(resolve(import.meta.dirname, '../people.css'), 'utf8')

// F7.9 — People taste-match must read the cross-user fingerprint through the narrow authenticated
// RPC (get_discoverable_taste_profiles), never the now browser-inaccessible projection views. The
// RPC's behavioral contract (authenticated-only, opt-in gating, least-data, opted-out absence,
// own-row inclusion) is proven against the live database by scripts/verify-taste-projection-privacy.sql
// + the post-deploy role checks — the correct layer for a SQL function. Here we prove the JS
// data-access migration + honest degradation.

let rpcResult
const rpcSpy = vi.fn(() => Promise.resolve(rpcResult))
function chain() {
  const c = {}
  for (const m of ['select', 'in', 'eq', 'neq', 'order', 'limit', 'gte', 'lte', 'not', 'or', 'contains', 'is']) c[m] = () => c
  c.maybeSingle = () => Promise.resolve({ data: null, error: null })
  c.single = () => Promise.resolve({ data: null, error: null })
  c.then = (res, rej) => Promise.resolve({ data: [], error: null }).then(res, rej)
  c.catch = (fn) => Promise.resolve({ data: [], error: null }).catch(fn)
  return c
}
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: () => chain(), rpc: (...a) => rpcSpy(...a) },
}))
// Stable references — a fresh object each render would re-fire the load effect (deps include
// `session`) and loop forever.
const AUTH_USER = { id: 'me' }
const AUTH_SESSION = { user: { id: 'me', email: 'me@example.co' } }
vi.mock('@/shared/hooks/useAuthSession', () => ({
  useAuthSession: () => ({ user: AUTH_USER, session: AUTH_SESSION }),
}))

import { PeopleDataProvider, usePeopleData } from '../usePeopleData'

function Consumer({ onState }) { onState(usePeopleData()); return null }
const renderPeople = (onState) => render(<PeopleDataProvider><Consumer onState={onState} /></PeopleDataProvider>)

beforeEach(() => { rpcSpy.mockClear(); rpcResult = { data: [], error: null } })

describe('F7.9 — People reads the safe RPC, never the projection views', () => {
  it('source uses the RPC and never queries either projection view directly', () => {
    const src = peopleSource
    expect(src).toContain("rpc('get_discoverable_taste_profiles')")
    expect(src).not.toMatch(/\.from\(\s*['"]user_fingerprint_public['"]\s*\)/)
    expect(src).not.toMatch(/\.from\(\s*['"]user_similarity_discoverable['"]\s*\)/)
  })

  it('calls get_discoverable_taste_profiles and settles honestly (no error) with adaptable rows', async () => {
    // an opted-in row in RPC column shape — the provider normalizes top_mood_tags → topMoodTags etc.
    rpcResult = { data: [{ user_id: 'me', top_mood_tags: [{ key: 'tender' }], top_tone_tags: [], top_fit_profiles: [], total: 9 }], error: null }
    let last
    renderPeople(s => { last = s })
    await waitFor(() => expect(last.loading).toBe(false))
    expect(rpcSpy).toHaveBeenCalledWith('get_discoverable_taste_profiles')
    expect(last.error).toBeFalsy()
    expect(Array.isArray(last.twins)).toBe(true)
  })

  it('an RPC failure degrades honestly — no crash, empty rails, no raw error as data', async () => {
    rpcResult = { data: null, error: { message: 'permission denied' } }
    let last
    renderPeople(s => { last = s })
    await waitFor(() => expect(last.loading).toBe(false))
    expect(rpcSpy).toHaveBeenCalledWith('get_discoverable_taste_profiles')
    expect(Array.isArray(last.twins)).toBe(true)
    expect(Array.isArray(last.suggested)).toBe(true)
  })
})

describe('F8.2 — People resolves cross-user identity via narrow RPCs, never a direct users read', () => {
  it('uses the identity, search and follow-suggestion RPCs', () => {
    expect(peopleSource).toContain("rpc('get_people_public_identities'")
    expect(peopleSource).toContain("rpc('get_follow_suggestions')")
    expect(peopleJsxSource).toContain("rpc('search_people_by_name'")
  })

  it('makes ZERO direct public.users reads (no cross-user identity table access)', () => {
    expect(peopleSource).not.toMatch(/\.from\(\s*['"]users['"]\s*\)/)
    expect(peopleJsxSource).not.toMatch(/\.from\(\s*['"]users['"]\s*\)/)
  })

  it('never SELECTs email or last_active_at from any table (identity comes from the id/name/avatar RPC)', () => {
    for (const src of [peopleSource, peopleJsxSource]) {
      expect(src).not.toMatch(/\.select\([^)]*email/i)
      expect(src).not.toMatch(/\.select\([^)]*last_active/i)
    }
  })

  it('reads its own follows/followers but NOT the global follow graph (FOF goes through the RPC)', () => {
    // own-edge reads stay; the only cross-user .in('follower_id', …) graph read is gone (→ RPC)
    expect(peopleSource).not.toMatch(/from\(\s*['"]user_follows['"]\s*\)[\s\S]{0,120}\.in\(\s*['"]follower_id['"]/)
  })
})

describe('F8.3 — taste-match trust + de-precision (no friendship, no exact %)', () => {
  it('renders no exact taste-match percentage (qualitative bands only)', () => {
    // the prominent "{p.match}%" / "% match" presentation is gone from the rendered UI
    expect(peopleJsxSource).not.toMatch(/\{p\.match\}\s*<span[^>]*>%/)   // big "82%" number block
    expect(peopleJsxSource).not.toMatch(/\{p\.match\}%\s*match/)         // "82% match" caption
    expect(peopleJsxSource).not.toMatch(/\}% match</)
  })

  it('uses the pure presentation module for the match band/evidence', () => {
    expect(peopleSource).toContain('deriveTasteMatchPresentation')
    expect(peopleSource).toContain('matchPresentation')
    expect(peopleJsxSource).toContain('matchPresentation')
  })

  it('no production copy calls algorithmic matches or one-way follows "friends" or claims they "predict you"', () => {
    // strip the legitimate real-world invite copy ("Invite a friend" / "A friend thinks you'd like…")
    const copy = peopleJsxSource
      .replace(/Invite a friend to FeelFlick/g, '')
      .replace(/'A friend'/g, '')
    expect(copy).not.toMatch(/[Ff]riends? whose/)         // "Friends whose ratings predict yours"
    expect(copy).not.toMatch(/predict[s]? you/i)          // "predicts you"
    expect(copy).not.toMatch(/your\s+circle/i)            // "your circle watched/loves"
    expect(copy).not.toMatch(/your\s+taste twins?\b/i)    // hero "Your taste twins"
  })

  it('the only relationship label is the one-way follow (Follow / Following), never friend', () => {
    // F8.4: the follow control's accessible name is "Follow|Unfollow {name}" — never "friend"
    expect(peopleJsxSource).toMatch(/following \? 'Unfollow' : 'Follow'/)
    expect(peopleJsxSource).toMatch(/following \? 'Following' : 'Follow'/) // visible label
  })

  it('MatchBar is decorative (aria-hidden) and only shown when the match is evidence-qualified', () => {
    expect(peopleJsxSource).toMatch(/qualified &&[\s\S]{0,80}aria-hidden="true"[\s\S]{0,40}MatchBar/)
  })
})

describe('F8.4 — settled follow, button semantics, live region, Hide suggestion', () => {
  it('no optimistic relationship swap: the provider has no toggleFollow / pre-write state flip', () => {
    expect(peopleSource).not.toContain('toggleFollow')
    expect(peopleSource).not.toMatch(/Optimistic UI swap/)
    expect(peopleSource).toContain('applyFollowState')          // state flips only after settled success
    expect(peopleSource).toContain('usePeopleFollowActions')
  })

  it('the follow control exposes aria-pressed, aria-busy, disabled-while-pending, a named label and a 44px target', () => {
    expect(peopleJsxSource).toMatch(/aria-pressed=\{following\}/)
    expect(peopleJsxSource).toMatch(/aria-busy=\{pending\}/)
    expect(peopleJsxSource).toMatch(/disabled=\{pending\}/)
    expect(peopleJsxSource).toMatch(/aria-label=\{`\$\{following \? 'Unfollow' : 'Follow'\} \$\{name/)
    expect(peopleJsxSource).toMatch(/minHeight: 44/)
    // settled, text-based feedback (no spinner-only): Following… / Unfollowing… / Try again
    expect(peopleJsxSource).toMatch(/Following…|Unfollowing…/)
    expect(peopleJsxSource).toContain("'Try again'")
  })

  it('exactly one persistent People status live region (role=status, polite, atomic) bound to relStatus', () => {
    const regions = peopleJsxSource.match(/role="status"/g) || []
    expect(regions).toHaveLength(1)
    expect(peopleJsxSource).toMatch(/role="status"[\s\S]{0,80}aria-live="polite"[\s\S]{0,40}aria-atomic="true"/)
    expect(peopleJsxSource).toMatch(/>\{relStatus\}</)
  })

  it('Hide suggestion is a named, 44px control shown only on non-followed discovery cards, with focus recovery', () => {
    expect(peopleJsxSource).toMatch(/aria-label=\{`Hide \$\{name/)
    expect(peopleJsxSource).toMatch(/!p\.following && <HideBtn/)        // gated on NOT following
    expect(peopleJsxSource).toContain('nextFocusId')                   // focus-after-removal
    expect(peopleJsxSource).toContain('scheduleFocus')
    expect(peopleJsxSource).toMatch(/className="ff-people-hidebtn"[\s\S]{0,120}minHeight: 44/)
  })
})

describe('F8.5 — dead social surfaces removed', () => {
  it('the provider makes NO cross-user behavioral reads (no user_history / user_ratings / reviews)', () => {
    expect(peopleSource).not.toMatch(/\.from\(\s*['"]user_history['"]\s*\)/)
    expect(peopleSource).not.toMatch(/\.from\(\s*['"]user_ratings['"]\s*\)/)
    expect(peopleSource).not.toMatch(/\.from\(\s*['"]reviews['"]\s*\)/)
    expect(peopleSource).not.toMatch(/user_history\(\s*count\s*\)/)   // no embedded cross-user count
  })

  it('the dead RLS-dead derivations are gone (Activity / CrewOverlap / Popular / twin-meta)', () => {
    for (const dead of ['deriveActivity', 'deriveCrewOverlap', 'derivePopular', 'buildTwinMeta']) {
      expect(peopleSource).not.toContain(dead)
    }
    expect(peopleJsxSource).not.toMatch(/<Activity\b/)
    expect(peopleJsxSource).not.toMatch(/<CrewOverlap\b/)
  })

  it('no rendered copy promises recent cross-user watched activity or claims unmeasured popularity', () => {
    expect(peopleJsxSource).not.toMatch(/Popular on FeelFlick/)
    expect(peopleJsxSource).not.toMatch(/most-watched/)
    expect(peopleJsxSource).not.toMatch(/circle (watched|loves)/i)
    expect(peopleJsxSource).not.toMatch(/just (rated|watched|added)/i)
  })

  it('no People card links to a private cross-user profile (/profile/:id) or self-references /people', () => {
    expect(peopleJsxSource).not.toMatch(/navigate\(\s*['"]\/profile/)
    expect(peopleJsxSource).not.toMatch(/navigate\(\s*['"]\/people['"]\s*\)/)
    expect(peopleJsxSource).not.toMatch(/View \$\{[^}]*\}'s profile/)   // dead "View {name}'s profile"
  })

  it('the retained similarity rails still rank by the SAME slices (order unchanged)', () => {
    expect(peopleSource).toMatch(/deriveSimilarityCards\([^)]*0, 4\)/)   // twins = ranks 1-4
    expect(peopleSource).toMatch(/deriveSimilarityCards\([^)]*4, 7\)/)   // rising = ranks 5-7
    expect(peopleSource).toContain('deriveSuggested')
  })

  it('data.js no longer exports fabricated people/activity mocks (only real design tokens remain)', () => {
    for (const dead of ['USER', 'TWINS', 'RISING', 'ACTIVITY', 'CREW_OVERLAP', 'SUGGESTED']) {
      expect(peopleData[dead]).toBeUndefined()
    }
    expect(Object.keys(peopleData).sort()).toEqual(['HP', 'HP_GRAD'])
    // no fabricated names / reviews left behind as accidental future source material
    for (const fake of ['Marco Reyes', 'Priya Shah', 'Park Chan-wook', 'airport scene', 'Refn-coded']) {
      expect(peopleDataSource).not.toContain(fake)
    }
  })
})

describe('F8.7 — accessibility, contrast, touch targets, responsive', () => {
  it('exactly one h1, and each rail section is a heading-labelled region', () => {
    const h1s = peopleJsxSource.match(/<h1\b/g) || []
    expect(h1s).toHaveLength(1)
    for (const id of ['ff-people-twins-h', 'ff-people-rising-h', 'ff-people-suggested-h', 'ff-people-search-h']) {
      expect(peopleJsxSource).toContain(`aria-labelledby="${id}"`)
      expect(peopleJsxSource).toContain(`id="${id}"`)
    }
  })

  it('load-bearing muted card labels use the hardened INK token, not the failing HP.textMuted', () => {
    // INK ≈ 7.3:1 on #06060a; HP.textMuted (0.45) ≈ 4.1:1 fails AA for small text.
    expect(peopleJsxSource).toMatch(/const INK = 'rgba\(250,250,250,0\.62\)'/)
    expect(peopleJsxSource).not.toMatch(/color: HP\.textMuted/) // no weak muted token applied to labels
    expect(peopleJsxSource).toMatch(/color: INK/)              // INK actually applied
  })

  it('every actionable People control meets the 44px touch-target floor', () => {
    // FollowBtn + HideBtn (F8.4) already asserted elsewhere; here: search input, invite, clear.
    expect(peopleJsxSource).toMatch(/className="ff-people-search-input"[\s\S]{0,200}minHeight: 44/)
    expect(peopleJsxSource).toMatch(/className="ff-people-invite-btn"[\s\S]{0,160}minHeight: 44/)
    expect(peopleJsxSource).toMatch(/className="ff-people-clear-btn"[\s\S]{0,200}minHeight: 44/)
  })

  it('search + clear controls have accessible names and visible focus rings', () => {
    expect(peopleJsxSource).toMatch(/aria-label="Search for users by name"/)
    expect(peopleJsxSource).toMatch(/aria-label="Clear search results"/)
    // the input no longer hard-disables its outline inline; CSS supplies a branded focus-visible ring
    expect(peopleJsxSource).not.toMatch(/className="ff-people-search-input"[\s\S]{0,200}outline: 'none'/)
    expect(peopleCssSource).toMatch(/\.ff-people-search-input:focus-visible/)
    expect(peopleCssSource).toMatch(/\.ff-people-invite-btn:focus-visible/)
    expect(peopleCssSource).toMatch(/\.ff-people-clear-btn:focus-visible/)
  })

  it('loading state is announced via aria-busy (without adding a second live region)', () => {
    expect(peopleJsxSource).toMatch(/aria-busy="true" aria-label="Loading people"/)
    expect((peopleJsxSource.match(/role="status"/g) || []).length).toBe(1) // still exactly one
  })

  it('responsive CSS stacks the rails at phone widths and the dead-section rules are gone', () => {
    expect(peopleCssSource).toMatch(/@media \(max-width: 720px\)/)
    expect(peopleCssSource).toMatch(/\.ff-people-grid-4 \{[\s\S]{0,80}grid-template-columns: 1fr/)
    expect(peopleCssSource).toMatch(/\.ff-people-search-form \{[\s\S]{0,80}flex-direction: column/)
    // F8.5 removed Activity + CrewOverlap → their responsive rules must not linger
    expect(peopleCssSource).not.toContain('ff-people-activity-row')
    expect(peopleCssSource).not.toContain('ff-people-crew-grid')
  })

  it('reduced motion: People introduces no keyframes/JS animation (relies on the global reset)', () => {
    expect(peopleCssSource).not.toMatch(/@keyframes/)
    expect(peopleJsxSource).not.toMatch(/framer-motion|requestAnimationFrame\(/)
    // the only motion is the global-reset-covered button hover transition + Tailwind animate-pulse
    expect(peopleCssSource).toMatch(/prefers-reduced-motion/)
  })
})

describe('F8.8-prep — similarity-card identity resolves via the RPC, not the RLS-null embedded join', () => {
  it('the similarity query no longer embeds the owner-only users() FK join', () => {
    expect(peopleSource).not.toMatch(/users!user_similarity_user_[ab]_fkey/)
  })

  it('the merge keeps rows by user_b_id (not by the embedded join) — the rail is no longer always empty', () => {
    expect(peopleSource).not.toMatch(/\.filter\(r => r\.users\)/)            // the old drop-everything gate is gone
    expect(peopleSource).toMatch(/\.filter\(r => r\.user_b_id && r\.user_b_id !== userId\)/)
  })

  it('card shapers resolve identity from usersById (the get_people_public_identities RPC)', () => {
    expect(peopleSource).toMatch(/const u = usersById\.get\(row\.user_b_id\)/)
    expect(peopleSource).not.toMatch(/const u = row\.users/)                 // no embedded-join identity remains
    expect(peopleSource).toMatch(/deriveTwins\(similarityRows, followingIds, usersById, fingerprintByUser\)/)
  })
})
