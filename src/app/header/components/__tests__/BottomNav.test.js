import { describe, expect, it } from 'vitest'

import { TABS } from '../BottomNav'

// Mobile bottom-nav IA contract: five EQUAL tabs (no hero), in a fixed order, each
// wired to its real route. Config-level assertions on the contract, not brittle
// visual-wording checks.
describe('BottomNav — IA contract', () => {
  it('has five equal tabs with no hero', () => {
    expect(TABS).toHaveLength(5)
    expect(TABS.some(t => t.hero)).toBe(false)
  })

  it('orders them Home · Browse · Discover · DNA · Account', () => {
    expect(TABS.map(t => t.label)).toEqual(['Home', 'Browse', 'Discover', 'DNA', 'Account'])
  })

  it('wires each tab to its real route (DNA → /profile, Account → /account)', () => {
    const byLabel = Object.fromEntries(TABS.map(t => [t.label, t.path]))
    expect(byLabel).toEqual({
      Home: '/home',
      Browse: '/browse',
      Discover: '/discover',
      DNA: '/profile',
      Account: '/account',
    })
  })

  it('keeps all five destinations reachable', () => {
    const paths = TABS.map(t => t.path)
    expect(paths).toEqual(
      expect.arrayContaining(['/home', '/browse', '/discover', '/profile', '/account']),
    )
  })

  it('gives every tab an icon', () => {
    expect(TABS.every(t => Boolean(t.Icon))).toBe(true)
  })
})
