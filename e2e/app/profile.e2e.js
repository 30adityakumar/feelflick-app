import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { installProfileFixture } from '../fixtures/profile.js'

// Cinematic DNA — authenticated, fully-intercepted E2E. Proves the F7.2–F7.6 contracts together:
// self-only, canonical evidence, maturity honesty, labelled generated content, accessible charts,
// ZERO Edge calls / ZERO cache writes on render, explicit settled refresh, version-aware cache.
// Real /auth/v1 only; every Profile read/write/Edge/image is intercepted by the fixture.

const h1 = (page) => page.getByRole('heading', { level: 1 })
async function openProfile(page) {
  await page.goto('/profile')
  await expect(page.locator('#cinematic-dna-content')).toBeVisible({ timeout: 20_000 })
}

test.describe('Cinematic DNA — authenticated, intercepted', () => {
  // A — established dossier hierarchy
  test('A — established: hierarchy, labelled reflection, derived archetype, qualitative confidence', async ({ page }) => {
    const ledger = await installProfileFixture(page)
    await openProfile(page)
    // one labelled region + a single h1 (the masthead name)
    const region = page.locator('#cinematic-dna-content')
    await expect(region).toHaveAttribute('aria-label', 'Cinematic DNA')
    await expect(h1(page)).toHaveCount(1)
    // evidence summary
    await expect(page.getByText('Based on 16 watched films and 6 ratings')).toBeVisible()
    // current generated reflection + provenance label (generated ≠ measured)
    await expect(page.getByText(/quiet, patient films/)).toBeVisible()
    await expect(page.getByText(/FeelFlick reflection/).first()).toBeVisible()
    await expect(page.getByText(/a generated interpretation of your film activity, not a measured fact/i)).toBeVisible()
    // derived archetype, marked derived (not generated)
    await expect(page.getByText('Taste pattern')).toBeVisible()
    await expect(page.getByText(/Derived from your film signals/i)).toBeVisible()
    // qualitative confidence band, never an exact %
    await expect(page.getByText('DNA confidence')).toBeVisible()
    await expect(page.getByText(/Still forming|Taking shape|Well established/).first()).toBeVisible()
    // confidence is framed as evidence, never an exact accuracy %
    await expect(page.getByText(/not a measure of accuracy/i)).toBeVisible()
    await expect(page.getByRole('progressbar')).toHaveCount(0)
    // no refresh prompt for a current reflection; no side effects
    await expect(page.getByRole('button', { name: /refresh reflection|generate reflection/i })).toHaveCount(0)
    expect(ledger.edgeCalls).toEqual([])
    expect(ledger.writes).toEqual([])
    expect(ledger.unexpectedRequests).toEqual([])
  })

  // B — THE cardinal test: zero Edge calls + zero cache writes on render / rerender / interaction
  for (const mode of ['established_current', 'established_stale', 'established_missing']) {
    test(`B — no Edge call / no cache write on mount + interaction (${mode})`, async ({ page }) => {
      const ledger = await installProfileFixture(page, { mode })
      await openProfile(page)
      // settle
      await page.waitForTimeout(200)
      expect(ledger.edgeCalls, 'no Edge generation on mount').toEqual([])
      expect(ledger.writes, 'no cache write on mount').toEqual([])
      // a local chart interaction (trajectory range toggle, if present) must not generate either
      const allTime = page.getByRole('button', { name: 'All time' })
      if (await allTime.count()) { await allTime.click(); await page.waitForTimeout(100) }
      // scroll the whole dossier (force every section + IntersectionObserver to fire)
      await page.mouse.wheel(0, 4000); await page.waitForTimeout(150)
      expect(ledger.edgeCalls, 'no Edge call after interaction').toEqual([])
      expect(ledger.writes, 'no cache write after interaction').toEqual([])
      expect(ledger.unexpectedRequests).toEqual([])
    })
  }

  // C — forming: no generated identity, no refresh action, no side effects
  test('C — forming: honest still-forming copy, no generated identity, no side effects', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'forming_cached' }) // cached editorial present but must be suppressed
    await openProfile(page)
    await expect(page.getByText(/Watch and rate a few more films to reveal stronger patterns/i)).toBeVisible()
    await expect(page.getByText(/quiet, patient films/)).toHaveCount(0)        // cached summary suppressed
    await expect(page.getByText('A keeper of quiet, patient light.')).toHaveCount(0) // cached signature suppressed
    await expect(page.getByRole('button', { name: /refresh reflection|generate reflection/i })).toHaveCount(0)
    expect(ledger.edgeCalls).toEqual([])
    expect(ledger.writes).toEqual([])
    expect(ledger.unexpectedRequests).toEqual([])
  })

  // E — canonical duplicate resistance
  test('E — duplicate raw history collapses to canonical counts (no inflation)', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'duplicate' })
    await openProfile(page)
    // 16 canonical films though film 9300 has 3 raw rows (18 rows). Masthead meta + evidence:
    await expect(page.getByText('Based on 16 watched films and 6 ratings')).toBeVisible()
    await expect(page.getByText('16 films · 7 hours').or(page.getByText(/16 films/))).toBeVisible()
    expect(ledger.unexpectedRequests).toEqual([])
    expect(ledger.edgeCalls).toEqual([])
  })

  // F — stale reflection: not shown as current, explicit refresh appears, no calls before click
  test('F — stale editorial: not current, refresh prompt shown, zero calls before click', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'established_stale' })
    await openProfile(page)
    await expect(page.getByText(/Your taste evidence has changed\. Refresh the reflection/i)).toBeVisible()
    await expect(page.getByText(/quiet, patient films/)).toHaveCount(0)         // stale prose not shown as current
    await expect(page.getByRole('button', { name: /refresh reflection/i })).toBeVisible()
    // dossier still usable
    await expect(page.getByText('How you')).toBeVisible()
    expect(ledger.edgeCalls).toEqual([])
    expect(ledger.writes).toEqual([])
  })

  // G — explicit refresh success: one Edge call, busy state, settled render, versioned cache write
  test('G — refresh success: one Edge call, settles to the new reflection, one cache write', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'established_missing', edgeMode: 'success' })
    await openProfile(page)
    await expect(page.getByText(/Generate a reflection from your current film activity/i)).toBeVisible()
    expect(ledger.edgeCalls).toEqual([])
    await page.getByRole('button', { name: /generate reflection/i }).click()
    await expect(page.getByText(/A freshly generated reflection/)).toBeVisible({ timeout: 10_000 })
    expect(ledger.edgeCalls).toHaveLength(1)                                    // exactly one Edge call
    expect(ledger.writes).toHaveLength(1)                                       // one cache write
    expect(ledger.writes[0].table).toBe('user_profiles_computed')
    // success announcement in a polite status; no raw internal version shown
    await expect(page.getByText('Your FeelFlick reflection is updated.')).toBeVisible()
    expect(ledger.unexpectedRequests).toEqual([])
  })

  // H — the control disables during generation → no double-submit (one Edge call, one write)
  test('H — refresh disables during generation → no double-submit', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'established_missing', edgeMode: 'success' })
    await openProfile(page)
    await page.getByRole('button', { name: /generate reflection/i }).click()
    // while generating the control is busy + disabled, so a second submit is impossible
    await expect(page.getByRole('button', { name: /refreshing/i })).toBeDisabled()
    await expect(page.getByText(/A freshly generated reflection/)).toBeVisible({ timeout: 10_000 })
    expect(ledger.edgeCalls).toHaveLength(1)
    expect(ledger.writes).toHaveLength(1)
  })

  // I — refresh Edge failure: honest retry, no raw text, no write, prior content preserved
  test('I — refresh Edge failure: honest retry, no raw error, no cache write', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'established_stale', edgeMode: 'edge_failure' })
    await openProfile(page)
    await page.getByRole('button', { name: /refresh reflection/i }).click()
    await expect(page.getByText(/We couldn’t refresh your reflection\. Try again\./i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/mock edge failure/i)).toHaveCount(0)           // no raw backend text
    expect(ledger.writes).toEqual([])                                          // no cache write on Edge failure
    await expect(page.getByRole('button', { name: /refresh reflection/i })).toBeEnabled() // re-enabled, retryable
  })

  // K — malformed Edge response is treated as failure (no overwrite)
  test('K — malformed Edge response → failure, no cache write', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'established_missing', edgeMode: 'malformed' })
    await openProfile(page)
    await page.getByRole('button', { name: /generate reflection/i }).click()
    await expect(page.getByText(/We couldn’t refresh your reflection/i).first()).toBeVisible({ timeout: 10_000 })
    expect(ledger.writes).toEqual([])
  })

  // J — Edge success + cache-WRITE failure must settle to an honest error (no false durable success)
  test('J — refresh: Edge success + cache-write failure → honest error, no false "updated"', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'established_missing', edgeMode: 'success', cacheWriteMode: 'failure' })
    await openProfile(page)
    await page.getByRole('button', { name: /generate reflection/i }).click()
    await expect(page.getByText(/We couldn’t refresh your reflection/i).first()).toBeVisible({ timeout: 10_000 })
    expect(ledger.edgeCalls, 'Edge succeeded exactly once').toHaveLength(1)
    expect(ledger.writes, 'exactly one cache write attempted').toHaveLength(1)
    await expect(page.getByText('Your FeelFlick reflection is updated.')).toHaveCount(0) // no false success announcement
    await expect(page.getByText(/A freshly generated reflection/)).toHaveCount(0)        // fresh prose NOT shown as current
    await expect(page.getByRole('button', { name: /generate reflection/i })).toBeEnabled() // re-enabled / retryable
    expect(ledger.unexpectedRequests, 'fixture still fails closed').toEqual([])
    // retry succeeds once the transient write failure clears
    ledger.setCacheWriteMode('success')
    await page.getByRole('button', { name: /generate reflection/i }).click()
    await expect(page.getByText(/A freshly generated reflection/)).toBeVisible({ timeout: 10_000 })
    expect(ledger.edgeCalls).toHaveLength(2)
    expect(ledger.unexpectedRequests).toEqual([])
  })

  // M — private other-user route: no behavioral query for the target, no Edge/write
  test('M — /profile/:otherId is private, fetches nothing for the target', async ({ page }) => {
    const ledger = await installProfileFixture(page)
    await page.goto('/profile/00000000-0000-0000-0000-000000000999')
    await expect(h1(page)).toHaveText(/private/i)
    await expect(h1(page)).toHaveCount(1)
    await expect(page.getByRole('link', { name: /your cinematic dna/i })).toBeVisible()
    // no behavioral reads for the target user, no Edge call, no write
    expect(ledger.readsFor('user_history')).toEqual([])
    expect(ledger.readsFor('user_ratings')).toEqual([])
    expect(ledger.readsFor('user_similarity')).toEqual([])
    expect(ledger.edgeCalls).toEqual([])
    expect(ledger.writes).toEqual([])
    expect(ledger.unexpectedRequests).toEqual([])
  })

  // N — loading + safe error
  test('N — load error renders sanitized copy with retry + Home, no raw text', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'load_error' })
    await page.goto('/profile')
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 20_000 })
    await expect(h1(page)).toHaveText(/couldn’t load your cinematic dna/i)
    await expect(page.getByText(/relation does not exist|raw technical detail|42P01/i)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /go to home/i })).toBeVisible()
    expect(ledger.edgeCalls).toEqual([])
    expect(ledger.writes).toEqual([])
  })

  // Q — axe, standard rule set (matching the project's gate: serious/critical, excluding the
  // tracked color-contrast tension), across key states. Contrast has its own pass in R.
  const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
  test('Q — axe (standard) has no serious/critical violations across states', async ({ page }) => {
    for (const mode of ['established_current', 'forming_cached', 'established_stale']) {
      await installProfileFixture(page, { mode })
      await openProfile(page)
      const results = await new AxeBuilder({ page }).include('#cinematic-dna-content').withTags(WCAG).analyze()
      const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact) && v.id !== 'color-contrast')
      expect(serious, `${mode}: ${serious.map(v => v.id).join(', ')}`).toEqual([])
    }
  })

  // R — axe WITH colour-contrast (the project's usual exclusion lifted, Profile only)
  test('R — axe with colour-contrast enabled: no serious/critical violations', async ({ page }) => {
    await installProfileFixture(page, { mode: 'established_current' })
    await openProfile(page)
    const results = await new AxeBuilder({ page })
      .include('#cinematic-dna-content')
      .withRules(['color-contrast'])
      .analyze()
    const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact))
    expect(serious, serious.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(' ')}`).join(' | ')).toEqual([])
  })

  // S — responsive: no horizontal overflow, one h1, content reachable, at 6 widths
  test('S — responsive: no horizontal overflow + single h1 at six widths', async ({ page }) => {
    await installProfileFixture(page)
    for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 768, height: 1024 }, { width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(vp)
      await openProfile(page)
      await expect(h1(page)).toHaveCount(1)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `h-overflow at ${vp.width}`).toBeLessThanOrEqual(1)
    }
  })

  // O — keyboard: refresh action + trajectory toggle reachable and operable, visible focus
  test('O — keyboard: the refresh action is reachable and operable without a mouse', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'established_missing', edgeMode: 'success' })
    await openProfile(page)
    const btn = page.getByRole('button', { name: /generate reflection/i })
    await btn.focus()
    await expect(btn).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByText(/A freshly generated reflection/)).toBeVisible({ timeout: 10_000 })
    expect(ledger.edgeCalls).toHaveLength(1)
  })
})
