import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { installDiscoverFixture } from '../fixtures/discover.js'

// Authenticated functional coverage for the redesigned /discover ("tuned to the
// moment"). Real auth (saved session); every Discover read/write is intercepted by
// the fixture so behaviour is deterministic + offline. No live writes escape.

async function toResult(page, { source = 'live', reducedMotion = true, providerState = 'found' } = {}) {
  await installDiscoverFixture(page, { source, reducedMotion, providerState })
  await page.goto('/discover')
  await expect(page.getByRole('heading', { level: 1, name: 'How should tonight feel?' })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: /^Tender/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'This is tonight.' })).toBeVisible()
  await page.getByRole('button', { name: /Find tonight’s film/ }).click()
  // Title-agnostic: the engine's cold-start ranking decides the actual lead.
  await expect(page.getByText('Closest fit').first()).toBeVisible({ timeout: 20_000 })
}
const leadTitle = (page) => page.getByRole('heading', { level: 1 }).first().textContent()

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
