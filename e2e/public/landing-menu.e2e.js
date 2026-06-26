import { test, expect } from '@playwright/test'

// Mobile-menu dialog behavior on the public landing. Uses stable role/name
// selectors (not implementation class names) wherever possible.
test.use({ viewport: { width: 390, height: 844 } })

async function openMenu(page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /movies, made personal/i })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: /^menu$/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  return dialog
}

test('opens as a modal dialog and moves initial focus inside', async ({ page }) => {
  const dialog = await openMenu(page)
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  const insideOnOpen = await dialog.evaluate((d) => d.contains(document.activeElement))
  expect(insideOnOpen, 'initial focus is inside the dialog').toBe(true)
})

test('Tab stays within the dialog and Shift+Tab wraps', async ({ page }) => {
  const dialog = await openMenu(page)
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab')
    const inside = await dialog.evaluate((d) => d.contains(document.activeElement))
    expect(inside, `focus left dialog after ${i + 1} Tab(s)`).toBe(true)
  }
  await page.keyboard.press('Shift+Tab')
  expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
})

test('Escape closes the dialog and restores focus to the Menu trigger', async ({ page }) => {
  await openMenu(page)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const activeText = await page.evaluate(() => (document.activeElement?.textContent || '').trim())
  expect(activeText).toMatch(/^menu$/i)
})

test('locks body scroll while open and restores it after close', async ({ page }) => {
  await openMenu(page)
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden')
})

test('makes background content inert while open and clears inert after close', async ({ page }) => {
  await openMenu(page)
  const inertWhileOpen = await page.evaluate(() => document.querySelector('.ff-landing > main')?.hasAttribute('inert'))
  expect(inertWhileOpen, 'main is inert while dialog open').toBe(true)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const inertAfter = await page.evaluate(() => document.querySelector('.ff-landing > main')?.hasAttribute('inert'))
  expect(inertAfter, 'inert removed after close').toBe(false)
})
