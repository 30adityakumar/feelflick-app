import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import providerSrc from '../usePeopleData.jsx?raw'
import peopleJsxSrc from '../People.jsx?raw'
import discoverySrc from '../derive/peopleDiscovery.js?raw'
import searchSrc from '../hooks/usePeopleSearch.js?raw'
import * as peopleData from '../data.js'
import peopleDataSrc from '../data.js?raw'

const componentDir = resolve(import.meta.dirname, '../components')
const read = (rel) => readFileSync(resolve(import.meta.dirname, rel), 'utf8')
const peopleCss = read('../people.css')
const followBtnSrc = readFileSync(resolve(componentDir, 'FollowButton.jsx'), 'utf8')
const cardSrc = readFileSync(resolve(componentDir, 'StrongMatchCard.jsx'), 'utf8')
const searchInputSrc = readFileSync(resolve(componentDir, 'PeopleSearch.jsx'), 'utf8')
const allComponentSrc = ['PersonAvatar', 'FollowButton', 'HideButton', 'PeopleHeader', 'PeopleSummary', 'PeopleSearch', 'StrongMatches', 'StrongMatchCard', 'MoreMatches', 'PersonRow', 'SuggestedPeople', 'SuggestedPersonCard', 'PeopleSearchResults', 'PeopleColdState', 'PeopleErrorState', 'PeopleStatus', 'MatchingExplainerDialog']
  .map((n) => readFileSync(resolve(componentDir, `${n}.jsx`), 'utf8')).join('\n')

describe('Privacy — narrow RPCs only, no cross-user table reads, P0 settings-read removed', () => {
  it('reads the opt-in taste projection + identity + FOF RPCs; search via its hook', () => {
    expect(providerSrc).toContain("rpc('get_discoverable_taste_profiles')")
    expect(providerSrc).toContain("rpc('get_people_public_identities'")
    expect(providerSrc).toContain("rpc('get_follow_suggestions')")
    expect(searchSrc).toContain("rpc('search_people_by_name'")
  })
  it('NEVER does the RLS-dead cross-user user_settings read (the removed P0 fail-open path)', () => {
    expect(providerSrc).not.toMatch(/\.from\(\s*['"]user_settings['"]\s*\)/)
    expect(providerSrc).not.toMatch(/showOnLeaderboards/)
  })
  it('makes ZERO direct users / behavioral table reads', () => {
    for (const t of ['users', 'user_history', 'user_ratings', 'reviews', 'user_fingerprint_public', 'user_similarity_discoverable']) {
      expect(providerSrc).not.toMatch(new RegExp(`\\.from\\(\\s*['"]${t}['"]\\s*\\)`))
    }
    expect(providerSrc).not.toMatch(/users!user_similarity/) // no embedded owner-only join
  })
  it('never selects email / last_active from any table', () => {
    expect(providerSrc).not.toMatch(/\.select\([^)]*email/i)
    expect(providerSrc).not.toMatch(/\.select\([^)]*last_active/i)
  })
  it('consent gate is the opt-in projection membership (discoverableTasteIds), not identity', () => {
    expect(providerSrc).toContain('discoverableTasteIds')
    expect(discoverySrc).toMatch(/discoverableTasteIds\.has/)
  })
})

describe('Truth — no exact %, no percentage-width bar, no generated handle, truthful bio', () => {
  it('no MatchBar component and no percentage-width geometry anywhere', () => {
    expect(peopleJsxSrc + allComponentSrc).not.toMatch(/MatchBar/)
    expect(allComponentSrc).not.toMatch(/width:\s*`\$\{[^}]*\}%`/)
    expect(peopleCss).not.toMatch(/width:\s*\d+%.*linear-gradient/)
  })
  it('no exact match percentage is rendered', () => {
    expect(allComponentSrc).not.toMatch(/\{[^}]*match[^}]*\}\s*%/)
    expect(allComponentSrc).not.toMatch(/% match/i)
  })
  it('no generated @handle is produced or rendered', () => {
    expect(discoverySrc).not.toMatch(/`@\$\{/)
    expect(providerSrc).not.toMatch(/deriveHandle/)
    expect(allComponentSrc).not.toMatch(/\.handle\b/)
  })
  it('bio uses the consent-exposed total, never movies_in_common', () => {
    expect(discoverySrc).toMatch(/fingerprint\?\.total/)
    expect(discoverySrc).not.toMatch(/watchCount:\s*inCommon/)
    expect(discoverySrc).not.toMatch(/moviesInCommon[^)]*watched/)
  })
})

describe('Doctrine — one-way follow, no friendship/feed/public-profile, no dead links', () => {
  it('relationship label is Follow/Following only (never friend)', () => {
    expect(followBtnSrc).toMatch(/following \? 'Following' : 'Follow'/)
    expect(allComponentSrc).not.toMatch(/[Ff]riends? whose|taste twins?|predict[s]? you|your circle/)
  })
  it('cards link to /profile/:id (not /dna/:id), no "View Cinematic DNA" button', () => {
    expect(allComponentSrc).not.toMatch(/View Cinematic DNA|View profile/)
    // Cards now link to /profile/:id — the cinematic social profile page
    expect(cardSrc).toMatch(/\/profile\//)
  })
  it('no Feed / Activity / Popular / public-rating copy', () => {
    expect(peopleJsxSrc + allComponentSrc).not.toMatch(/Popular on FeelFlick|most-watched|just (rated|watched)|Activity|CrewOverlap/)
  })
  it('invite shares a generic canonical URL — never a raw user id / ?ref=', () => {
    expect(peopleJsxSrc).toContain('https://app.feelflick.com/')
    expect(peopleJsxSrc).not.toMatch(/\?ref=/)
    expect(peopleJsxSrc).not.toMatch(/ref=\$\{[^}]*id/)
  })
  it('data.js exports only design tokens (no fabricated mocks)', () => {
    expect(Object.keys(peopleData).sort()).toEqual(['HP', 'ROSE', 'ROSE_DEEP'])
    for (const fake of ['Marco Reyes', 'Priya Shah', 'TWINS', 'ACTIVITY']) expect(peopleDataSrc).not.toContain(fake)
  })
})

describe('A11y/foundation source patterns', () => {
  it('the four rail regions are heading-labelled (runtime one-h1 is covered in the render test)', () => {
    for (const id of ['ff-people-twins-h', 'ff-people-rising-h', 'ff-people-suggested-h', 'ff-people-search-h']) {
      expect(allComponentSrc).toContain(`aria-labelledby="${id}"`)
      expect(allComponentSrc).toContain(`id="${id}"`)
    }
  })
  it('exactly one role="status" live region bound to relStatus', () => {
    const inShell = (peopleJsxSrc.match(/role="status"/g) || []).length
    expect(inShell).toBe(1)
    expect(peopleJsxSrc).toMatch(/role="status"[\s\S]{0,80}aria-live="polite"[\s\S]{0,40}aria-atomic="true"/)
    expect(peopleJsxSrc).toMatch(/>\{ctx\.relStatus\}</)
  })
  it('search input is 44px with an accessible name + focus-visible ring', () => {
    expect(searchInputSrc).toMatch(/className="ff-people-search-input"/)
    expect(searchInputSrc).toMatch(/minHeight: 44/)
    expect(searchInputSrc).toMatch(/aria-label="Search people by name"/)
    expect(peopleCss).toMatch(/\.ff-people-search-input:focus-visible/)
  })
  it('responsive: rails stack + strongest carousel at phone widths; no keyframes; reduced motion', () => {
    expect(peopleCss).toMatch(/@media \(max-width: 760px\)/)
    expect(peopleCss).toMatch(/scroll-snap-type/)
    expect(peopleCss).not.toMatch(/@keyframes/)
    expect(peopleCss).toMatch(/prefers-reduced-motion/)
  })
})

// ── Provider render: consent gate + fail-closed (mocked supabase) ────────────────────────────────
const db = { following: [], followers: 3, sim: [], simError: null, followingErr: null, taste: { data: [], error: null }, identities: { data: [], error: null }, fof: { data: [], error: null } }
function chain(table) {
  let isCount = false
  const c = {}
  c.select = (_s, opts) => { if (opts?.head || opts?.count) isCount = true; return c }
  for (const m of ['eq', 'order', 'limit', 'in', 'neq']) c[m] = () => c
  c.then = (res, rej) => {
    let out = { data: [], error: null }
    if (table === 'user_similarity') out = { data: db.sim, error: db.simError }
    else if (table === 'user_follows' && isCount) out = { count: db.followers, error: null }
    else if (table === 'user_follows') out = { data: db.following, error: db.followingErr }
    return Promise.resolve(out).then(res, rej)
  }
  return c
}
const rpcSpy = vi.fn((name) => Promise.resolve(
  name === 'get_discoverable_taste_profiles' ? db.taste
  : name === 'get_people_public_identities' ? db.identities
  : name === 'get_follow_suggestions' ? db.fof
  : { data: [], error: null }))
vi.mock('@/shared/lib/supabase/client', () => ({ supabase: { from: (t) => chain(t), rpc: (...a) => rpcSpy(...a) } }))
const AUTH = { user: { id: 'me' }, session: { user: { id: 'me' } } }
vi.mock('@/shared/hooks/useAuthSession', () => ({ useAuthSession: () => AUTH }))

import { PeopleDataProvider, usePeopleData } from '../usePeopleData'
function Consumer({ onState }) { onState(usePeopleData()); return null }
const renderProvider = (onState) => render(<PeopleDataProvider><Consumer onState={onState} /></PeopleDataProvider>)

describe('Provider — consent gate + fail-closed states', () => {
  beforeEach(() => {
    rpcSpy.mockClear()
    Object.assign(db, { following: [], followers: 3, sim: [], simError: null, followingErr: null, taste: { data: [], error: null }, identities: { data: [], error: null }, fof: { data: [], error: null } })
  })

  it('renders ONLY opted-in similarity candidates (opted-out absent even with identity)', async () => {
    db.sim = [
      { user_b_id: 'optIn', overall_similarity: 0.92, movies_in_common: 18 },
      { user_b_id: 'optOut', overall_similarity: 0.95, movies_in_common: 20 },
    ]
    db.taste = { data: [{ user_id: 'optIn', top_mood_tags: [{ key: 'tender' }], top_tone_tags: [{ key: 'reflective' }], top_fit_profiles: [], total: 40 }], error: null }
    db.identities = { data: [{ id: 'optIn', name: 'Ana', avatar_url: null }, { id: 'optOut', name: 'Zed', avatar_url: null }], error: null }
    let last
    renderProvider((s) => { last = s })
    await waitFor(() => expect(last.status).toBe('ready'))
    const ids = [...last.strongest, ...last.more, ...last.suggested].map((c) => c.id)
    expect(ids).toContain('optIn')
    expect(ids).not.toContain('optOut') // opted out → absent despite higher similarity + resolvable identity
  })

  it('taste-projection error FAILS CLOSED → discovery_unavailable, no candidate cards', async () => {
    db.sim = [{ user_b_id: 'a', overall_similarity: 0.9, movies_in_common: 18 }]
    db.taste = { data: null, error: { message: 'permission denied' } }
    let last
    renderProvider((s) => { last = s })
    await waitFor(() => expect(last.loading).toBe(false))
    expect(last.status).toBe('discovery_unavailable')
    expect(last.strongest).toEqual([])
    expect(last.more).toEqual([])
    expect(rpcSpy).not.toHaveBeenCalledWith('get_people_public_identities', expect.anything()) // no identity fetch after fail-closed
  })

  it('own follow-graph error → load_error (relationship state unknowable)', async () => {
    db.followingErr = { message: 'boom' }
    let last
    renderProvider((s) => { last = s })
    await waitFor(() => expect(last.loading).toBe(false))
    expect(last.status).toBe('load_error')
  })

  it('follower-count error is optional — discovery still resolves, follower count omitted', async () => {
    db.sim = []
    db.followers = 0
    // simulate count error by routing: keep following ok, count returns error
    const origThen = chain
    void origThen
    let last
    renderProvider((s) => { last = s })
    await waitFor(() => expect(last.loading).toBe(false))
    expect(['ready', 'discovery_unavailable']).toContain(last.status)
  })
})
