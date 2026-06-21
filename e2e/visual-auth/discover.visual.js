import { test, expect } from '@playwright/test'
import { installDiscoverFixture } from '../fixtures/discover.js'

// Authenticated, deterministic Discover visual baselines (visual-app project).
// Every read/write + TMDB + posters are intercepted; reduced motion + fixed clock
// + seeded RNG + an animation freeze pin every moving part (the starfield/bursts
// are deterministic by construction). Darwin local + Linux via visual-baselines/**.
// The transient resolve beat is intentionally not baselined (0ms under reduced motion).

const DESKTOP = { width: 1280, height: 720 }
const MOBILE = { width: 390, height: 844 }
const SHORT = { width: 1366, height: 650 }
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
const HIDE_CHROME =
  '.fixed.bottom-0.left-0.right-0.z-30{display:none!important}' +
  'button[aria-label="Turn sound on"],button[aria-label="Turn sound off"]{display:none!important}'

const moodBtn = (page, name) => page.getByRole('button', { name: new RegExp(`^${name}`) })

async function freeze(page) { await page.addStyleTag({ content: FREEZE + HIDE_CHROME }); await page.waitForTimeout(120) }
async function gotoMood(page) { await page.goto('/discover'); await expect(moodBtn(page, 'Tender')).toBeVisible({ timeout: 20_000 }) }
async function gotoContext(page) {
  await gotoMood(page)
  await moodBtn(page, 'Tender').click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'This is tonight.' })).toBeVisible()
}
// Title-agnostic: the engine's cold-start ranking decides the actual lead, so we
// wait for the stable result signal (the role label + the lead action) rather than
// a specific film title.
async function gotoResult(page) {
  await gotoContext(page)
  await page.getByRole('button', { name: /Find tonight’s film/ }).click()
  await expect(page.getByText('Closest fit').first()).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Open Film File' })).toBeVisible({ timeout: 15_000 })
}

test.describe('Discover — authenticated visual baselines (redesign)', () => {
  for (const [device, vp] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
    const full = device === 'mobile'

    test(`${device} — mood empty`, async ({ page }) => {
      await installDiscoverFixture(page, { reducedMotion: true }); await page.setViewportSize(vp)
      await gotoMood(page); await freeze(page)
      await expect(page).toHaveScreenshot(`mood-empty-${device}.png`, { fullPage: full })
    })

    test(`${device} — mood with three selections`, async ({ page }) => {
      await installDiscoverFixture(page, { reducedMotion: true }); await page.setViewportSize(vp)
      await gotoMood(page)
      await moodBtn(page, 'Tender').click(); await moodBtn(page, 'Tense').click(); await moodBtn(page, 'Slow-burn').click()
      await freeze(page)
      await expect(page).toHaveScreenshot(`mood-three-${device}.png`, { fullPage: full })
    })

    test(`${device} — context`, async ({ page }) => {
      await installDiscoverFixture(page, { reducedMotion: true }); await page.setViewportSize(vp)
      await gotoContext(page); await freeze(page)
      await expect(page).toHaveScreenshot(`context-${device}.png`, { fullPage: full })
    })

    test(`${device} — result lead`, async ({ page }) => {
      await installDiscoverFixture(page, { reducedMotion: true }); await page.setViewportSize(vp)
      await gotoResult(page); await freeze(page)
      await expect(page).toHaveScreenshot(`result-lead-${device}.png`, { fullPage: full })
    })

    test(`${device} — alternate focused`, async ({ page }) => {
      await installDiscoverFixture(page, { reducedMotion: true }); await page.setViewportSize(vp)
      await gotoResult(page)
      // Click whichever alternate direction the engine produced (Gentler or Bolder).
      await page.getByRole('button', { name: /(Gentler|Bolder) direction:/ }).first().click()
      await page.waitForTimeout(120)
      await freeze(page)
      await expect(page).toHaveScreenshot(`result-alternate-${device}.png`, { fullPage: full })
    })

    test(`${device} — lead only (fewer directions)`, async ({ page }) => {
      await installDiscoverFixture(page, { reducedMotion: true, source: 'lead_only' }); await page.setViewportSize(vp)
      await gotoContext(page)
      await page.getByRole('button', { name: /Find tonight’s film/ }).click()
      await expect(page.getByText('Closest fit').first()).toBeVisible({ timeout: 15_000 })
      await freeze(page)
      await expect(page).toHaveScreenshot(`result-lead-only-${device}.png`, { fullPage: full })
    })

    test(`${device} — exhausted`, async ({ page }) => {
      await installDiscoverFixture(page, { reducedMotion: true }); await page.setViewportSize(vp)
      await gotoResult(page)
      for (let i = 0; i < 6; i++) {
        const skip = page.getByRole('button', { name: 'Not tonight' })
        if (await skip.count() === 0) break
        await skip.click(); await page.waitForTimeout(120)
      }
      await expect(page.getByRole('button', { name: 'Start over' })).toBeVisible({ timeout: 15_000 })
      await freeze(page)
      await expect(page).toHaveScreenshot(`exhausted-${device}.png`, { fullPage: full })
    })
  }

  test('desktop short-height — result lead (1366×650)', async ({ page }) => {
    await installDiscoverFixture(page, { reducedMotion: true }); await page.setViewportSize(SHORT)
    await gotoResult(page); await freeze(page)
    await expect(page).toHaveScreenshot('result-lead-short.png')
  })
})
