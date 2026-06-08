import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { installDiscoverFixture } from '../fixtures/discover.js'

// Authenticated, fully-intercepted Discover journey. The dev user is signed in for
// real (Supabase /auth/v1 passes through); every Discover read/write is mocked, so
// no Discover row reaches the backend. See e2e/fixtures/discover.js.

// Benign dev-mode noise we deliberately ignore. The Vite HMR WebSocket cannot
// connect in the Playwright env (no HMR socket) — these never occur in the
// production build the user actually runs.
const BENIGN = [
  'Download the React DevTools',
  'React Router Future Flag',
  '[vite]',
  'Sentry',
  'PostHog',
  'posthog',
  '@vite/client',
  'WebSocket',
  'Vite server',
  'ERR_CONNECTION_REFUSED',
]

function attachGuards(page, extraAllow = []) {
  const errors = []
  const benign = (t) => [...BENIGN, ...extraAllow].some((b) => t.includes(b))
  page.on('pageerror', (e) => { if (!benign(e.message)) errors.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const t = m.text()
    if (!benign(t)) errors.push(`console.error: ${t}`)
  })
  return errors
}

const moodButton = (page, label) => page.locator(`button:has(.ff-mood-label:text-is("${label}"))`)
const continueBtn = (page) => page.getByRole('button', { name: /^continue/i })
const findFilmBtn = (page) => page.getByRole('button', { name: /find my film/i })
const nightHeading = (page) => page.getByRole('heading', { name: 'A few details, already filled in.' })
const titleHeading = (page, name) => page.getByRole('heading', { level: 1, name })
const liveStatus = (page) => page.getByRole('status')
const prefWrites = (ledger) => ledger.writes.filter((w) => w.table === 'user_discover_preferences')
const writesTo = (ledger, table) => ledger.writes.filter((w) => w.table === table)
// Discover user-action writes (excludes the profile-cache + session bookkeeping infra writes).
const actionWrites = (ledger) =>
  ledger.writes.filter((w) => ['user_discover_preferences', 'user_watchlist', 'user_history'].includes(w.table))

// Walk Mood → NightContext → Find my film → (resolve) → StagePick. Returns the ledger.
async function reachResult(page, ledger, { mood = 'Tender' } = {}) {
  await page.goto('/discover')
  await expect(moodButton(page, mood)).toBeVisible({ timeout: 20_000 })
  await moodButton(page, mood).click()
  await continueBtn(page).click()
  await expect(nightHeading(page)).toBeVisible()
  await findFilmBtn(page).click()
  // StageResolve → StagePick (≤900ms). The one-pick title is the signal.
  await expect(page.locator('.ff-pick-eyebrow').first()).toBeVisible({ timeout: 10_000 })
}

test.describe('Discover — authenticated, intercepted', () => {
  test('A — complete happy path with no live writes', async ({ page }) => {
    const ledger = await installDiscoverFixture(page)
    const errors = attachGuards(page)

    await page.goto('/discover')
    await expect(page).toHaveURL(/\/discover(?:[/?#]|$)/)

    // MoodStage is first; no old hero / Surprise Me.
    await expect(page.getByRole('heading', { name: /shape.*of your mood/i })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /surprise me/i })).toHaveCount(0)
    await expect(page.getByText(/How do you feel\?/i)).toHaveCount(0)
    expect(actionWrites(ledger)).toHaveLength(0)

    // Select one mood → Continue → NightContext summary.
    await moodButton(page, 'Tender').click()
    await continueBtn(page).click()
    await expect(nightHeading(page)).toBeVisible()
    await expect(findFilmBtn(page)).toBeVisible()
    expect(prefWrites(ledger)).toHaveLength(0)

    // Open + change one optional detail → still no preference write.
    await page.getByRole('button', { name: /adjust details/i }).click()
    await page.getByRole('button', { name: /Make me think/ }).click()
    expect(prefWrites(ledger)).toHaveLength(0)

    // Find my film → exactly one preference upsert, then resolve → one pick.
    await findFilmBtn(page).click()
    await expect(page.locator('.ff-pick-eyebrow').first()).toBeVisible({ timeout: 10_000 })
    expect(prefWrites(ledger)).toHaveLength(1)
    expect(prefWrites(ledger)[0].body).toMatchObject({ total_commits: 1 })

    // One film only.
    await expect(titleHeading(page, 'The Quiet Hour')).toBeVisible()
    await expect(page.getByText('After the Rain')).toHaveCount(0)
    await expect(page.getByText('Long Shadows')).toHaveCount(0)

    // No alternates / queue / Mood fit / Taste %.
    await expect(page.getByText(/Or pick from these|more queued|Mood fit/i)).toHaveCount(0)
    await expect(page.getByText(/%\s*taste/i)).toHaveCount(0)

    // Honest case + keyboard-reachable actions.
    await expect(page.getByText('Why this one')).toBeVisible()
    await expect(page.getByRole('group', { name: 'Film actions' })).toBeVisible()

    // No write escaped; no unexpected console/page errors.
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('B — controlled Not tonight progression', async ({ page }) => {
    const ledger = await installDiscoverFixture(page)
    const errors = attachGuards(page)
    await reachResult(page, ledger)

    await expect(titleHeading(page, 'The Quiet Hour')).toBeVisible()
    ledger.resetWrites()
    await page.getByRole('button', { name: 'Not tonight' }).click()

    // Film Two promotes; Film One/Three are not the visible pick.
    await expect(titleHeading(page, 'After the Rain')).toBeVisible({ timeout: 10_000 })
    await expect(titleHeading(page, 'The Quiet Hour')).toHaveCount(0)
    await expect(page.getByText('Long Shadows')).toHaveCount(0)

    // The skip recorded a skipped impression (PATCH) + a dismiss interaction.
    await expect.poll(() => writesTo(ledger, 'recommendation_impressions').length).toBeGreaterThan(0)
    await expect.poll(() => writesTo(ledger, 'user_interactions').length).toBeGreaterThan(0)
    const dismiss = writesTo(ledger, 'user_interactions').some(
      (w) => w.body?.interaction_type === 'dismiss' || JSON.stringify(w.body).includes('not_tonight'))
    expect(dismiss).toBe(true)

    // Live status announces the new pick; nothing escaped.
    await expect(liveStatus(page)).toContainText('After the Rain')
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('C — Save and Mark Watched write payloads (intercepted, no live writes)', async ({ page }) => {
    const ledger = await installDiscoverFixture(page)
    const errors = attachGuards(page)
    await reachResult(page, ledger)
    await expect(titleHeading(page, 'The Quiet Hour')).toBeVisible()
    const row = (w) => (Array.isArray(w.body) ? w.body[0] : w.body)

    // Save for later → watchlist insert, button confirms, live region announces.
    await page.getByRole('button', { name: 'Save for later' }).click()
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: 10_000 })
    await expect.poll(() => writesTo(ledger, 'user_watchlist').length).toBeGreaterThan(0)
    expect(row(writesTo(ledger, 'user_watchlist')[0])).toMatchObject({ movie_id: 9001 })
    await expect(liveStatus(page)).toContainText('Saved for later.')

    // Already watched → history insert (discover_marked), confirms, then promotes.
    await page.getByRole('button', { name: 'Already watched' }).click()
    await expect(page.getByRole('button', { name: 'Watched' })).toBeVisible({ timeout: 10_000 })
    await expect.poll(() => writesTo(ledger, 'user_history').length).toBeGreaterThan(0)
    expect(row(writesTo(ledger, 'user_history')[0])).toMatchObject({ movie_id: 9001, source: 'discover_marked' })
    await expect(titleHeading(page, 'After the Rain')).toBeVisible({ timeout: 10_000 })
    await expect(liveStatus(page)).toContainText('Marked watched')

    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })

  for (const { source, note } of [
    { source: 'live_error', note: 'live recommendations are unavailable right now.' },
    { source: 'live_empty', note: 'live recommendations are not ready yet.' },
    { source: 'filtered_empty', note: 'no strong live fit for these details.' },
  ]) {
    test(`D — fallback truth: ${source}`, async ({ page }) => {
      const ledger = await installDiscoverFixture(page, { source })
      // live_error deliberately makes the candidate query throw; useDiscoverData's
      // catch logs '[useDiscoverData] …' by design — expected, not a defect.
      const errors = attachGuards(page, source === 'live_error' ? ['[useDiscoverData]'] : [])
      await reachResult(page, ledger)

      // Reason-aware fallback note + one example pick. (live_error settles the
      // dataSource a beat after the fallback pick mounts, so allow extra time.)
      await expect(page.getByText(`Example pick — ${note}`)).toBeVisible({ timeout: 20_000 })
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      // No raw error / secret / query text leaks.
      await expect(page.getByText(/supabase|postgres|rest\/v1|stack|undefined is not|TypeError/i)).toHaveCount(0)
      // Action surface remains usable.
      await expect(page.getByRole('group', { name: 'Film actions' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Not tonight' })).toBeEnabled()

      expect(ledger.unexpectedRequests).toEqual([])
      expect(errors, errors.join('\n')).toEqual([])
    })
  }

  test('E — reduced motion goes straight to the result', async ({ page }) => {
    const ledger = await installDiscoverFixture(page, { reducedMotion: true })
    const errors = attachGuards(page)
    await page.goto('/discover')
    await moodButton(page, 'Tender').click()
    await continueBtn(page).click()
    await expect(nightHeading(page)).toBeVisible()
    await findFilmBtn(page).click()
    // No forced 900ms dwell — the pick appears promptly.
    await expect(titleHeading(page, 'The Quiet Hour')).toBeVisible({ timeout: 4_000 })

    // No serious/critical a11y violation excluding the documented color-contrast policy.
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const blocking = violations.filter((v) => ['serious', 'critical'].includes(v.impact) && v.id !== 'color-contrast')
    expect(blocking, JSON.stringify(blocking.map((v) => v.id))).toEqual([])
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('F — keyboard reachability + trailer dialog focus', async ({ page }) => {
    const ledger = await installDiscoverFixture(page)
    const errors = attachGuards(page)
    await reachResult(page, ledger)
    await expect(titleHeading(page, 'The Quiet Hour')).toBeVisible()

    // Open the trailer by keyboard.
    const trailer = page.getByRole('button', { name: /trailer/i })
    await trailer.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')

    // Initial focus enters the dialog (close button); Tab stays inside.
    await expect(page.getByRole('button', { name: 'Close trailer' })).toBeFocused()
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Shift+Tab')
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)

    // Escape closes and returns focus to the Trailer opener.
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trailer).toBeFocused()

    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })
})
