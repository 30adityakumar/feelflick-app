import { describe, expect, it } from 'vitest'

import { TABS } from '../BottomNav'

// IA v2 contract (F2) — see docs/ia-v2-decision-record.md.
// The mobile bottom nav must make the nightly pick / Briefing the prime action,
// NOT Discover (a supporting surface). These are config-level assertions on the
// IA contract, not brittle visual-wording checks: the `hero` flag + the primary
// label ARE the product contract this phase establishes.
describe('BottomNav — IA v2 contract', () => {
  const heroTabs = TABS.filter(t => t.hero)

  it('has exactly one hero (prime) tab', () => {
    expect(heroTabs).toHaveLength(1)
  })

  it('makes the Briefing (/home) the hero, labeled "Tonight"', () => {
    const [hero] = heroTabs
    expect(hero.path).toBe('/home')
    expect(hero.label).toBe('Tonight')
  })

  it('keeps Discover present but NOT the hero (it is a supporting surface)', () => {
    const discover = TABS.find(t => t.path === '/discover')
    expect(discover).toBeTruthy()
    expect(discover.hero).toBeFalsy()
  })

  it('does not label the primary destination "Home"', () => {
    expect(TABS.some(t => t.label === 'Home')).toBe(false)
  })

  it('keeps all five destinations reachable', () => {
    const paths = TABS.map(t => t.path)
    expect(paths).toEqual(
      expect.arrayContaining(['/browse', '/discover', '/home', '/profile', '/account']),
    )
  })

  it('centers the hero among five tabs (one thumb-tap)', () => {
    expect(TABS).toHaveLength(5)
    expect(TABS[2].hero).toBe(true)
  })
})
