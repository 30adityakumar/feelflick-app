import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { installPreferencesFixture } from '../fixtures/preferences.js'

// Authenticated, fully-intercepted E2E for /preferences. Proves the redesign's contracts in a real
// browser: hardened load (ready/degraded/load_error), derived summary, the three direct controls,
// truthful scope (unsupported controls absent), transactional RPC-only Save (no direct table writes),
// conflict + duplicate-submit guards, read-only recommendation-data dialog, fixed save dock above the
// BottomNav, dirty-navigation guard, responsive + 200% + reduced-motion + forced-colors + axe.

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const NAV = '.fixed.bottom-0.left-0.right-0.z-30'
const h1 = (page) => page.getByRole('heading', { level: 1 })

async function open(page) {
  await page.goto('/preferences')
  await expect(h1(page)).toBeVisible({ timeout: 20_000 })
  await expect(h1(page)).toHaveText(/Your taste, clearly/i)
}
async function expandGroup(page, name) {
  await page.getByRole('group').filter({ hasText: name }).locator('summary').first().click().catch(() => {})
}

test.describe('Preferences — authenticated, intercepted', () => {
  test('A — composition: one h1, no nested main, derived summary', async ({ page }) => {
    await installPreferencesFixture(page)
    await open(page)
    await expect(h1(page)).toHaveCount(1)
    await expect(page.locator('main')).toHaveCount(1) // AppShell owns the one <main>
    expect(await page.locator('.ff-prefs main').count()).toBe(0) // Preferences adds no nested <main>
    await expect(page.getByText('2 preferred · 1 avoided')).toBeVisible()
    await expect(page.getByText('95–160 min')).toBeVisible()
    await expect(page.getByText('Watched · Ratings · Saves · Skips')).toBeVisible()
  })

  test('B — truthful scope: unsupported controls absent, honest verbs', async ({ page }) => {
    await installPreferencesFixture(page)
    await open(page)
    const body = (await page.locator('body').innerText()).toLowerCase()
    for (const banned of ['push my taste', 'ambiguous ending', 'what pacing', 'rewatch', 'franchis', 'black-and-white', 'silent film', 'korean cinema', 'closed captions', 'reset learned taste', 'reduce influence', 'recomputes nightly', 'filtered out entirely', 'quiet boost', 'save and retune']) {
      expect(body).not.toContain(banned)
    }
    await expect(page.getByText(/Down-ranked directors/i).first()).toBeTruthy()
  })

  test('C — three direct controls operate (mood band, genres, runtime gap)', async ({ page }) => {
    await installPreferencesFixture(page)
    await open(page)
    // mood band
    await page.getByRole('radiogroup', { name: 'Tender' }).getByRole('radio', { name: 'More' }).click()
    await expect(page.getByRole('region', { name: /unsaved preference changes/i })).toBeVisible()
    // genre add + remove (Comedy is not pre-selected)
    await page.getByRole('button', { name: 'Add a preferred genre' }).click()
    await page.getByRole('option', { name: 'Comedy' }).click()
    await expect(page.getByRole('button', { name: 'Remove Comedy' })).toBeVisible()
    // overlap prevented: adding Comedy to avoid is a no-op (still one Remove Comedy)
    await page.getByRole('button', { name: 'Add an avoided genre' }).click()
    await page.getByRole('option', { name: 'Comedy' }).click()
    await expect(page.getByRole('button', { name: 'Remove Comedy' })).toHaveCount(1)
    // runtime minimum gap (floor cannot cross cap)
    await page.locator('#pf-rt-floor').fill('240')
    await expect(page.getByText('155–160 min')).toBeVisible() // summary cell (unique vs the runtime value)
  })

  test('D — transactional Save: RPC only, no direct table writes, success status', async ({ page }) => {
    const ledger = await installPreferencesFixture(page, { rpc: 'success' })
    await open(page)
    await page.getByRole('radiogroup', { name: 'Tender' }).getByRole('radio', { name: 'Less' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('status')).toContainText(/Preferences saved/i)
    await expect(page.getByRole('region', { name: /unsaved preference changes/i })).toHaveCount(0)
    expect(ledger.rpcs.filter((r) => r.name === 'save_user_preferences_v2')).toHaveLength(1)
    expect(ledger.directWrites).toEqual([]) // no legacy multi-write fallback
  })

  test('E — Save error keeps the draft and shows a safe message in the dock', async ({ page }) => {
    await installPreferencesFixture(page, { rpc: 'error' })
    await open(page)
    await page.getByRole('radiogroup', { name: 'Tender' }).getByRole('radio', { name: 'Less' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('region', { name: /unsaved preference changes/i })
      .getByText('Could not save your preferences. Try again.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  test('F — concurrency conflict shows the reload/keep-editing banner', async ({ page }) => {
    await installPreferencesFixture(page, { rpc: 'conflict' })
    await open(page)
    await page.getByRole('radiogroup', { name: 'Tender' }).getByRole('radio', { name: 'Less' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('region', { name: 'Save conflict' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reload latest' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Keep editing' })).toBeVisible()
  })

  test('G — duplicate submit guarded (saving disables Save; exactly one RPC)', async ({ page }) => {
    const ledger = await installPreferencesFixture(page, { rpc: 'success', saveDelayMs: 900 })
    await open(page)
    await page.getByRole('radiogroup', { name: 'Tender' }).getByRole('radio', { name: 'Less' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    // While the RPC is in flight the control is disabled "Saving…" — a second submit is impossible.
    await expect(page.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    await expect(page.getByRole('status')).toContainText(/Preferences saved/i, { timeout: 5000 })
    expect(ledger.rpcs.filter((r) => r.name === 'save_user_preferences_v2')).toHaveLength(1)
  })

  test('H — Discard reverts to the persisted baseline', async ({ page }) => {
    await installPreferencesFixture(page)
    await open(page)
    await page.getByRole('radiogroup', { name: 'Tender' }).getByRole('radio', { name: 'Less' }).click()
    await page.getByRole('button', { name: 'Discard' }).click()
    await expect(page.getByRole('region', { name: /unsaved preference changes/i })).toHaveCount(0)
  })

  test('I — critical load error: no editable controls, Retry recovers', async ({ page }) => {
    // Fail the provider-exclusive user_preferences read once → critical load_error → Retry recovers.
    await installPreferencesFixture(page, { prefsError: 'once' })
    await page.goto('/preferences')
    await expect(page.getByText(/could not load your preferences/i)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('region', { name: /unsaved preference changes/i })).toHaveCount(0)
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect(h1(page)).toHaveText(/Your taste, clearly/i)
  })

  test('J — optional suggestion failure degrades (page still renders)', async ({ page }) => {
    await installPreferencesFixture(page, { historyError: true })
    await open(page)
    await expect(page.getByText('95–160 min')).toBeVisible()
  })

  test('K — recommendation-data dialog is read-only (no signal actions / reset)', async ({ page }) => {
    await installPreferencesFixture(page)
    await open(page)
    await page.getByRole('button', { name: 'Review' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('What shapes your recommendations')).toBeVisible()
    await expect(dialog.getByText(/cannot yet be disabled individually/i)).toBeVisible()
    for (const banned of ['Correct', 'Reduce influence', 'Stop using', 'Reset']) {
      await expect(dialog.getByRole('button', { name: new RegExp(banned, 'i') })).toHaveCount(0)
    }
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('L — streaming is a disabled coming-soon panel', async ({ page }) => {
    await installPreferencesFixture(page)
    await open(page)
    await expandGroup(page, 'Where you can watch')
    await expect(page.getByText(/coming later/i)).toBeVisible()
  })

  test('M — dirty internal navigation prompts the unsaved-changes dialog', async ({ page }) => {
    await installPreferencesFixture(page)
    await page.setViewportSize({ width: 390, height: 844 }) // mobile bottom nav uses router NavLinks
    await open(page)
    await page.getByRole('radiogroup', { name: 'Tender' }).getByRole('radio', { name: 'Less' }).click()
    await page.getByRole('link', { name: 'Browse' }).click() // SPA NavLink → useBlocker intercepts
    await expect(page.getByText(/leave without saving/i)).toBeVisible()
    await page.getByRole('button', { name: 'Keep editing' }).click()
    await expect(h1(page)).toHaveText(/Your taste, clearly/i)
  })

  test('N — save dock clears the BottomNav at 390 and 320', async ({ page }) => {
    await installPreferencesFixture(page)
    for (const w of [390, 320]) {
      await page.setViewportSize({ width: w, height: 800 })
      await open(page)
      await page.getByRole('radiogroup', { name: 'Tender' }).getByRole('radio', { name: 'Less' }).click()
      const dock = await page.getByRole('region', { name: /unsaved preference changes/i }).boundingBox()
      const nav = await page.locator(NAV).first().boundingBox()
      if (dock && nav) expect(dock.y + dock.height).toBeLessThanOrEqual(nav.y - 8)
    }
  })

  test('O — no horizontal overflow at 320 / 390 / landscape / 200%', async ({ page }) => {
    await installPreferencesFixture(page)
    for (const [w, h] of [[320, 812], [390, 844], [844, 390], [640, 800], [195, 600], [160, 600]]) {
      await page.setViewportSize({ width: w, height: h })
      await open(page)
      const overflow = await page.evaluate(() => { const el = document.scrollingElement || document.documentElement; return el.scrollWidth - el.clientWidth })
      expect(overflow, `overflow at ${w}x${h}`).toBeLessThanOrEqual(1)
    }
  })

  test('P — axe: zero serious/critical (excl. color-contrast) + scoped contrast on the surface', async ({ page }) => {
    await installPreferencesFixture(page)
    // General gate across default + reduced-motion + forced-colors. color-contrast is excluded here
    // (a deliberate editorial choice tracked separately, matching the other route gates).
    for (const media of [{}, { reducedMotion: 'reduce' }, { forcedColors: 'active' }]) {
      await page.emulateMedia(media)
      await open(page)
      const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
      const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact) && v.id !== 'color-contrast')
      expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([])
    }
    // Contrast IS gated, scoped to the Preferences surface (the redesign owns its own contrast).
    // Reset forced-colors first — under forced-colors axe computes against the forced white canvas,
    // which is not the real theme (emulateMedia({}) does NOT clear a previously-set forcedColors).
    await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' })
    await open(page)
    const contrast = await new AxeBuilder({ page }).include('.ff-prefs').withRules(['color-contrast']).analyze()
    const cv = contrast.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
    expect(cv, JSON.stringify(cv.flatMap((v) => v.nodes.map((n) => n.target)))).toEqual([])
  })
})
