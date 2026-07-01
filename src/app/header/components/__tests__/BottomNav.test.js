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

  it('orders them Home · Browse · Discover · DNA · You', () => {
    expect(TABS.map(t => t.label)).toEqual(['Home', 'Browse', 'Discover', 'DNA', 'You'])
  })

  it('wires each tab to its real route (DNA → /DNA Cinematic DNA portrait, You → /you hub)', () => {
    const byLabel = Object.fromEntries(TABS.map(t => [t.label, t.path]))
    expect(byLabel).toEqual({
      Home: '/home',
      Browse: '/browse',
      Discover: '/discover',
      DNA: '/DNA',
      You: '/you',
    })
  })

  it('DNA (the Cinematic DNA portrait) is active for /DNA and lowercase /dna, not the social /profile', () => {
    const dna = TABS.find(t => t.id === 'dna')
    expect(dna.match).toEqual(expect.arrayContaining(['/DNA', '/dna']))
    expect(dna.match).not.toContain('/profile')
  })

  it('keeps all five destinations reachable', () => {
    const paths = TABS.map(t => t.path)
    expect(paths).toEqual(
      expect.arrayContaining(['/home', '/browse', '/discover', '/DNA', '/you']),
    )
  })

  it('gives every tab an icon', () => {
    expect(TABS.every(t => Boolean(t.Icon))).toBe(true)
  })
})
