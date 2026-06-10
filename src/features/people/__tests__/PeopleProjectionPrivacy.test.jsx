import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import peopleSource from '../usePeopleData.jsx?raw'
import peopleJsxSource from '../People.jsx?raw'

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
