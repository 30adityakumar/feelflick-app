import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { installProfileFixture } from '../fixtures/profile.js'

// Cinematic DNA (redesign) — authenticated, fully-intercepted E2E. Proves the redesign contracts:
// owner-private + non-self no-fetch, canonical evidence (no duplicate inflation), maturity honesty
// (forming suppression + qualified evidence-maturity vocabulary), ZERO Edge calls / ZERO cache
// writes on render, and explicit-only refresh routed through the Evidence sheet ("Why this read?" →
// "Generate reflection") with honest settle/failure. Real /auth/v1 only; every Profile
// read/write/Edge/image is intercepted by the fixture.

const h1 = (page) => page.getByRole('heading', { level: 1 })
async function openProfile(page) {
  await page.goto('/profile')
  await expect(page.locator('#cinematic-dna-content')).toBeVisible({ timeout: 20_000 })
}
// The refresh affordance lives inside the Evidence sheet now.
async function openEvidence(page) {
  await page.getByRole('button', { name: /why this read/i }).first().click()
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8_000 })
}

test.describe('Cinematic DNA — authenticated, intercepted', () => {
  // A — established portrait: identity, labelled provenance, qualified evidence band, no exact %
  test('A — established: single h1 archetype, labelled reflection, qualified evidence maturity', async ({ page }) => {
    const ledger = await installProfileFixture(page) // established_current
    await openProfile(page)
    const region = page.locator('#cinematic-dna-content')
    await expect(region).toHaveAttribute('aria-label', 'Cinematic DNA')
    await expect(h1(page)).toHaveCount(1)
    await expect(h1(page)).toContainText('The Watcher')                                   // deterministic archetype identity
    // current generated reflection (the LLM summary) + provenance label (generated ≠ measured)
    await expect(page.getByText(/quiet, patient films/)).toBeVisible()
    await expect(page.getByText(/FeelFlick reflection/).first()).toBeVisible()
    await expect(page.getByText(/generated from verified taste patterns/i)).toBeVisible()
    // grounded fact pills (counts) + QUALIFIED evidence-maturity label, never an exact % / bare band
    await expect(page.getByText('16 watched')).toBeVisible()
    await expect(page.getByText('6 rated')).toBeVisible()
    await expect(page.getByText(/Evidence (still growing|taking shape|well established)/).first()).toBeVisible()
    await expect(region.getByText(/\b\d{1,3}%/)).toHaveCount(0)                            // no exact accuracy %
    await expect(page.getByRole('progressbar')).toHaveCount(0)
    // no refresh affordance for a current reflection (sheet closed); zero side effects
    await expect(page.getByRole('button', { name: /generate reflection|refresh reflection/i })).toHaveCount(0)
    expect(ledger.edgeCalls).toEqual([])
    expect(ledger.writes).toEqual([])
    expect(ledger.unexpectedRequests).toEqual([])
    // the Evidence sheet separates measured / derived / generated and discloses the LLM boundary
    await openEvidence(page)
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog.getByText('Measured', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Derived', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Generated', { exact: true })).toBeVisible()
    await expect(dialog.getByText(/the language model does not calculate your profile/i)).toBeVisible()
    await expect(dialog.getByRole('button', { name: /generate reflection/i })).toHaveCount(0) // current → no refresh
    expect(ledger.edgeCalls, 'opening Evidence never generates').toEqual([])
  })

  // B — THE cardinal test: zero Edge calls + zero cache writes on render / rerender / interaction
  for (const mode of ['established_current', 'established_stale', 'established_missing']) {
    test(`B — no Edge call / no cache write on mount + interaction (${mode})`, async ({ page }) => {
      const ledger = await installProfileFixture(page, { mode })
      await openProfile(page)
      await page.waitForTimeout(200)
      expect(ledger.edgeCalls, 'no Edge generation on mount').toEqual([])
      expect(ledger.writes, 'no cache write on mount').toEqual([])
      // scroll the whole portrait (force every section + IntersectionObserver/scrollspy to fire)
      await page.mouse.wheel(0, 4000); await page.waitForTimeout(150)
      // open + close the Evidence sheet (Escape) — inspection must not generate either
      await openEvidence(page)
      await page.keyboard.press('Escape')
      await expect(page.locator('[role="dialog"]')).toBeHidden()
      expect(ledger.edgeCalls, 'no Edge call after interaction').toEqual([])
      expect(ledger.writes, 'no cache write after interaction').toEqual([])
      expect(ledger.unexpectedRequests).toEqual([])
    })
  }

  // C — forming: honest still-forming identity, cached editorial suppressed, no refresh, no side effects
  test('C — forming: honest still-forming copy, no generated identity, no side effects', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'forming_cached' }) // cached editorial present but must be suppressed
    await openProfile(page)
    await expect(h1(page)).toHaveText(/still forming/i)
    await expect(page.getByText(/Log and rate a few films/i)).toBeVisible()
    await expect(page.getByText(/quiet, patient films/)).toHaveCount(0)                    // cached summary suppressed
    await expect(page.getByText('A keeper of quiet, patient light.')).toHaveCount(0)       // cached signature suppressed
    await expect(page.getByText('The Watcher')).toHaveCount(0)                             // no archetype below the floor
    await expect(page.getByRole('button', { name: /why this read|generate reflection/i })).toHaveCount(0)
    expect(ledger.edgeCalls).toEqual([])
    expect(ledger.writes).toEqual([])
    expect(ledger.unexpectedRequests).toEqual([])
  })

  // E — canonical duplicate resistance: 18 raw rows (film 9300 ×3) → 16 canonical, no inflation
  test('E — duplicate raw history collapses to canonical counts (no inflation)', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'duplicate' })
    await openProfile(page)
    await expect(page.getByText('16 watched')).toBeVisible()
    await expect(page.getByText('18 watched')).toHaveCount(0)
    expect(ledger.unexpectedRequests).toEqual([])
    expect(ledger.edgeCalls).toEqual([])
  })

  // F — stale reflection: flagged needing refresh, not shown as current, refresh in the sheet, no calls before click
  test('F — stale editorial: not current, refresh prompt in sheet, zero calls before click', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'established_stale' })
    await openProfile(page)
    await expect(page.getByText(/Reflection needs refreshing/i)).toBeVisible()
    await expect(page.getByText(/quiet, patient films/)).toHaveCount(0)                    // stale prose not shown as current
    await openEvidence(page)
    await expect(page.getByRole('button', { name: /generate reflection/i })).toBeVisible()
    expect(ledger.edgeCalls).toEqual([])
    expect(ledger.writes).toEqual([])
  })

  // G — explicit refresh success: one Edge call, settles, one versioned cache write, announced
  test('G — refresh success: one Edge call, settles to the new reflection, one cache write', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'established_missing', edgeMode: 'success' })
    await openProfile(page)
    await openEvidence(page)
    const gen = page.getByRole('button', { name: /generate reflection/i })
    await expect(gen).toBeVisible()
    expect(ledger.edgeCalls).toEqual([])
    await gen.click()
    await expect(page.getByText('Your FeelFlick reflection is updated.')).toBeVisible({ timeout: 10_000 })
    expect(ledger.edgeCalls).toHaveLength(1)                                               // exactly one Edge call
    expect(ledger.writes).toHaveLength(1)                                                  // one cache write
    expect(ledger.writes[0].table).toBe('user_profiles_computed')
    await expect(page.getByRole('button', { name: /generate reflection/i })).toHaveCount(0) // settled → no refresh
    expect(ledger.unexpectedRequests).toEqual([])
  })

  // H — the control disables during generation → no double-submit (one Edge call, one write)
  test('H — refresh disables during generation → no double-submit', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'established_missing', edgeMode: 'success' })
    // Delay the Edge response so the in-flight "Generating…" disabled state is reliably observable.
    const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST,OPTIONS', 'access-control-allow-headers': 'authorization,content-type,apikey,x-client-info', 'content-type': 'application/json' }
    await page.route('**/functions/v1/generate-taste-summary**', async (route) => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS, body: '' })
      ledger.edgeCalls.push({ at: ledger.requests.length })
      await new Promise((r) => setTimeout(r, 1200))
      return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify({ summary: 'A freshly generated reflection.', signature: 'Newly read.' }) })
    })
    await openProfile(page)
    await openEvidence(page)
    const gen = page.getByRole('button', { name: /generate reflection/i })
    await gen.click()
    // while generating: the control is busy + disabled, so a second click is impossible
    const busy = page.getByRole('button', { name: /generating/i })
    await expect(busy).toBeDisabled()
    await busy.click({ force: true, trial: true }).catch(() => {}) // attempt a second submit (no-op)
    await expect(page.getByText('Your FeelFlick reflection is updated.')).toBeVisible({ timeout: 10_000 })
    expect(ledger.edgeCalls).toHaveLength(1)
    expect(ledger.writes).toHaveLength(1)
  })

  // I — refresh Edge failure: honest retry, no raw text, no write, prior content preserved
  test('I — refresh Edge failure: honest retry, no raw error, no cache write', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'established_stale', edgeMode: 'edge_failure' })
    await openProfile(page)
    await openEvidence(page)
    await page.getByRole('button', { name: /generate reflection/i }).click()
    await expect(page.getByText(/Couldn’t refresh the reflection/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/mock edge failure/i)).toHaveCount(0)                      // no raw backend text
    expect(ledger.writes).toEqual([])                                                      // no cache write on Edge failure
    await expect(page.getByRole('button', { name: /try again/i })).toBeEnabled()           // re-enabled, retryable
  })

  // J — Edge success + cache-WRITE failure must settle to an honest error (no false durable success)
  test('J — refresh: Edge success + cache-write failure → honest error, no false "updated"', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'established_missing', edgeMode: 'success', cacheWriteMode: 'failure' })
    await openProfile(page)
    await openEvidence(page)
    await page.getByRole('button', { name: /generate reflection/i }).click()
    await expect(page.getByText(/Couldn’t refresh the reflection/i).first()).toBeVisible({ timeout: 10_000 })
    expect(ledger.edgeCalls, 'Edge succeeded exactly once').toHaveLength(1)
    expect(ledger.writes, 'exactly one cache write attempted').toHaveLength(1)
    await expect(page.getByText('Your FeelFlick reflection is updated.')).toHaveCount(0)   // no false success
    expect(ledger.unexpectedRequests, 'fixture still fails closed').toEqual([])
    // retry succeeds once the transient write failure clears
    ledger.setCacheWriteMode('success')
    await page.getByRole('button', { name: /try again/i }).click()
    await expect(page.getByText('Your FeelFlick reflection is updated.')).toBeVisible({ timeout: 10_000 })
    expect(ledger.edgeCalls).toHaveLength(2)
    expect(ledger.unexpectedRequests).toEqual([])
  })

  // K — malformed Edge response is treated as failure (no overwrite)
  test('K — malformed Edge response → failure, no cache write', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'established_missing', edgeMode: 'malformed' })
    await openProfile(page)
    await openEvidence(page)
    await page.getByRole('button', { name: /generate reflection/i }).click()
    await expect(page.getByText(/Couldn’t refresh the reflection/i).first()).toBeVisible({ timeout: 10_000 })
    expect(ledger.writes).toEqual([])
  })

  // M — private other-user route: no behavioral query for the target, no Edge/write
  test('M — /profile/:otherId is private, fetches nothing for the target', async ({ page }) => {
    const ledger = await installProfileFixture(page)
    await page.goto('/profile/00000000-0000-0000-0000-000000000999')
    await expect(h1(page)).toHaveText(/private/i)
    await expect(h1(page)).toHaveCount(1)
    await expect(page.getByRole('link', { name: /your cinematic dna/i })).toBeVisible()
    expect(ledger.readsFor('user_history')).toEqual([])
    expect(ledger.readsFor('user_ratings')).toEqual([])
    expect(ledger.readsFor('user_similarity')).toEqual([])
    expect(ledger.edgeCalls).toEqual([])
    expect(ledger.writes).toEqual([])
    expect(ledger.unexpectedRequests).toEqual([])
  })

  // N — safe error: sanitized copy with retry + Home, no raw backend text
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

  // Q — axe, standard rule set (serious/critical, excluding the tracked color-contrast tension)
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
    const results = await new AxeBuilder({ page }).include('#cinematic-dna-content').withRules(['color-contrast']).analyze()
    const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact))
    expect(serious, serious.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(' ')}`).join(' | ')).toEqual([])
  })

  // S — responsive: no horizontal overflow + single h1 at six widths
  test('S — responsive: no horizontal overflow + single h1 at six widths', async ({ page }) => {
    await installProfileFixture(page)
    for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(vp)
      await openProfile(page)
      await expect(h1(page)).toHaveCount(1)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `h-overflow at ${vp.width}`).toBeLessThanOrEqual(1)
    }
  })

  // O — keyboard: the refresh action (in the Evidence sheet) is reachable and operable without a mouse
  test('O — keyboard: the refresh action is reachable and operable without a mouse', async ({ page }) => {
    const ledger = await installProfileFixture(page, { mode: 'established_missing', edgeMode: 'success' })
    await openProfile(page)
    await openEvidence(page)
    const btn = page.getByRole('button', { name: /generate reflection/i })
    await btn.focus()
    await expect(btn).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByText('Your FeelFlick reflection is updated.')).toBeVisible({ timeout: 10_000 })
    expect(ledger.edgeCalls).toHaveLength(1)
  })
})
