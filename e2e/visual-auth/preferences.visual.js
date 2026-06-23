import { test, expect } from '@playwright/test'
import { installPreferencesFixture } from '../fixtures/preferences.js'

// Authenticated, deterministic /preferences visual baselines (visual-app project: saved session +
// setup dependency). Every /rest/v1 read/write + the save RPC are intercepted by the fixture, so the
// route is fully offline + reproducible. Reduced motion + animation freeze pin moving parts; the fixed
// global chrome (header + mobile bottom nav) is hidden so no account identity is captured.
// Platform-specific baselines: Darwin local, Linux via visual-baselines/preferences-locked-redesign.

const DESKTOP = { width: 1280, height: 720 }
const MOBILE = { width: 390, height: 844 }
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
const HIDE_CHROME = 'header,.fixed.top-0.left-0.right-0,.fixed.bottom-0.left-0.right-0.z-30{display:none!important}'

const h1 = (page) => page.getByRole('heading', { level: 1 })
const moodLess = (page) => page.getByRole('radiogroup', { name: 'Tender' }).getByRole('radio', { name: 'Less' })

async function openPrefs(page) {
  await page.goto('/preferences')
  await expect(h1(page)).toHaveText(/Your taste, clearly/i, { timeout: 20_000 })
}
async function freeze(page) {
  await page.addStyleTag({ content: FREEZE + HIDE_CHROME })
  await page.waitForTimeout(120)
}

test.describe('Preferences — authenticated visual baselines', () => {
  // ── Desktop 1280×720 ──────────────────────────────────────────────────────────
  test('desktop — loaded first fold (hero + derived summary + quick tune)', async ({ page }) => {
    await installPreferencesFixture(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(DESKTOP)
    await openPrefs(page)
    await expect(page.getByText('95–160 min')).toBeVisible()
    await freeze(page)
    await expect(page).toHaveScreenshot('preferences-loaded-desktop.png')
  })

  test('desktop — recommendation-data dialog (read-only)', async ({ page }) => {
    await installPreferencesFixture(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(DESKTOP)
    await openPrefs(page)
    await page.getByRole('button', { name: 'Review' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await freeze(page)
    await expect(page.getByRole('dialog')).toHaveScreenshot('preferences-data-dialog-desktop.png')
  })

  test('desktop — dirty save dock', async ({ page }) => {
    await installPreferencesFixture(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(DESKTOP)
    await openPrefs(page)
    await moodLess(page).click()
    await expect(page.getByRole('region', { name: /unsaved preference changes/i })).toBeVisible()
    await freeze(page)
    await expect(page.getByRole('region', { name: /unsaved preference changes/i })).toHaveScreenshot('preferences-dirty-dock-desktop.png')
  })

  test('desktop — concurrency conflict banner', async ({ page }) => {
    await installPreferencesFixture(page, { rpc: 'conflict' })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(DESKTOP)
    await openPrefs(page)
    await moodLess(page).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('region', { name: 'Save conflict' })).toBeVisible()
    await freeze(page)
    await expect(page.getByRole('region', { name: 'Save conflict' })).toHaveScreenshot('preferences-conflict-desktop.png')
  })

  // ── Mobile 390×844 ──────────────────────────────────────────────────────────────
  test('mobile — loaded first fold', async ({ page }) => {
    await installPreferencesFixture(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(MOBILE)
    await openPrefs(page)
    await expect(page.getByText('95–160 min')).toBeVisible()
    await freeze(page)
    await expect(page).toHaveScreenshot('preferences-loaded-mobile.png')
  })

  test('mobile — recommendation-data dialog', async ({ page }) => {
    await installPreferencesFixture(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(MOBILE)
    await openPrefs(page)
    await page.getByRole('button', { name: 'Review' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await freeze(page)
    await expect(page.getByRole('dialog')).toHaveScreenshot('preferences-data-dialog-mobile.png')
  })

  test('mobile — critical load error (fail closed, no editable controls)', async ({ page }) => {
    await installPreferencesFixture(page, { settingsError: true })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(MOBILE)
    await page.goto('/preferences')
    await expect(page.getByText(/could not load your preferences/i)).toBeVisible({ timeout: 20_000 })
    await freeze(page)
    await expect(page).toHaveScreenshot('preferences-load-error-mobile.png')
  })

  test('mobile — dirty save dock above bottom nav', async ({ page }) => {
    await installPreferencesFixture(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(MOBILE)
    await openPrefs(page)
    await moodLess(page).click()
    await expect(page.getByRole('region', { name: /unsaved preference changes/i })).toBeVisible()
    await freeze(page)
    await expect(page.getByRole('region', { name: /unsaved preference changes/i })).toHaveScreenshot('preferences-dirty-dock-mobile.png')
  })
})
