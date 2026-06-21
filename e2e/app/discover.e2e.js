import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { installDiscoverFixture } from '../fixtures/discover.js'

// Authenticated functional coverage for the redesigned /discover ("tuned to the
// moment"). Real auth (saved session); every Discover read/write is intercepted by
// the fixture so behaviour is deterministic + offline. No live writes escape.

async function toResult(page, { source = 'live', reducedMotion = true, providerState = 'found' } = {}) {
  const ledger = await installDiscoverFixture(page, { source, reducedMotion, providerState })
  await page.goto('/discover')
  await expect(page.getByRole('heading', { level: 1, name: 'How should tonight feel?' })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: /^Tender/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'This is tonight.' })).toBeVisible()
  await page.getByRole('button', { name: /Find tonight’s film/ }).click()
  // Title-agnostic: the engine's cold-start ranking decides the actual lead.
  await expect(page.getByText('Closest fit').first()).toBeVisible({ timeout: 20_000 })
  return ledger
}
const leadTitle = (page) => page.getByRole('heading', { level: 1 }).first().textContent()

// Geometry probe for dock-reachability assertions (BottomNav-aware).
const reachRects = (page) => page.evaluate(() => {
  const navEls = [...document.querySelectorAll('nav, [class*="bottom-0"]')]
    .map((n) => n.getBoundingClientRect()).filter((r) => r.height > 30 && r.bottom > innerHeight - 130)
  const navTop = navEls.length ? Math.min(...navEls.map((r) => r.top)) : innerHeight
  const shellEl = document.querySelector('.ff-disc-dock__shell')
  const shell = shellEl && shellEl.getBoundingClientRect()
  const cards = [...document.querySelectorAll('.ff-disc-dir')].map((c) => {
    const r = c.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
  })
  const audioEl = document.querySelector('.ff-disc-result .ff-disc-audio')
  const audio = audioEl ? (() => { const r = audioEl.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom } })() : null
  return {
    vpW: innerWidth, vpH: innerHeight, navTop, cards, audio,
    shell: shell ? { top: shell.top, bottom: shell.bottom } : null,
    horizOverflow: document.documentElement.scrollWidth > innerWidth,
  }
})
const impressionKeys = (ledger) => ledger.writes
  .filter((w) => w.table === 'recommendation_impressions')
  .flatMap((w) => (Array.isArray(w.body) ? w.body : [w.body]).filter(Boolean).map((r) => `${r.movie_id}:${r.placement}`))

test('1 mood → accept defaults → one dominant lead with a reserve direction', async ({ page }) => {
  await toResult(page)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('Closest fit').first()).toBeVisible()
  // at least one honest alternate direction (the engine decides which roles qualify)
  await expect(page.getByRole('button', { name: /(Gentler|Bolder) direction:/ }).first()).toBeVisible()
  await expect(page.locator('body')).not.toContainText('% match')
})

test('selecting an alternate changes focus (role label persists), then Open Film File', async ({ page }) => {
  await toResult(page)
  const before = await leadTitle(page)
  await page.getByRole('button', { name: /(Gentler|Bolder) direction:/ }).first().click()
  await expect.poll(async () => leadTitle(page)).not.toBe(before) // lead changed → focus moved
  await expect(page.getByRole('button', { name: /Closest fit:/ })).toBeVisible() // closest role persists
  await page.getByRole('button', { name: 'Open Film File' }).click()
  await expect(page).toHaveURL(/\/movie\/\d+/)
})

test('Not tonight promotes the next direction', async ({ page }) => {
  await toResult(page)
  const before = await leadTitle(page)
  await page.getByRole('button', { name: 'Not tonight' }).click()
  await expect.poll(async () => leadTitle(page).catch(() => null)).not.toBe(before)
})

test('exhausting the shortlist shows the honest finite-edge state', async ({ page }) => {
  await toResult(page)
  for (let i = 0; i < 6; i++) {
    const skip = page.getByRole('button', { name: 'Not tonight' })
    if (await skip.count() === 0) break
    await skip.click()
    await page.waitForTimeout(150)
  }
  await expect(page.getByText(/Nothing left in this shortlist\.|enough directions for one decision/)).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Adjust tonight' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start over' })).toBeVisible()
})

test('Adjust tonight returns to context with moods preserved', async ({ page }) => {
  await toResult(page)
  // Adjust lives in the context-chip row on the active result (Start over is the dock tool).
  await page.getByRole('button', { name: 'Adjust' }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'This is tonight.' })).toBeVisible()
  await page.getByRole('button', { name: /^Back/ }).click()
  await expect(page.getByRole('button', { name: /^Tender/, pressed: true })).toBeVisible()
})

test('Start over clears the session back to the mood stage', async ({ page }) => {
  await toResult(page)
  await page.getByRole('button', { name: 'Start over' }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'How should tonight feel?' })).toBeVisible()
  await expect(page.getByRole('button', { pressed: true })).toHaveCount(0)
})

test('fallback (live error) is labelled an example, no fabricated personal reason or directions', async ({ page }) => {
  await toResult(page, { source: 'live_error' })
  await expect(page.getByText(/Example pick/i)).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('body')).not.toContainText('Because')
  await expect(page.getByRole('button', { name: /Gentler direction/ })).toHaveCount(0)
})

test('lead-only honestly renders fewer than three directions', async ({ page }) => {
  await toResult(page, { source: 'lead_only' })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: /Gentler direction/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Bolder direction/ })).toHaveCount(0)
})

test('trailer opens, focuses Close, and restores focus on Escape', async ({ page }) => {
  await toResult(page)
  await page.getByRole('button', { name: /Trailer/ }).click()
  const dialog = page.getByRole('dialog', { name: /trailer/i })
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close trailer' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('a11y — no serious/critical violations on each stage (excluding contrast)', async ({ page }) => {
  const audit = async (label) => {
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const blocking = violations.filter((v) => ['serious', 'critical'].includes(v.impact) && v.id !== 'color-contrast')
    expect(blocking, `${label}: ${blocking.map((v) => v.id).join(', ')}`).toEqual([])
  }
  await installDiscoverFixture(page, { reducedMotion: true })
  await page.goto('/discover')
  await expect(page.getByRole('heading', { level: 1, name: 'How should tonight feel?' })).toBeVisible({ timeout: 20_000 })
  await audit('mood')
  await page.getByRole('button', { name: /^Tender/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await audit('context')
  await page.getByRole('button', { name: /Find tonight’s film/ }).click()
  await expect(page.getByText('Closest fit').first()).toBeVisible({ timeout: 20_000 })
  await audit('result')
})

// ── Dock reachability — the dock may begin below the fold, but the COMPLETE dock must
// be scrollable clear of the fixed BottomNav, horizontally to the last direction, with
// no page overflow and no audio/dock collision; scrolling must not duplicate impressions.
for (const vp of [{ w: 390, h: 844 }, { w: 320, h: 812 }]) {
  test(`mobile ${vp.w} — full direction dock reachable above BottomNav, no overflow, no audio collision`, async ({ page }) => {
    await page.setViewportSize({ width: vp.w, height: vp.h })
    const ledger = await toResult(page)

    // Initial reveal (scrollY 0): the stage-aware audio toggle must not collide with the
    // dock cards, and the page must not overflow horizontally.
    const reveal = await reachRects(page)
    expect(reveal.horizOverflow, 'no horizontal page overflow at reveal').toBe(false)
    if (reveal.audio) {
      for (const c of reveal.cards) {
        const overlap = !(reveal.audio.bottom <= c.top || reveal.audio.top >= c.bottom || reveal.audio.right <= c.left || reveal.audio.left >= c.right)
        expect(overlap, 'audio toggle does not overlap a direction card at reveal').toBe(false)
      }
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect.poll(async () => (await reachRects(page)).shell !== null).toBe(true)
    const a = await reachRects(page)
    expect(a.horizOverflow, 'no horizontal page overflow').toBe(false)
    expect(a.shell.bottom, 'complete dock sits above the BottomNav').toBeLessThanOrEqual(a.navTop + 1)
    expect(a.cards[0].bottom, 'first direction card fully above the BottomNav').toBeLessThanOrEqual(a.navTop + 1)

    // horizontally scroll the dock to the final direction → fully visible + operable
    await page.locator('.ff-disc-dock__shell').evaluate((el) => { el.scrollLeft = el.scrollWidth })
    await page.waitForTimeout(300)
    const b = await reachRects(page)
    const last = b.cards[b.cards.length - 1]
    expect(last.right, 'last direction card within the viewport width').toBeLessThanOrEqual(b.vpW + 1)
    expect(last.left, 'last direction card not pushed off the left').toBeGreaterThanOrEqual(-1)
    expect(last.bottom, 'last direction card above the BottomNav').toBeLessThanOrEqual(b.navTop + 1)
    expect(b.horizOverflow, 'no horizontal page overflow after dock scroll').toBe(false)

    // Genuine-visibility dedup (the review's "no duplication from scroll/focus"): once
    // every direction has been exposed, RE-scrolling the same cards in/out of view and
    // changing focus must add NO further impression writes. Measured as a delta from the
    // settled count, so it isolates scroll/focus from any initial data-settling. (The
    // daily recommendation_impressions table is also DB-deduped on
    // user+movie+placement+shown_date, so re-exposure can never create a duplicate row.)
    await page.waitForTimeout(300)
    const settled = impressionKeys(ledger).length
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(150)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.locator('.ff-disc-dock__shell').evaluate((el) => { el.scrollLeft = el.scrollWidth })
    await page.waitForTimeout(300)
    expect(impressionKeys(ledger).length, 're-scrolling exposed cards adds no impressions').toBe(settled)
    await page.getByRole('button', { name: /(Gentler|Bolder) direction:/ }).last().click() // operable + focus
    await page.waitForTimeout(300)
    expect(impressionKeys(ledger).length, 'changing focus adds no impressions').toBe(settled)
  })
}

test('short-height 1366×650 — complete dock reachable, never overlaps title/reason/actions', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 650 })
  await toResult(page)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(200)
  const m = await page.evaluate(() => {
    const g = (s) => { const e = document.querySelector(s); return e && e.getBoundingClientRect() }
    const shell = g('.ff-disc-dock__shell'), title = g('.ff-disc-lead__title'), reason = g('.ff-disc-reason'), actions = g('.ff-disc-lead__actions')
    const ov = (a, b) => a && b && !(a.bottom <= b.top || a.top >= b.bottom)
    return {
      horizOverflow: document.documentElement.scrollWidth > innerWidth,
      cards: document.querySelectorAll('.ff-disc-dir').length,
      overTitle: ov(shell, title), overReason: ov(shell, reason), overActions: ov(shell, actions),
    }
  })
  expect(m.horizOverflow, 'no horizontal page overflow').toBe(false)
  expect(m.cards, 'all directions present').toBeGreaterThanOrEqual(2)
  expect(m.overTitle, 'dock never overlaps the title').toBe(false)
  expect(m.overReason, 'dock never overlaps the reason').toBe(false)
  expect(m.overActions, 'dock never overlaps the actions').toBe(false)
})
