import { test, expect } from '@playwright/test'
import { installBrowseFixture } from '../fixtures/browse.js'

// Authenticated functional coverage for the redesigned /browse. Uses the saved
// session + an offline, deterministic data fixture so behaviour (URL contract,
// sort, paths, drawer, surprise, legacy migration) is asserted without the backend.

test.beforeEach(async ({ page }) => {
  await installBrowseFixture(page, { reducedMotion: true })
})

test('renders the masthead, curiosity paths and a finite poster grid', async ({ page }) => {
  await page.goto('/browse')
  await expect(page.getByRole('heading', { name: 'Follow your curiosity.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Start somewhere' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: /Open Film File for Browse Film 1$/ })).toBeVisible({ timeout: 20_000 })
})

test('default ordering is labelled honestly — never "For you" / Match %', async ({ page }) => {
  await page.goto('/browse')
  await expect(page.getByRole('button', { name: 'FeelFlick rating', exact: true })).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('body')).not.toContainText('For you')
  await expect(page.locator('body')).not.toContainText('Best fit')
  await expect(page.locator('body')).not.toContainText('% match')
})

test('Critics sort writes ff_critic_rating.desc to the URL', async ({ page }) => {
  await page.goto('/browse')
  await page.getByRole('button', { name: 'Critics', exact: true }).click()
  await expect(page).toHaveURL(/sort=ff_critic_rating\.desc/)
})

test('selecting a curiosity path opens its territory in the URL', async ({ page }) => {
  await page.goto('/browse')
  const hiddenGems = page.getByRole('button', { name: /Hidden gems/ })
  await hiddenGems.first().click()
  await expect(page).toHaveURL(/sort=discovery_potential\.desc/)
})

test('legacy avTonight + view params are normalized out of the canonical URL', async ({ page }) => {
  await page.goto('/browse?avTonight=1&view=list&genre=Drama')
  await expect(page.getByRole('heading', { name: 'Follow your curiosity.' })).toBeVisible()
  await expect(page).not.toHaveURL(/avTonight/)
  await expect(page).not.toHaveURL(/view=list/)
  await expect(page).toHaveURL(/genre=Drama/) // unrelated params preserved
})

test('legacy preset bundle is expanded into explicit filter params, marker dropped', async ({ page }) => {
  await page.goto('/browse?preset=cozy_night')
  await expect(page.getByRole('heading', { name: 'Follow your curiosity.' })).toBeVisible()
  // cozy_night = { intensity: chill, depth: surface, runtime: medium }
  await expect(page).toHaveURL(/intensity=chill/)
  await expect(page).toHaveURL(/depth=surface/)
  await expect(page).toHaveURL(/runtime=medium/)
  await expect(page).not.toHaveURL(/preset=/)
})

test('More filters opens an accessible drawer; Apply commits to the URL', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/browse')
  await expect(page.getByRole('button', { name: /Open Film File for Browse Film 1$/ })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: /More filters/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Advanced filters' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Slow burn' }).click()
  await dialog.getByRole('button', { name: 'Apply filters' }).click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/pacing=slow/)
})

test('Surprise opens a confirmation dialog (not a direct navigation)', async ({ page }) => {
  await page.goto('/browse')
  await expect(page.getByRole('button', { name: /Open Film File for Browse Film 1$/ })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: /Surprise me within these filters/ }).click()
  await expect(page.getByRole('dialog', { name: /within your current filters/ })).toBeVisible()
  await expect(page).toHaveURL(/\/browse(?:[/?#]|$)/) // still on /browse, not navigated to a film
})

test('a supported genre is genuinely forwarded to TMDB in text-search mode (Sci-Fi → 878)', async ({ page }) => {
  // Honesty: a genre chip shown as applied while searching must actually constrain
  // the TMDB query. "Sci-Fi" (Browse value / DB primary_genre) must map to TMDB's
  // Science Fiction id 878 in discover.
  const discoverUrls = []
  page.on('request', (r) => {
    const u = r.url()
    let host = ''
    try { host = new URL(u).hostname } catch { host = '' }
    if (host === 'api.themoviedb.org' && u.includes('/discover/movie')) discoverUrls.push(u)
  })
  await page.goto('/browse?genre=Sci-Fi&q=space')
  await expect(page.getByRole('heading', { name: 'Follow your curiosity.' })).toBeVisible()
  await expect.poll(() => discoverUrls.some((u) => /with_genres=878/.test(u)), { timeout: 20_000 }).toBe(true)
})

test('empty result keeps the honest filter-advice copy', async ({ page }) => {
  await installBrowseFixture(page, { reducedMotion: true, dataState: 'empty' })
  await page.goto('/browse')
  await expect(page.getByText('Nothing matches.')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Loosen a filter, or clear them all.')).toBeVisible()
})
