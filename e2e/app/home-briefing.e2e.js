// e2e/app/home-briefing.e2e.js
// Authenticated, deterministic Home Briefing journey. The dev test user signs in for
// real (Supabase /auth/v1 passes through); installHomeFixture intercepts 100% of
// /rest/v1/** (deterministic reads, recorded + locally-fulfilled writes, aborted
// unexpected writes) + TMDB, so no Home row ever reaches the backend. Separate from
// the simple route/auth checks in home.e2e.js (kept intact).

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { installHomeFixture, SEEN_TITLES } from '../fixtures/home.js'

const BENIGN = [
  'React DevTools', 'React Router Future Flag', '[vite]', 'Sentry', 'PostHog',
  '@vite/client', 'WebSocket', 'Vite server', 'ERR_CONNECTION_REFUSED', 'Download the React DevTools',
]
function attachGuards(page, extraAllow = []) {
  const allow = [...BENIGN, ...extraAllow]
  const benign = (t) => allow.some(a => t.includes(a))
  const errors = []
  page.on('pageerror', (e) => { if (!benign(e.message)) errors.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => { if (m.type() === 'error' && !benign(m.text())) errors.push(`console.error: ${m.text()}`) })
  return errors
}

const BRIEFING = ['Lantern Hill', 'Paper Boats', 'The Long Quiet']
const TENDER = ['Lantern Hill', 'Paper Boats']

const h1 = (page) => page.getByRole('heading', { level: 1 })
const pick = (page) => page.getByRole('heading', { level: 2 }).first()
const btn = (page, name) => page.getByRole('button', { name, exact: true })
const moodPill = (page, label) => page.getByRole('button', { name: label, exact: true })
const moodGroup = (page) => page.getByRole('group', { name: "Adjust tonight's mood" })
const status = (page, re) => page.locator('[role="status"][aria-live="polite"]').filter({ hasText: re })
const writesTo = (ledger, table) => ledger.writesFor(table)
const bodyIncludes = (w, s) => JSON.stringify(w.body || '').includes(s)

async function gotoHome(page, ledger) {
  await page.goto('/home')
  await expect(pick(page)).toBeVisible({ timeout: 20_000 })
  expect(ledger.unexpectedRequests).toEqual([])
}
const pickText = async (page) => (await pick(page).textContent())?.trim()

// ── Test A — pick-first journey ────────────────────────────────────────────────
test.describe('Home Briefing — authenticated, intercepted', () => {
  test('A — pick-first Home journey, no surprise writes', async ({ page }) => {
    const errors = attachGuards(page)
    const ledger = await installHomeFixture(page)
    await gotoHome(page, ledger)

    await expect(page).toHaveURL(/\/home(?:[/?#]|$)/)
    await expect(h1(page)).toHaveCount(1)
    const initial = await pickText(page)
    expect(TENDER).toContain(initial)
    for (const t of BRIEFING.filter(t => t !== initial)) await expect(page.getByText(t, { exact: true })).toHaveCount(0)

    await expect(btn(page, 'Open Film File')).toBeVisible()
    await expect(btn(page, 'Mark Watched')).toBeVisible()
    await expect(btn(page, 'Save')).toBeVisible()
    await expect(btn(page, 'Not tonight')).toBeVisible()
    await expect(page.getByRole('button', { name: /reshuffle/i })).toHaveCount(0)
    await expect(page.getByText(/\d+\s*%/)).toHaveCount(0)
    for (const re of [/Pick up where you paused/i, /Curated edits/i, /taste twins/i, /Taste-twin pulse/i, /Cinematic DNA/i]) {
      await expect(page.getByText(re)).toHaveCount(0)
    }

    // tail order: pick → Adjust mood → QuickLog → Open Discover
    const pickBox = await pick(page).boundingBox()
    const moodBox = await page.getByText('Adjust mood', { exact: true }).boundingBox()
    const qlBox = await page.getByText(/Have you seen any of these\?/i).boundingBox()
    const discBox = await btn(page, 'Open Discover').boundingBox()
    expect(pickBox.y).toBeLessThan(moodBox.y)
    expect(moodBox.y).toBeLessThan(qlBox.y)
    expect(qlBox.y).toBeLessThan(discBox.y)

    // impressions: hero (briefing_active) + quick_picks (seen_candidates)
    expect(writesTo(ledger, 'recommendation_impressions').some(w => bodyIncludes(w, 'briefing_active'))).toBe(true)
    expect(ledger.writes.some(w => bodyIncludes(w, 'seen_candidates'))).toBe(true)

    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors).toEqual([])
  })

  // ── Test B — mood adjustment ──────────────────────────────────────────────────
  test('B — Adjust mood switches the deterministic pick', async ({ page }) => {
    const errors = attachGuards(page)
    const ledger = await installHomeFixture(page)
    await gotoHome(page, ledger)

    await expect(moodGroup(page)).toBeVisible()
    expect(await moodPill(page, 'Tender').getAttribute('aria-pressed')).toBe('true')
    expect(await moodPill(page, 'Cozy').getAttribute('aria-pressed')).toBe('false')

    ledger.resetWrites()
    await moodPill(page, 'Cozy').click()
    await expect(moodPill(page, 'Cozy')).toHaveAttribute('aria-pressed', 'true')
    await expect(moodPill(page, 'Tender')).toHaveAttribute('aria-pressed', 'false')
    // cozy pool has exactly one film → deterministic pick
    await expect(pick(page)).toHaveText('The Long Quiet')
    for (const t of TENDER) await expect(page.getByText(t, { exact: true })).toHaveCount(0)
    // the new pick logs its own active impression; no "For your … night" fabrication
    await expect(page.getByText(/for your .* night/i)).toHaveCount(0)
    expect(writesTo(ledger, 'recommendation_impressions').some(w => bodyIncludes(w, 'briefing_active'))).toBe(true)

    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors).toEqual([])
  })

  // ── Test C — Not tonight progression ──────────────────────────────────────────
  test('C — Not tonight promotes the next pick + records skip', async ({ page }) => {
    const errors = attachGuards(page)
    const ledger = await installHomeFixture(page)
    await gotoHome(page, ledger)

    const first = await pickText(page)
    ledger.resetWrites()
    await btn(page, 'Not tonight').click()
    await expect(pick(page)).not.toHaveText(first, { timeout: 10_000 })
    const second = await pickText(page)
    expect(TENDER).toContain(second)
    expect(second).not.toBe(first)
    await expect(page.getByText(first, { exact: true })).toHaveCount(0)
    await expect(page.getByText('The Long Quiet', { exact: true })).toHaveCount(0) // cozy never in tender Briefing

    // skipped-impression PATCH + dismiss interaction recorded (payloads unchanged)
    await expect.poll(() => writesTo(ledger, 'recommendation_impressions').some(w => w.method === 'PATCH')).toBe(true)
    await expect.poll(() => writesTo(ledger, 'user_interactions').length).toBeGreaterThan(0)
    const dismiss = writesTo(ledger, 'user_interactions').at(-1)
    expect(JSON.stringify(dismiss.body)).toContain('dismiss')
    expect(JSON.stringify(dismiss.body)).toContain('briefing')
    // polite announcement of the new pick + a fresh active impression
    await expect(status(page, /New briefing pick:/)).toHaveCount(1)
    expect(writesTo(ledger, 'recommendation_impressions').some(w => bodyIncludes(w, 'briefing_active'))).toBe(true)

    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors).toEqual([])
  })

  // ── Test D — Save success + failure ───────────────────────────────────────────
  test('D — Save success then failure', async ({ page }) => {
    const errors = attachGuards(page)
    const ledger = await installHomeFixture(page)
    await gotoHome(page, ledger)

    await btn(page, 'Save').click()
    await expect.poll(() => writesTo(ledger, 'user_watchlist').length).toBeGreaterThan(0)
    const wl = writesTo(ledger, 'user_watchlist').at(-1)
    expect(JSON.stringify(wl.body)).toContain('mood_recommendation')
    await expect(btn(page, 'Saved')).toHaveAttribute('aria-pressed', 'true')
    await expect(status(page, /Saved for later\./)).toHaveCount(1)
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors).toEqual([])
  })

  test('D2 — Save failure stays retryable + announces', async ({ page }) => {
    const errors = attachGuards(page, ['[toggleWatchlist]', 'Failed to load resource'])
    const ledger = await installHomeFixture(page, { writeFailures: ['watchlist'] })
    await gotoHome(page, ledger)
    const before = await pickText(page)

    await btn(page, 'Save').click()
    await expect.poll(() => writesTo(ledger, 'user_watchlist').length).toBeGreaterThan(0)
    await expect(status(page, /Could not save\. Try again\./)).toHaveCount(1)
    await expect(pick(page)).toHaveText(before)           // pick unchanged
    await expect(btn(page, 'Save')).toBeVisible()          // reverted, not "Saved"
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors).toEqual([])
  })

  // ── Test E — Mark Watched success + failure ───────────────────────────────────
  test('E — Mark Watched waits for write then promotes', async ({ page }) => {
    const errors = attachGuards(page)
    const ledger = await installHomeFixture(page)
    await gotoHome(page, ledger)
    const first = await pickText(page)

    await btn(page, 'Mark Watched').click()
    await expect.poll(() => writesTo(ledger, 'user_history').some(w => bodyIncludes(w, 'mood_recommendation'))).toBe(true)
    // after the write + the 600ms hold, the next tender pick promotes
    await expect(pick(page)).not.toHaveText(first, { timeout: 10_000 })
    expect(TENDER).toContain(await pickText(page))
    await expect(status(page, /Marked watched\. New briefing pick:/)).toHaveCount(1)
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors).toEqual([])
  })

  test('E2 — Mark Watched failure keeps the pick + retryable', async ({ page }) => {
    const errors = attachGuards(page, ['[toggleWatched]', 'Failed to load resource'])
    const ledger = await installHomeFixture(page, { writeFailures: ['history'] })
    await gotoHome(page, ledger)
    const first = await pickText(page)

    await btn(page, 'Mark Watched').click()
    await expect.poll(() => writesTo(ledger, 'user_history').some(w => bodyIncludes(w, 'mood_recommendation'))).toBe(true)
    await expect(status(page, /Could not mark watched\. Try again\./)).toHaveCount(1)
    await expect(pick(page)).toHaveText(first)            // did not advance
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors).toEqual([])
  })

  // ── Test F — QuickLog success + failure ───────────────────────────────────────
  test('F — QuickLog logs a seen film + removes the tile', async ({ page }) => {
    const errors = attachGuards(page)
    const ledger = await installHomeFixture(page)
    await gotoHome(page, ledger)

    const title = SEEN_TITLES[0]
    const tile = btn(page, `Mark ${title} as watched`)
    await expect(tile).toBeVisible()
    ledger.resetWrites()
    await tile.click()
    await expect.poll(() => writesTo(ledger, 'user_history').some(w => bodyIncludes(w, 'home_quicklog'))).toBe(true)
    const hist = writesTo(ledger, 'user_history').find(w => bodyIncludes(w, 'home_quicklog'))
    const row = Array.isArray(hist.body) ? hist.body[0] : hist.body
    expect(row.source).toBe('home_quicklog')
    expect(row.watch_duration_minutes).toBeNull()
    expect(row.mood_session_id).toBeNull()
    await expect(status(page, new RegExp(`Logged ${title} as watched\\.`))).toHaveCount(1)
    await expect(btn(page, `Mark ${title} as watched`)).toHaveCount(0, { timeout: 5_000 }) // removed after 650ms hold
    await expect(btn(page, `Mark ${SEEN_TITLES[1]} as watched`)).toBeVisible() // others remain
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors).toEqual([])
  })

  test('F2 — QuickLog failure keeps the tile + announces retry', async ({ page }) => {
    const errors = attachGuards(page, ['[SeenTile]', 'Failed to load resource'])
    const ledger = await installHomeFixture(page, { writeFailures: ['quicklog'] })
    await gotoHome(page, ledger)

    const title = SEEN_TITLES[0]
    await btn(page, `Mark ${title} as watched`).click()
    await expect.poll(() => writesTo(ledger, 'user_history').some(w => bodyIncludes(w, 'home_quicklog'))).toBe(true)
    await expect(status(page, new RegExp(`Could not log ${title}\\. Try again\\.`))).toHaveCount(1)
    await expect(btn(page, `Mark ${title} as watched`)).toBeVisible() // tile not removed
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors).toEqual([])
  })

  // ── Test G — provider states ──────────────────────────────────────────────────
  for (const [state, assertFn] of [
    ['found', async (page) => { await expect(page.getByText('Mock Stream')).toBeVisible(); await expect(page.getByAltText('Mock Stream logo')).toBeVisible() }],
    ['empty', async (page) => { await expect(page.getByText('Availability not found')).toBeVisible(); await expect(page.getByText('Availability unavailable')).toHaveCount(0) }],
    ['error', async (page) => { await expect(page.getByText('Availability unavailable')).toBeVisible(); await expect(page.getByText(/tmdb|500|status_message/i)).toHaveCount(0) }],
  ]) {
    test(`G — provider ${state}`, async ({ page }) => {
      // the error state deliberately makes the mocked TMDB call reject → the browser
      // logs a benign resource/TMDb error (the product's honest "unavailable" copy).
      const errors = attachGuards(page, state === 'error' ? ['Failed to load resource', 'TMDb', '[TMDb]'] : [])
      const ledger = await installHomeFixture(page, { providerState: state })
      await gotoHome(page, ledger)
      await assertFn(page)
      expect(ledger.unexpectedRequests).toEqual([])
      expect(errors).toEqual([])
    })
  }

  // ── Test H — HomeData load error ──────────────────────────────────────────────
  test('H — honest load-error state, no Briefing/impression', async ({ page }) => {
    const errors = attachGuards(page, ['[useHomeData]'])
    const ledger = await installHomeFixture(page, { dataState: 'load_error' })
    await page.goto('/home')
    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible({ timeout: 20_000 })
    await expect(alert).toContainText("We couldn’t load your home briefing.")
    await expect(alert).toContainText('Try refreshing in a moment.')
    await expect(page.getByText(/PostgREST|relation|_mock|stack/i)).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0) // no Briefing/QuickLog
    expect(ledger.writes.some(w => bodyIncludes(w, 'briefing_active'))).toBe(false) // no hero impression
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors).toEqual([])
  })

  // ── Test I — keyboard + reduced motion + axe ──────────────────────────────────
  test('I — keyboard reachable + reduced motion + axe clean', async ({ page }) => {
    const errors = attachGuards(page)
    const ledger = await installHomeFixture(page, { reducedMotion: true })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page, ledger)

    // each key control is focusable
    for (const name of ['Open Film File', 'Mark Watched', 'Save', 'Not tonight', 'Tender', 'Open Discover']) {
      const el = name === 'Tender' ? moodPill(page, name) : btn(page, name)
      await el.focus()
      await expect(el).toBeFocused()
    }
    // a QuickLog tile + Open Browse are focusable
    await btn(page, `Mark ${SEEN_TITLES[0]} as watched`).focus()
    await expect(btn(page, `Mark ${SEEN_TITLES[0]} as watched`)).toBeFocused()
    await btn(page, 'Open Browse').focus()
    await expect(btn(page, 'Open Browse')).toBeFocused()
    // keyboard mood selection works
    await moodPill(page, 'Cozy').focus()
    await page.keyboard.press('Enter')
    await expect(pick(page)).toHaveText('The Long Quiet')

    // axe — no serious/critical (excluding the project's color-contrast policy)
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const blocking = violations.filter(v => ['serious', 'critical'].includes(v.impact) && v.id !== 'color-contrast')
    expect(blocking, JSON.stringify(blocking.map(v => v.id))).toEqual([])

    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors).toEqual([])
  })
})
