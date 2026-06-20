import { test, expect } from '@playwright/test'
import { installHomeFixture } from '../fixtures/home.js'

// Authenticated, deterministic journey through the redesigned Home (bounded personal
// discovery). Replaces the retired single-pick Briefing journey/focus specs. The
// composition is engine-driven, so these assert STRUCTURE + behaviour (the route
// mounts, the shortcut strip + DNA close render, the hero/rows actions write through
// the real services when present) rather than specific films.

const shortcuts = (page) => page.getByRole('navigation', { name: 'Quick actions' })
const hero = (page) => page.getByRole('region', { name: 'Top picks for you' })

async function gotoHome(page, opts = {}) {
  const ledger = await installHomeFixture(page, opts)
  await page.goto('/home')
  await expect(shortcuts(page)).toBeVisible({ timeout: 20_000 })
  return ledger
}

test.describe('Home — redesign journey', () => {
  test('mounts the Home shell (heading, shortcuts, DNA) without bouncing or crashing', async ({ page }) => {
    await gotoHome(page)
    await expect(page).toHaveURL(/\/home(?:[/?#]|$)/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Home — your picks for tonight')
    await expect(shortcuts(page)).toBeVisible()
    await expect(page.getByRole('link', { name: /Match the moment/i })).toHaveAttribute('href', '/discover')
    await expect(page.getByText('Cinematic DNA')).toBeVisible()
  })

  test('the shortcut links keep visible keyboard focus (computed style, not className)', async ({ page }) => {
    await gotoHome(page)
    const link = page.getByRole('link', { name: /Browse your way/i })
    const visible = await link.evaluate((el) => {
      el.focus()
      const cs = getComputedStyle(el)
      const transparent = (c) => c === 'transparent' || /rgba?\([^)]*[,/]\s*0\s*\)$/.test(c)
      return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && !transparent(cs.outlineColor)
    })
    expect(visible).toBe(true)
  })

  test('when a hero standout renders, Save writes to the watchlist', async ({ page }) => {
    const ledger = await gotoHome(page)
    if (await hero(page).count() === 0) test.skip(true, 'no grounded hero standout in this deterministic pool')
    const save = hero(page).getByRole('button', { name: /Add .+ to watchlist/i }).first()
    await save.click()
    await expect.poll(() => ledger.writesFor('user_watchlist').length).toBeGreaterThan(0)
  })

  test('honest top-level error state on a failed load', async ({ page }) => {
    await installHomeFixture(page, { dataState: 'load_error' })
    await page.goto('/home')
    await expect(page.getByRole('alert')).toContainText('We couldn’t load your home', { timeout: 20_000 })
  })
})
