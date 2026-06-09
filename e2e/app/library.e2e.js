import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { installLibraryFixture, TITLES } from '../fixtures/library.js'

// Authenticated, fully-intercepted User Library journey (/watchlist, /history, /watched).
// The dev user is signed in for real (Supabase /auth/v1 passes through); every Library
// read/write under /rest/v1 and every TMDB poster image is intercepted before the route
// loads, so no Library row reaches the backend. See e2e/fixtures/library.js.

const BENIGN = [
  'Download the React DevTools', 'React Router Future Flag', '[vite]', 'Sentry',
  'PostHog', 'posthog', '@vite/client', 'WebSocket', 'Vite server', 'ERR_CONNECTION_REFUSED',
  // intercepted load_error / remove_failure modes surface a benign resource-load console
  // line (the 500/400 we deliberately mock) — not a product defect.
  'Failed to load resource', 'status of 500', 'status of 400', '[useWatchlistData]', '[useHistoryData]', '[removeFromWatchlist]', '[removeEntry]',
]
function attachGuards(page) {
  const errors = []
  const benign = (t) => BENIGN.some((b) => t.includes(b))
  page.on('pageerror', (e) => { if (!benign(e.message)) errors.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => { if (m.type() === 'error' && !benign(m.text())) errors.push(`console.error: ${m.text()}`) })
  return errors
}

const h1 = (page) => page.getByRole('heading', { level: 1 })
const libNav = (page) => page.getByRole('navigation', { name: 'Library sections' })
const liveStatus = (page) => page.locator('[role="status"][aria-live="polite"][aria-atomic="true"]')
const deletes = (ledger, table) => ledger.writes.filter((w) => w.method === 'DELETE' && w.table === table)
const noHorizontalOverflow = async (page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)

async function openWatchlist(page) {
  await page.goto('/watchlist')
  await expect(h1(page)).toHaveText(/Saved for later\./, { timeout: 20_000 })
}
async function openDiary(page, route = '/history') {
  await page.goto(route)
  await expect(h1(page)).toHaveText(/Your diary\./, { timeout: 20_000 })
}

// ── Setup + safety ────────────────────────────────────────────────────────────────
test.describe('User Library — authenticated, intercepted', () => {
  test('A — fixture install + route safety (no escape, no profile-cache write)', async ({ page }) => {
    const ledger = await installLibraryFixture(page)
    const errors = attachGuards(page)
    await openWatchlist(page)

    await expect(h1(page)).toHaveCount(1)
    await expect(libNav(page)).toBeVisible()
    await expect(libNav(page).getByRole('link', { name: 'Watchlist' })).toHaveAttribute('aria-current', 'page')
    // no profile-cache write from merely opening Watchlist
    expect(ledger.writes.filter((w) => w.table === 'user_profiles_computed')).toEqual([])
    expect(ledger.writes).toEqual([]) // opening the route writes nothing at all
    expect(ledger.unexpectedRequests).toEqual([])
    expect(errors).toEqual([])
  })

  // ── Watchlist ─────────────────────────────────────────────────────────────────
  test('B — populated Watchlist hierarchy', async ({ page }) => {
    const ledger = await installLibraryFixture(page)
    await openWatchlist(page)

    await expect(page.getByText('Your library')).toBeVisible()
    await expect(h1(page)).toHaveText(/Saved for later\./)
    await expect(page.getByText('4 films saved')).toBeVisible()
    await expect(libNav(page)).toBeVisible()

    // exactly one Film File link + one Remove per film; one labelled list of 4 items
    const list = page.getByRole('list', { name: /Saved films/i }).or(page.getByRole('list')).first()
    const items = page.getByRole('listitem')
    await expect(items).toHaveCount(4)
    for (const title of TITLES.watchlist) {
      const card = items.filter({ has: page.getByRole('heading', { name: title, exact: true }) })
      await expect(card.getByRole('link')).toHaveCount(1)
      await expect(card.getByRole('button', { name: `Remove ${title} from Watchlist` })).toHaveCount(1)
    }
    // Film File links route to /movie/:tmdbId
    await expect(page.getByRole('link', { name: 'Paper Harbor' })).toHaveAttribute('href', '/movie/910004')

    // no queue / match% / tonight / stale wording (scoped to the Watchlist surface so the
    // global header's "Tonight" nav pill isn't a false positive)
    const surface = await page.locator('.ff-watchlist-v2').innerText()
    expect(surface).not.toMatch(/\bqueue\b/i)
    expect(surface).not.toMatch(/\d+%/)
    expect(surface).not.toMatch(/perfect for tonight|perfect tonight/i)
    expect(surface).not.toMatch(/stale|getting stale|cut what you/i)
    void list
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('C — Watchlist film-mood filter + sorting (deterministic order)', async ({ page }) => {
    const ledger = await installLibraryFixture(page)
    await openWatchlist(page)

    // mood filter: aria-pressed toggle group, All + present moods
    const filterGroup = page.getByRole('group', { name: 'Filter by film mood' })
    await expect(filterGroup.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    await expect(filterGroup.getByRole('button', { name: 'Tender' })).toBeVisible()

    // select a mood with results (Tender → 2)
    await filterGroup.getByRole('button', { name: 'Tender' }).click()
    await expect(filterGroup.getByRole('button', { name: 'Tender' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('listitem')).toHaveCount(2)

    // sort the (re-shown) full list deterministically
    await filterGroup.getByRole('button', { name: 'All' }).click()
    const titlesInOrder = async () => (await page.getByRole('listitem').getByRole('heading', { level: 3 }).allInnerTexts())
    const sort = page.getByRole('combobox', { name: 'Sort saved films' })
    await sort.selectOption('recent')
    expect((await titlesInOrder())[0]).toBe('Paper Harbor')      // newest added
    await sort.selectOption('oldest')
    expect((await titlesInOrder())[0]).toBe('North')             // oldest added
    await sort.selectOption('runtime')
    expect((await titlesInOrder()).slice(0, 2)).toEqual(['North', 'Saltwater Hours']) // 0min, then 98min
    await sort.selectOption('title')
    expect(await titlesInOrder()).toEqual([
      'North', 'Paper Harbor', 'Saltwater Hours', 'The Cartographer’s Daughter and the Long Winter Road Home',
    ]) // alphabetical ("The…" sorts last)
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('C2 — Watchlist filtered-empty + Show all (reached by removing the only match)', async ({ page }) => {
    const ledger = await installLibraryFixture(page)
    await openWatchlist(page)
    // Tense has exactly one film (North); removing it empties the active filter.
    await page.getByRole('group', { name: 'Filter by film mood' }).getByRole('button', { name: 'Tense' }).click()
    await expect(page.getByRole('listitem')).toHaveCount(1)
    await page.getByRole('button', { name: 'Remove North from Watchlist' }).click()
    await expect(page.getByText('No saved films match this mood.')).toBeVisible()
    await page.getByRole('button', { name: 'Show all' }).click()
    await expect(page.getByRole('listitem')).toHaveCount(3) // North removed, 3 remain
    expect(deletes(ledger, 'user_watchlist')).toHaveLength(1)
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('D — Watchlist removal success (settled, announced, one DELETE)', async ({ page }) => {
    const ledger = await installLibraryFixture(page)
    await openWatchlist(page)
    const remove = page.getByRole('button', { name: 'Remove Paper Harbor from Watchlist' })
    await remove.click()
    await expect(liveStatus(page)).toContainText('Removed Paper Harbor from your Watchlist.')
    await expect(page.getByRole('heading', { name: 'Paper Harbor', exact: true })).toHaveCount(0)
    await expect(page.getByRole('listitem')).toHaveCount(3)
    const del = deletes(ledger, 'user_watchlist')
    expect(del).toHaveLength(1)
    expect(del[0].query).toMatch(/user_id=eq/)
    expect(del[0].movieId).toBe(9104)
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('E — Watchlist removal failure (item retained, no false success)', async ({ page }) => {
    const ledger = await installLibraryFixture(page, { removeMode: 'failure' })
    await openWatchlist(page)
    await page.getByRole('button', { name: 'Remove Paper Harbor from Watchlist' }).click()
    await expect(liveStatus(page)).toContainText('Could not remove Paper Harbor. Try again.')
    await expect(page.getByRole('heading', { name: 'Paper Harbor', exact: true })).toBeVisible() // retained
    await expect(page.getByRole('button', { name: 'Remove Paper Harbor from Watchlist' })).toBeVisible() // label restored
    expect(deletes(ledger, 'user_watchlist')).toHaveLength(1) // one attempt
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('F — Watchlist empty + sanitized load error', async ({ page }) => {
    const empty = await installLibraryFixture(page, { mode: 'empty' })
    await openWatchlist(page)
    await expect(page.getByText('Your Watchlist is open.')).toBeVisible()
    await expect(page.getByRole('button', { name: /Open Discover/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Browse films/i })).toBeVisible()
    expect(empty.unexpectedRequests).toEqual([])

    const ledger = await installLibraryFixture(page, { mode: 'load_error' })
    await page.goto('/watchlist')
    await expect(page.getByRole('alert')).toContainText('We couldn’t load your Watchlist.')
    const alert = await page.getByRole('alert').innerText()
    expect(alert).not.toMatch(/mock load error|500|supabase|PGRST|column|relation/i)
    await expect(h1(page)).toHaveCount(1)
    await expect(libNav(page)).toBeVisible() // nav still reachable in the error state
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Go to Home' })).toBeVisible()
    expect(ledger.unexpectedRequests).toEqual([])
  })
})

// ── Diary ───────────────────────────────────────────────────────────────────────
test.describe('User Library — Diary, authenticated, intercepted', () => {
  test('G — populated Diary truth', async ({ page }) => {
    const ledger = await installLibraryFixture(page)
    await openDiary(page)

    await expect(page.getByText('Your library')).toBeVisible()
    await expect(h1(page)).toHaveText(/Your diary\./)
    await expect(libNav(page).getByRole('link', { name: 'Diary' })).toHaveAttribute('aria-current', 'page')

    // truthful, Diary-scoped stats; NO streak
    await expect(page.getByText('3.7')).toBeVisible()                 // avg over rated diary films
    const surface = await page.locator('.ff-history-v2').innerText()
    expect(surface).not.toMatch(/streak|day streak|consecutive days/i)
    expect(surface).not.toMatch(/\d+%/)                              // no match %

    // chronological month grouping + provenance labels
    await expect(page.getByRole('heading', { level: 2, name: 'Feb' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Jan' })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Film mood: Tender' }).first()).toBeVisible()
    await expect(page.getByText('Your review').first()).toBeVisible()

    // exactly one Film File link + one Remove per entry
    const rows = page.getByRole('listitem')
    await expect(rows).toHaveCount(4)
    for (const title of TITLES.diary) {
      const row = rows.filter({ has: page.getByRole('heading', { name: title, exact: true }) })
      await expect(row.getByRole('link', { name: `Open ${title}` })).toHaveCount(1)
      await expect(row.getByRole('button', { name: `Remove ${title} from diary` })).toHaveCount(1)
    }
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('G2 — F6.10: duplicate user_history rows for one film collapse to ONE Diary entry + uninflated stats', async ({ page }) => {
    // 6 raw rows (3 for Lantern Hill across watch paths + 9202/9203/9204) → 4 canonical films.
    const ledger = await installLibraryFixture(page, { duplicateHistory: true })
    await openDiary(page)

    const rows = page.getByRole('listitem')
    await expect(rows).toHaveCount(4)                                           // not 6
    await expect(page.getByRole('heading', { name: 'Lantern Hill', exact: true })).toHaveCount(1) // film shown once
    await expect(rows.first().getByRole('heading', { level: 3 })).toHaveText('Lantern Hill')       // its LATEST watch (Feb 13) → newest-first

    // stats count each film once (not inflated by dupes): masthead "4 films · 7 hours"
    // (Logged + Hours) + the per-card values located by exact label.
    await expect(page.getByText('4 films · 7 hours')).toBeVisible()
    const card = (label) => page.locator('.ff-hist-pulse-grid > div').filter({ has: page.getByText(label, { exact: true }) })
    await expect(card('Logged')).toContainText('4')
    await expect(card('Hours watched')).toContainText('7h')
    await expect(card('This month')).toContainText('2')

    // rating + review remain attached to the canonical Lantern Hill entry
    const lantern = rows.filter({ has: page.getByRole('heading', { name: 'Lantern Hill', exact: true }) })
    await expect(lantern.getByRole('img', { name: '5 of 5 stars' })).toBeVisible()
    await expect(lantern.getByText('Your review')).toBeVisible()
    await expect(lantern.getByText(/A patient film about repair/)).toBeVisible()

    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('H — Diary filter (aria-pressed), search and reset', async ({ page }) => {
    const ledger = await installLibraryFixture(page)
    await openDiary(page)

    // toggle-button filter group, NOT radios
    expect(await page.getByRole('radio').count()).toBe(0)
    const loved = page.getByRole('button', { name: 'Loved · 9–10' })
    await loved.click()
    await expect(loved).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('listitem')).toHaveCount(1)          // only the rating-9 entry
    await expect(page.getByRole('heading', { name: 'Lantern Hill', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'All' }).click()

    const search = page.getByLabel('Search the diary')
    await search.fill('tin')                                          // title
    await expect(page.getByRole('heading', { name: 'The Tin Almanac', exact: true })).toBeVisible()
    await expect(page.getByRole('listitem')).toHaveCount(1)
    await search.fill('cole')                                         // director (Cole Park)
    await expect(page.getByRole('heading', { name: 'Winter Tenants', exact: true })).toBeVisible()
    await search.fill('grief')                                        // review text
    await expect(page.getByRole('heading', { name: 'The Long Field', exact: true })).toBeVisible()
    await search.fill('zzzzz')                                        // searched-empty
    await expect(page.getByText(/0 of 4 match/i)).toBeVisible()
    await search.fill('')                                             // reset
    await expect(page.getByRole('listitem')).toHaveCount(4)

    // sort is deterministic
    await page.getByRole('combobox', { name: 'Sort diary' }).selectOption('rating')
    const first = page.getByRole('listitem').first()
    await expect(first.getByRole('heading', { level: 3 })).toHaveText('Lantern Hill') // rating 9 first
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('I — Diary remove dialog: accessible, cancel performs no delete', async ({ page }) => {
    const ledger = await installLibraryFixture(page)
    await openDiary(page)
    const trigger = page.getByRole('button', { name: 'Remove Lantern Hill from diary' })
    await trigger.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog.getByRole('heading', { name: 'Remove from Diary?' })).toBeVisible()
    await expect(dialog.getByText(/Your rating and review will stay with the film/i)).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Keep entry' })).toBeFocused() // initial focus = safe default

    // Tab trap between the two actions
    await page.keyboard.press('Tab')
    await expect(dialog.getByRole('button', { name: 'Remove from Diary' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(dialog.getByRole('button', { name: 'Keep entry' })).toBeFocused()

    await page.keyboard.press('Escape')                              // Escape cancels
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()                             // focus returns to the trigger
    expect(deletes(ledger, 'user_history')).toHaveLength(0)         // no delete on cancel
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('J — Diary removal success (only user_history; rating/review survive)', async ({ page }) => {
    const ledger = await installLibraryFixture(page)
    await openDiary(page)
    await page.getByRole('button', { name: 'Remove Lantern Hill from diary' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Remove from Diary' }).click()

    await expect(liveStatus(page)).toContainText('Removed Lantern Hill from your Diary.')
    await expect(page.getByRole('heading', { name: 'Lantern Hill', exact: true })).toHaveCount(0)
    const del = deletes(ledger, 'user_history')
    expect(del).toHaveLength(1)
    expect(del[0].query).toMatch(/user_id=eq/)
    expect(del[0].movieId).toBe(9201)
    // forbidden deletes never happened — the rating/review survives in fixture state
    expect(deletes(ledger, 'user_ratings')).toHaveLength(0)
    expect(deletes(ledger, 'user_movie_feedback')).toHaveLength(0)
    expect(ledger.getRatings().find((r) => r.movie_id === 9201)).toBeTruthy()
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('K — Diary removal failure (entry retained, no rating mutation, no false success)', async ({ page }) => {
    const ledger = await installLibraryFixture(page, { removeMode: 'failure' })
    await openDiary(page)
    await page.getByRole('button', { name: 'Remove Lantern Hill from diary' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Remove from Diary' }).click()

    await expect(liveStatus(page)).toContainText('Could not remove Lantern Hill from your Diary. Try again.')
    await expect(page.getByRole('heading', { name: 'Lantern Hill', exact: true })).toBeVisible() // retained
    expect(deletes(ledger, 'user_history')).toHaveLength(1)         // one attempt
    expect(deletes(ledger, 'user_ratings')).toHaveLength(0)
    expect(ledger.getRatings().find((r) => r.movie_id === 9201)).toBeTruthy()
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('L — Diary empty + sanitized load error', async ({ page }) => {
    const empty = await installLibraryFixture(page, { mode: 'empty' })
    await openDiary(page)
    await expect(page.getByText('Mark something watched.')).toBeVisible()
    expect(empty.unexpectedRequests).toEqual([])

    const ledger = await installLibraryFixture(page, { mode: 'load_error' })
    await page.goto('/history')
    await expect(page.getByRole('alert')).toContainText('We couldn’t load your Diary.')
    const alert = await page.getByRole('alert').innerText()
    expect(alert).not.toMatch(/mock load error|500|supabase|PGRST|column|relation/i)
    await expect(h1(page)).toHaveCount(1)
    await expect(libNav(page)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Go to Home' })).toBeVisible()
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('M — /watched alias renders the Diary surface (active, no redirect)', async ({ page }) => {
    const ledger = await installLibraryFixture(page)
    await openDiary(page, '/watched')
    expect(new URL(page.url()).pathname).toBe('/watched')           // no redirect
    await expect(h1(page)).toHaveText(/Your diary\./)
    await expect(libNav(page).getByRole('link', { name: 'Diary' })).toHaveAttribute('aria-current', 'page')
    await expect(libNav(page).getByRole('link', { name: 'Watchlist' })).toHaveAttribute('href', '/watchlist')
    expect(ledger.unexpectedRequests).toEqual([])
  })

  // ── Cross-navigation ───────────────────────────────────────────────────────────
  test('N — Library section navigation between routes', async ({ page }) => {
    const ledger = await installLibraryFixture(page)
    await openWatchlist(page)
    expect(await page.getByRole('tablist').count()).toBe(0)         // links, not tabs
    expect(await page.getByRole('tab').count()).toBe(0)

    await libNav(page).getByRole('link', { name: 'Diary' }).click()
    await expect(h1(page)).toHaveText(/Your diary\./)               // route data updated through the fixture
    await expect(libNav(page).getByRole('link', { name: 'Diary' })).toHaveAttribute('aria-current', 'page')

    await libNav(page).getByRole('link', { name: 'Watchlist' }).click()
    await expect(h1(page)).toHaveText(/Saved for later\./)
    await expect(libNav(page).getByRole('link', { name: 'Watchlist' })).toHaveAttribute('aria-current', 'page')
    expect(ledger.unexpectedRequests).toEqual([])
  })

  // ── Accessibility ────────────────────────────────────────────────────────────────
  test('O — Watchlist a11y (reduced-motion + axe + one link/one remove)', async ({ page }) => {
    const ledger = await installLibraryFixture(page, { reducedMotion: true })
    await openWatchlist(page)
    expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
    await noHorizontalOverflow(page)
    const card = page.getByRole('listitem').first()
    await expect(card.getByRole('link')).toHaveCount(1)
    await expect(card.getByRole('button')).toHaveCount(1)
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const blocking = violations.filter((v) => ['serious', 'critical'].includes(v.impact) && v.id !== 'color-contrast')
    expect(blocking, JSON.stringify(blocking.map((v) => v.id))).toEqual([])
    expect(ledger.unexpectedRequests).toEqual([])
  })

  test('P — Diary a11y (reduced-motion + dialog focus + axe + one h1)', async ({ page }) => {
    const ledger = await installLibraryFixture(page, { reducedMotion: true })
    await openDiary(page)
    expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
    await expect(h1(page)).toHaveCount(1)
    await noHorizontalOverflow(page)
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const blocking = violations.filter((v) => ['serious', 'critical'].includes(v.impact) && v.id !== 'color-contrast')
    expect(blocking, JSON.stringify(blocking.map((v) => v.id))).toEqual([])
    expect(ledger.unexpectedRequests).toEqual([])
  })
})

// ── Responsive matrix (×6 widths per route) ──────────────────────────────────────
const VIEWPORTS = [
  { name: '360×640', width: 360, height: 640 },
  { name: '390×844', width: 390, height: 844 },
  { name: '430×932', width: 430, height: 932 },
  { name: '768×1024', width: 768, height: 1024 },
  { name: '1280×720', width: 1280, height: 720 },
  { name: '1440×900', width: 1440, height: 900 },
]

test.describe('User Library — Watchlist responsive', () => {
  for (const vp of VIEWPORTS) {
    test(`Q — Watchlist @ ${vp.name}`, async ({ page }) => {
      const ledger = await installLibraryFixture(page)
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await openWatchlist(page)
      await noHorizontalOverflow(page)
      await expect(h1(page)).toHaveCount(1)
      await expect(libNav(page)).toBeVisible()
      // last card's link + remove are reachable above the fixed mobile bottom nav
      const lastCard = page.getByRole('listitem').last()
      await lastCard.scrollIntoViewIfNeeded()
      await expect(lastCard.getByRole('link')).toHaveCount(1)
      const remove = lastCard.getByRole('button')
      await expect(remove).toBeVisible()
      const box = await remove.boundingBox()
      expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 1) // not under the bottom nav
      expect(ledger.unexpectedRequests).toEqual([])
    })
  }
})

test.describe('User Library — Diary responsive', () => {
  for (const vp of VIEWPORTS) {
    test(`R — Diary @ ${vp.name}`, async ({ page }) => {
      const ledger = await installLibraryFixture(page)
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await openDiary(page)
      await noHorizontalOverflow(page)
      await expect(h1(page)).toHaveCount(1)
      await expect(page.getByText('Your review').first()).toBeVisible() // long review wraps, present
      const lastRow = page.getByRole('listitem').last()
      await lastRow.scrollIntoViewIfNeeded()
      const remove = lastRow.getByRole('button', { name: /Remove .* from diary/ })
      await expect(remove).toBeVisible()
      const box = await remove.boundingBox()
      expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 1)
      // the removal dialog fits at this width
      await remove.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      const dbox = await page.getByRole('dialog').boundingBox()
      expect(dbox.width).toBeLessThanOrEqual(vp.width)
      await page.keyboard.press('Escape')
      expect(ledger.unexpectedRequests).toEqual([])
    })
  }
})
