import { test, expect } from '@playwright/test'

// Public landing visual baselines for the redesigned Adaptive Editorial Cinema
// landing. The route is logged-out + fully deterministic (no day/time greeting, no
// product fetch, static example data), so no clock/seed stubbing is required beyond
// reduced motion + an animation freeze. Linux baselines are generated via the
// visual-baselines/landing-* CI flow.

const DESKTOP = { width: 1280, height: 900 }
const MOBILE = { width: 390, height: 844 }
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'

async function load(page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /movies, made personal/i })).toBeVisible({ timeout: 20_000 })
}
async function freeze(page) {
  await page.addStyleTag({ content: FREEZE })
  await page.waitForTimeout(120)
}

test.describe('Landing — public visual baselines', () => {
  test('desktop — hero', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(DESKTOP)
    await load(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('landing-hero.png')
  })

  test('desktop — full page', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(DESKTOP)
    await load(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('landing-fullpage.png', { fullPage: true })
  })

  test('desktop — Film File after-watching', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(DESKTOP)
    await load(page)
    await page.getByRole('tab', { name: /after watching/i }).click()
    await freeze(page)
    const card = page.locator('#film-file')
    await card.scrollIntoViewIfNeeded()
    await expect(card).toHaveScreenshot('landing-film-file-after.png')
  })

  test('desktop — Library diary', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(DESKTOP)
    await load(page)
    await page.getByRole('tab', { name: /diary/i }).click()
    await freeze(page)
    const card = page.locator('#library')
    await card.scrollIntoViewIfNeeded()
    await expect(card).toHaveScreenshot('landing-library-diary.png')
  })

  test('mobile — full page', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(MOBILE)
    await load(page)
    await freeze(page)
    await expect(page).toHaveScreenshot('landing-mobile-fullpage.png', { fullPage: true })
  })

  test('mobile — menu open', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(MOBILE)
    await load(page)
    await page.getByRole('button', { name: /^menu$/i }).click()
    await freeze(page)
    await expect(page).toHaveScreenshot('landing-mobile-menu.png')
  })
})
