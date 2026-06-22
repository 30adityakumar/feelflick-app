import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { installPeopleFixture } from '../fixtures/people.js'

// Authenticated, fully-intercepted E2E for /people. Proves the F8.2–F8.7 contracts work together in a
// real browser: no cross-user behavioral reads, identity via the narrow RPCs, qualitative bands (no
// exact %), no friendship language, settled Follow/Unfollow, session-local Hide, honest empty/degraded
// states, accessible controls + live announcements + focus recovery, contrast-hardened labels and a
// responsive layout. Every People request is mocked by the fail-closed fixture — no live data is touched.

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const VIEWPORTS = [
  { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 430, height: 932 },
  { width: 768, height: 1024 }, { width: 1280, height: 720 }, { width: 1440, height: 900 },
]

const h1 = (page) => page.getByRole('heading', { level: 1 })
const status = (page) => page.getByRole('status')
const followControl = (page, name) => page.getByRole('button', { name: new RegExp(`^(Follow|Unfollow) ${name}`) })
const hideControl = (page, name) => page.getByRole('button', { name: `Hide ${name} from your suggestions` })

async function openPeople(page) {
  await page.goto('/people')
  await expect(h1(page)).toBeVisible({ timeout: 20_000 })
  await expect(h1(page)).toHaveText(/taste matches/i)
}

test.describe('People — authenticated, intercepted', () => {
  // ── A. current product shape ──────────────────────────────────────────────────────────────
  test('A — renders the current People shape, with none of the removed surfaces', async ({ page }) => {
    const ledger = await installPeopleFixture(page)
    await openPeople(page)

    await expect(h1(page)).toHaveCount(1)
    // heading-labelled regions (F8.7)
    await expect(page.getByRole('region', { name: /People who get it/i })).toBeVisible()
    await expect(page.getByRole('region', { name: /More people to discover/i })).toBeVisible()
    await expect(page.getByRole('region', { name: /People you might know/i })).toBeVisible()
    // search + a follow control + a hide control
    await expect(page.getByRole('searchbox', { name: 'Search people by name' })).toBeVisible()
    await expect(followControl(page, 'Ana Okafor')).toBeVisible()
    await expect(hideControl(page, 'Ana Okafor')).toBeVisible()
    // a followed user shows the Following (Unfollow) control, no Hide
    await expect(page.getByRole('button', { name: /^Unfollow Fin Adeyemi/ })).toBeVisible()
    await expect(hideControl(page, 'Fin Adeyemi')).toHaveCount(0)

    const body = (await page.locator('body').innerText()).toLowerCase()
    // removed F8.5 sections (the masthead subtitle's "film activity" is legit F8.3 copy, not the rail)
    expect(body).not.toMatch(/crew overlap|popular on feelflick|what your circle|what your twins|shared lineage|directors you share|on the rise/)
    expect(body).not.toMatch(/\d+%\s*match|\bmatch\b\s*\d+%/) // no exact % match
    expect(body).not.toMatch(/\bfriends? whose|taste twins?\b/) // no friendship language for algorithmic matches
    // no dead cross-user profile links
    expect(await page.locator('a[href^="/profile/"]').count()).toBe(0)
    expect(ledger.unexpectedRequests).toEqual([])
    expect(ledger.forbiddenReads).toEqual([])
  })

  // ── B. privacy request boundary ───────────────────────────────────────────────────────────
  test('B — privacy boundary: identity/taste via narrow RPCs, zero cross-user behavioral reads', async ({ page }) => {
    const ledger = await installPeopleFixture(page)
    await openPeople(page)
    await expect(followControl(page, 'Ana Okafor')).toBeVisible() // wait for the provider to settle

    // no cross-user behavioral read, no retired view, no direct users table read
    expect(ledger.forbiddenReads, JSON.stringify(ledger.forbiddenReads)).toEqual([])
    expect(ledger.reads.map(r => r.table)).not.toContain('users')
    // identity + taste + (conditional) FOF go through the RPCs
    expect(ledger.rpcsFor('get_people_public_identities').length).toBeGreaterThan(0)
    expect(ledger.rpcsFor('get_discoverable_taste_profiles').length).toBeGreaterThan(0)
    // the similarity read carried numbers only — no embedded users() join in the select
    const sim = ledger.reads.find(r => r.table === 'user_similarity')
    expect(sim).toBeTruthy()
    expect(sim.query).not.toMatch(/users[!(]/)
    expect(ledger.unexpectedRequests).toEqual([])
  })

  // ── C. taste-match trust presentation ─────────────────────────────────────────────────────
  test('C — qualitative bands + evidence, cautious forming copy, decorative MatchBar, no % / no friendship', async ({ page }) => {
    await installPeopleFixture(page)
    await openPeople(page)
    await expect(followControl(page, 'Ana Okafor')).toBeVisible()

    await expect(page.getByText('Very close taste').first()).toBeVisible()       // established, strong evidence
    await expect(page.getByText('Based on 18 films in common')).toBeVisible()     // evidence context
    await expect(page.getByText(/Taste still forming/)).toBeVisible()             // forming counterpart, cautious
    // MatchBar is decorative: never announced as a progressbar
    await expect(page.getByRole('progressbar')).toHaveCount(0)
    const body = (await page.locator('body').innerText())
    expect(body).not.toMatch(/\d+%/)                                              // no percentage anywhere
    expect(body.toLowerCase()).not.toMatch(/perfect|soulmate|predicts? you|guaranteed/)
  })

  // ── D. follow success ─────────────────────────────────────────────────────────────────────
  test('D — follow success: one INSERT (exact payload), settles to Following, announced once', async ({ page }) => {
    const ledger = await installPeopleFixture(page, { followWrite: 'success' })
    await openPeople(page)
    const btn = followControl(page, 'Ana Okafor')
    await expect(btn).toHaveAttribute('aria-pressed', 'false')

    await btn.focus()
    await page.keyboard.press('Enter')                                           // keyboard-activate

    await expect(page.getByRole('button', { name: /^Unfollow Ana Okafor/ })).toBeVisible() // settled
    await expect(page.getByRole('button', { name: /^Unfollow Ana Okafor/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(status(page)).toContainText("You're now following Ana Okafor.")
    expect(ledger.followWrites.filter(w => w.op === 'follow')).toHaveLength(1)    // exactly one write
    const payload = ledger.followWrites[0].body
    expect(Object.keys(Array.isArray(payload) ? payload[0] : payload).sort()).toEqual(['follower_id', 'following_id'])
    expect((Array.isArray(payload) ? payload[0] : payload).following_id).toBe(ledger.U.ana)
  })

  // ── E. follow failure ─────────────────────────────────────────────────────────────────────
  test('E — follow failure: prior state preserved, no false Following, retry + announced, no raw text', async ({ page }) => {
    const ledger = await installPeopleFixture(page, { followWrite: 'failure' })
    await openPeople(page)
    const btn = followControl(page, 'Ana Okafor')
    await btn.click()

    await expect(status(page)).toContainText('Could not follow Ana Okafor. Try again.')
    await expect(status(page)).not.toContainText(/permission denied|42501|mock/i) // no backend text
    await expect(page.getByRole('button', { name: /^Follow Ana Okafor/ })).toBeVisible() // still Follow
    await expect(page.getByRole('button', { name: /^Follow Ana Okafor/ })).toBeEnabled()  // re-enabled, retry-able
    expect(ledger.followWrites.filter(w => w.op === 'follow')).toHaveLength(1)
  })

  // ── F. duplicate-key follow ───────────────────────────────────────────────────────────────
  test('F — duplicate-key (23505) follow is idempotent success, not a false failure', async ({ page }) => {
    const ledger = await installPeopleFixture(page, { followWrite: 'duplicate' })
    await openPeople(page)
    await followControl(page, 'Ana Okafor').click()

    await expect(status(page)).toContainText("You're now following Ana Okafor.")
    await expect(page.getByRole('button', { name: /^Unfollow Ana Okafor/ })).toHaveAttribute('aria-pressed', 'true')
    expect(ledger.followWrites.filter(w => w.op === 'follow')).toHaveLength(1)
  })

  // ── G. unfollow success / failure ─────────────────────────────────────────────────────────
  test('G — unfollow success: exact DELETE filters, settles, announced', async ({ page }) => {
    const ledger = await installPeopleFixture(page, { unfollowWrite: 'success' })
    await openPeople(page)
    await page.getByRole('button', { name: /^Unfollow Fin Adeyemi/ }).click()

    await expect(page.getByRole('button', { name: /^Follow Fin Adeyemi/ })).toBeVisible()
    await expect(status(page)).toContainText('You stopped following Fin Adeyemi.')
    const del = ledger.followWrites.find(w => w.op === 'unfollow')
    expect(del).toBeTruthy()
    expect(del.query).toMatch(/follower_id=eq\./)
    expect(del.query).toMatch(/following_id=eq\./)
  })

  test('G2 — unfollow failure keeps Following, announced, no raw text', async ({ page }) => {
    await installPeopleFixture(page, { unfollowWrite: 'failure' })
    await openPeople(page)
    await page.getByRole('button', { name: /^Unfollow Fin Adeyemi/ }).click()

    await expect(status(page)).toContainText('Could not unfollow Fin Adeyemi. Try again.')
    await expect(page.getByRole('button', { name: /^Unfollow Fin Adeyemi/ })).toBeVisible() // still Following
    await expect(status(page)).not.toContainText(/permission denied|mock/i)
  })

  // ── H. rapid duplicate clicks + cross-target independence ──────────────────────────────────
  test('H — rapid duplicate clicks collapse to one write; A pending does not disable B', async ({ page }) => {
    const ledger = await installPeopleFixture(page, { followWrite: 'success', followDelayMs: 600 })
    await openPeople(page)
    const ana = followControl(page, 'Ana Okafor')
    // three activations inside the pending window — the disabled state + the in-flight guard collapse them
    await ana.click()
    await ana.click({ force: true, noWaitAfter: true }).catch(() => {})
    await ana.click({ force: true, noWaitAfter: true }).catch(() => {})
    await expect(page.getByRole('button', { name: /^Unfollow Ana Okafor/ })).toBeVisible({ timeout: 5000 })
    const anaFollows = ledger.followWrites.filter(w => w.op === 'follow' && ((Array.isArray(w.body) ? w.body[0] : w.body)?.following_id === ledger.U.ana))
    expect(anaFollows, 'rapid clicks → exactly one follow write').toHaveLength(1)
    // a different target's control is independently operable (A's pending did not disable B)
    await expect(followControl(page, 'Bo Tremblay')).toBeEnabled()
  })

  // ── I. self-follow defense ────────────────────────────────────────────────────────────────
  test('I — an accidental self candidate is never followable and produces no write', async ({ page }) => {
    const ledger = await installPeopleFixture(page, { includeSelfCandidate: true })
    test.skip(!ledger.selfId, 'no stored session id to seed the self candidate')
    await openPeople(page)
    await expect(followControl(page, 'Ana Okafor')).toBeVisible()
    // "You" must not render as a followable card
    await expect(page.getByRole('button', { name: /Follow You$/ })).toHaveCount(0)
    expect(ledger.followWrites).toEqual([])
    expect(await status(page).innerText()).not.toMatch(/now following You/)
  })

  // ── J. hide suggestion ────────────────────────────────────────────────────────────────────
  test('J — Hide removes the card session-locally, writes nothing, announces, recovers focus', async ({ page }) => {
    const ledger = await installPeopleFixture(page)
    await openPeople(page)
    await expect(followControl(page, 'Ana Okafor')).toBeVisible()
    await hideControl(page, 'Ana Okafor').click()

    await expect(followControl(page, 'Ana Okafor')).toHaveCount(0)               // removed from the surface
    await expect(status(page)).toContainText('Hidden Ana Okafor for this session.')
    await expect(status(page)).not.toContainText(/block|report/i)                // not a block
    expect(ledger.followWrites).toEqual([])                                       // no Supabase write
    expect(ledger.unexpectedRequests).toEqual([])
    // focus recovery (double-rAF) lands on a real control, never <body>
    await expect.poll(() => page.evaluate(() => document.activeElement?.tagName), { timeout: 3000 }).not.toBe('BODY')
    // does not reappear after a re-render (toggle search on/off)
    await page.getByRole('searchbox', { name: 'Search people by name' }).fill('x')
    await page.getByRole('searchbox', { name: 'Search people by name' }).fill('')
    await expect(followControl(page, 'Ana Okafor')).toHaveCount(0)
  })

  // ── K. search ─────────────────────────────────────────────────────────────────────────────
  test('K — search success / empty / failure degrade honestly; clear control is labelled + 44px', async ({ page }) => {
    await installPeopleFixture(page, { search: 'success' })
    await openPeople(page)
    const input = page.getByRole('searchbox', { name: 'Search people by name' })
    await input.fill('hal')
    await expect(page.getByRole('region', { name: /result/i })).toBeVisible()
    await expect(followControl(page, 'Hal Voss')).toBeVisible()
    const clear = page.getByRole('button', { name: 'Clear search results' })
    await expect(clear).toBeVisible()
    const box = await clear.boundingBox()
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  })

  test('K2 — empty search shows the privacy-safe no-results copy', async ({ page }) => {
    await installPeopleFixture(page, { search: 'empty' })
    await openPeople(page)
    await page.getByRole('searchbox', { name: 'Search people by name' }).fill('zzz')
    await expect(page.getByText('No people found.')).toBeVisible()
    await expect(page.getByText(/never looks through private film activity or reviews/i)).toBeVisible()
  })

  test('K3 — search RPC failure → "unavailable" (never "No people found"), no raw text, no table fallback', async ({ page }) => {
    const ledger = await installPeopleFixture(page, { search: 'failure' })
    await openPeople(page)
    await page.getByRole('searchbox', { name: 'Search people by name' }).fill('zzz')
    await expect(page.getByText('Search is unavailable right now.')).toBeVisible()
    await expect(page.getByText('No people found.')).toHaveCount(0)
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/mock|42501|relation does not exist/i)
    expect(ledger.forbiddenReads).toEqual([])         // no direct table fallback on RPC failure
  })

  // ── L. empty discovery ────────────────────────────────────────────────────────────────────
  test('L — empty discovery shows the honest empty state, no fabricated social proof', async ({ page }) => {
    const ledger = await installPeopleFixture(page, { mode: 'empty' })
    await openPeople(page)
    await expect(page.getByText('No confident taste matches yet')).toBeVisible()
    const body = (await page.locator('body').innerText())
    for (const name of Object.values(ledger.NAME)) expect(body).not.toContain(name)
    expect(body.toLowerCase()).not.toMatch(/popular on feelflick|crew overlap|what your circle|shared lineage/)
    expect(body).not.toMatch(/\d+%/)
  })

  // ── M. keyboard journey ───────────────────────────────────────────────────────────────────
  test('M — keyboard: follow/hide/search controls are reachable + named, focus only on interactives', async ({ page }) => {
    await installPeopleFixture(page)
    await openPeople(page)
    await expect(followControl(page, 'Ana Okafor')).toBeVisible()
    await page.getByRole('searchbox', { name: 'Search people by name' }).focus()
    const seen = []
    for (let i = 0; i < 18; i++) {
      seen.push(await page.evaluate(() => {
        const el = document.activeElement
        return { tag: el?.tagName, name: el?.getAttribute('aria-label') || el?.textContent?.trim()?.slice(0, 44) || '' }
      }))
      await page.keyboard.press('Tab')
    }
    const names = seen.map(s => s.name)
    expect(names.some(n => /^Follow /.test(n)), 'a Follow control is tab-reachable').toBe(true)
    expect(names.some(n => /^Hide .* from your suggestions/.test(n)), 'a Hide control is tab-reachable').toBe(true)
    // no focus trap on a non-interactive element: every in-page focused node is a real control
    for (const s of seen) {
      if (s.tag && !['BODY', 'HTML'].includes(s.tag)) {
        expect(['BUTTON', 'INPUT', 'A', 'TEXTAREA', 'SELECT'], `focused ${s.tag} (${s.name})`).toContain(s.tag)
      }
    }
  })

  // ── N. reduced motion ─────────────────────────────────────────────────────────────────────
  test('N — reduced motion: states are understandable without animation', async ({ page }) => {
    await installPeopleFixture(page, { reducedMotion: true, followWrite: 'success' })
    await openPeople(page)
    await followControl(page, 'Ana Okafor').click()
    await expect(page.getByRole('button', { name: /^Unfollow Ana Okafor/ })).toBeVisible() // settled state is text, not motion
    await expect(page.getByRole('progressbar')).toHaveCount(0)
  })

  // ── O. axe (standard) across states ───────────────────────────────────────────────────────
  for (const [label, opts, prep] of [
    ['healthy', {}, null],
    ['empty', { mode: 'empty' }, null],
    ['search', { search: 'success' }, async (page) => page.getByRole('searchbox', { name: 'Search people by name' }).fill('hal')],
    ['follow-failure', { followWrite: 'failure' }, async (page) => { await page.getByRole('button', { name: /^Follow Ana Okafor/ }).click() }],
    ['hidden', {}, async (page) => page.getByRole('button', { name: 'Hide Ana Okafor from your suggestions' }).click()],
  ]) {
    test(`O — axe (standard) clean: ${label}`, async ({ page }) => {
      await installPeopleFixture(page, opts)
      await openPeople(page)
      if (prep) { await page.getByText(/.+/).first().waitFor(); await prep(page); await page.waitForTimeout(150) }
      const results = await new AxeBuilder({ page }).include('.ff-people-v2').withTags(WCAG).analyze()
      const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact) && v.id !== 'color-contrast')
      expect(serious, `${label}: ${serious.map(v => v.id).join(', ')}`).toEqual([])
    })
  }

  // ── P. axe with colour-contrast enabled (People only) ─────────────────────────────────────
  test('P — axe colour-contrast enabled: no serious/critical violations', async ({ page }) => {
    await installPeopleFixture(page)
    await openPeople(page)
    await expect(followControl(page, 'Ana Okafor')).toBeVisible()
    const results = await new AxeBuilder({ page }).include('.ff-people-v2').withRules(['color-contrast']).analyze()
    const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact))
    expect(serious, serious.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(' ')}`).join(' | ')).toEqual([])
  })

  // ── Q. responsive matrix ──────────────────────────────────────────────────────────────────
  test('Q — responsive: one h1 + no horizontal overflow at six widths', async ({ page }) => {
    await installPeopleFixture(page)
    await openPeople(page)
    await expect(followControl(page, 'Ana Okafor')).toBeVisible()
    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp)
      await page.waitForTimeout(80)
      await expect(h1(page)).toHaveCount(1)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `h-overflow at ${vp.width}`).toBeLessThanOrEqual(1)
      await expect(page.getByRole('searchbox', { name: 'Search people by name' })).toBeVisible()
    }
  })

  // ── R. consent gate: opted-out candidate never appears ──────────────────────────────────────
  test('R — an opted-OUT candidate (not in the taste projection) never appears in any rail', async ({ page }) => {
    const ledger = await installPeopleFixture(page)
    await openPeople(page)
    await expect(followControl(page, 'Ana Okafor')).toBeVisible()
    const body = await page.locator('.ff-people-v2').innerText()
    expect(body).not.toContain('Gus Halloran') // opted out → excluded despite a real similarity row
    // identity was never requested for the opted-out candidate
    const idCalls = ledger.rpcsFor('get_people_public_identities').flatMap(r => (r.body?.requested_user_ids) || [])
    expect(idCalls).not.toContain(ledger.U.gus)
  })

  // ── S. fail-closed: taste-projection failure suppresses discovery ───────────────────────────
  test('S — taste-projection failure fails CLOSED: no cards, search still works, no identity fetch', async ({ page }) => {
    const ledger = await installPeopleFixture(page, { rpc: 'taste_fail' })
    await openPeople(page)
    await expect(page.getByText('Taste matches are unavailable right now.')).toBeVisible()
    await expect(followControl(page, 'Ana Okafor')).toHaveCount(0) // no identity-only cards
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
    await expect(page.getByRole('searchbox', { name: 'Search people by name' })).toBeVisible() // search remains
    expect(ledger.rpcsFor('get_people_public_identities')).toHaveLength(0) // never fetched identity after fail-closed
  })

  // ── T. Suggested is FOF-only, with a genuine via ────────────────────────────────────────────
  test('T — Suggested shows ONLY friend-of-follows with a genuine via; no similarity candidate', async ({ page }) => {
    await installPeopleFixture(page)
    await openPeople(page)
    const region = page.getByRole('region', { name: /People you might know/i })
    await expect(region).toBeVisible()
    await expect(region.getByText('Lee Okafor')).toBeVisible()   // FOF candidate (not in similarity)
    await expect(region.getByText(/via/i)).toBeVisible()
    await expect(region.getByText('Fin Adeyemi')).toBeVisible()  // the genuine via friend
    await expect(region.getByText('Ana Okafor')).toHaveCount(0)  // a similarity candidate never appears here
  })

  // ── U. invite shares the generic canonical URL (no raw id) ──────────────────────────────────
  test('U — Invite copies the generic canonical URL, never a raw user id / ?ref=', async ({ page }) => {
    await installPeopleFixture(page)
    await page.addInitScript(() => {
      window.__copied = []
      // stub clipboard so the desktop copy path is deterministic + capturable
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: (t) => { window.__copied.push(t); return Promise.resolve() } }, configurable: true })
    })
    await openPeople(page)
    await page.getByRole('button', { name: /Invite a friend/i }).click()
    await expect(status(page)).toContainText('Invite link copied.')
    const copied = await page.evaluate(() => window.__copied || [])
    expect(copied).toContain('https://app.feelflick.com/')
    for (const c of copied) { expect(c).not.toMatch(/\?ref=/); expect(c).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/) }
  })

  // ── V. matching explainer (one shared accessible dialog) ────────────────────────────────────
  test('V — explainer opens from both triggers, is a focus-trapped modal, Escape closes + restores', async ({ page }) => {
    await installPeopleFixture(page)
    await openPeople(page)
    const trigger = page.getByRole('button', { name: /How matching works/i })
    await trigger.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog.getByText(/Name search is separate/i)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused() // focus restored to the opener
    // the Strongest "No exact percentages" chip opens the SAME dialog
    await page.getByRole('button', { name: /No exact percentages/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  // ── W. Hide → Undo restores ─────────────────────────────────────────────────────────────────
  test('W — Undo restores a just-hidden card (no backend write)', async ({ page }) => {
    const ledger = await installPeopleFixture(page)
    await openPeople(page)
    await hideControl(page, 'Ana Okafor').click()
    await expect(followControl(page, 'Ana Okafor')).toHaveCount(0)
    await page.getByRole('button', { name: 'Undo hiding Ana Okafor' }).click()
    await expect(followControl(page, 'Ana Okafor')).toBeVisible()
    await expect(status(page)).toContainText('Restored Ana Okafor.')
    expect(ledger.followWrites).toEqual([])
  })

  // ── X. 320×812: no overflow + Undo toast clears the BottomNav ────────────────────────────────
  test('X — 320×812: no horizontal overflow; the Undo toast sits above the BottomNav', async ({ page }) => {
    await installPeopleFixture(page)
    await page.setViewportSize({ width: 320, height: 812 })
    await openPeople(page)
    await expect(h1(page)).toHaveCount(1)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    await hideControl(page, 'Ana Okafor').click()
    const toast = page.locator('.ff-people-toast')
    await expect(toast).toBeVisible()
    const nav = await page.locator('.fixed.bottom-0.left-0.right-0.z-30').first().boundingBox()
    const tb = await toast.boundingBox()
    if (nav) expect(tb.y + tb.height).toBeLessThanOrEqual(nav.y - 8) // toast above the BottomNav
  })

  // ── Y. 200% browser zoom (halved effective viewport — the faithful reflow) ───────────────────
  for (const z of [
    { name: '1280 @ 200% (≈640)', w: 640, h: 400 },
    { name: '390 @ 200% (≈195)', w: 195, h: 422 },
    { name: '320 @ 200% (≈160)', w: 160, h: 406 },
  ]) {
    test(`Y — 200% zoom ${z.name}: usable, no overflow, controls + dialog + Undo reachable, BottomNav clearance`, async ({ page }) => {
      const errors = []
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
      page.on('pageerror', (e) => errors.push(e.message))
      await installPeopleFixture(page)
      await page.setViewportSize({ width: z.w, height: z.h })
      await openPeople(page)
      await expect(h1(page)).toHaveCount(1)
      const overflow = await page.evaluate(() => { const el = document.scrollingElement || document.documentElement; return el.scrollWidth - el.clientWidth })
      expect(overflow, `overflow ${z.name}`).toBeLessThanOrEqual(1)
      // masthead actions + search + Strongest Follow/Hide all reachable
      await expect(page.getByRole('button', { name: /How matching works/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /Invite a friend/i })).toBeVisible()
      await expect(page.getByRole('searchbox', { name: 'Search people by name' })).toBeVisible()
      await expect(followControl(page, 'Ana Okafor')).toBeVisible()
      await expect(hideControl(page, 'Ana Okafor')).toBeVisible()
      // explainer fits + Close reachable + scrollable
      await page.getByRole('button', { name: /How matching works/i }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      expect((await dialog.boundingBox()).width).toBeLessThanOrEqual(z.w)
      await expect(dialog.getByRole('button', { name: /Close matching explanation/i })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)
      // Hide → Undo reachable; final action + toast clear the BottomNav by ≥8px
      await hideControl(page, 'Ana Okafor').click()
      const toast = page.locator('.ff-people-toast')
      await expect(toast).toBeVisible()
      await expect(page.getByRole('button', { name: /Undo hiding Ana Okafor/i })).toBeVisible()
      const nav = await page.locator('.fixed.bottom-0.left-0.right-0.z-30').first().boundingBox()
      const tb = await toast.boundingBox()
      if (nav) expect(tb.y + tb.height, `toast vs nav ${z.name}`).toBeLessThanOrEqual(nav.y - 8)
      expect(errors, errors.join(' | ')).toEqual([])
    })
  }
})
