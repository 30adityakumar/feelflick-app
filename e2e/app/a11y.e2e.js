import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Runtime a11y on the authenticated surfaces (uses the saved session). Diagnostic
// for now — prints all violations; the blocking assertion excludes color-contrast
// (a deliberate editorial-design tension tracked separately).

const BLOCKING = ['serious', 'critical']
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

function summarize(violations) {
  if (!violations.length) return '(none)'
  return violations
    .map(
      (v) =>
        `  [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node(s), e.g. \`${v.nodes[0]?.target?.join(' ')}\`)`
    )
    .join('\n')
}

async function audit(page, label) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const blocking = violations.filter((v) => BLOCKING.includes(v.impact))
  const nonContrast = blocking.filter((v) => v.id !== 'color-contrast')
  console.log(
    `\n[a11y] ${label}: ${violations.length} total, ${blocking.length} blocking ` +
      `(${nonContrast.length} excluding contrast)\n${summarize(violations)}`
  )
  expect(nonContrast, `${label} — non-contrast serious/critical:\n${summarize(nonContrast)}`).toEqual([])
}

test('a11y — home (/home)', async ({ page }) => {
  await page.goto('/home')
  await page.waitForLoadState('networkidle')
  await audit(page, '/home')
})

test('a11y — film detail (/movie/:id)', async ({ page }) => {
  await page.goto('/home')
  // Cards navigate on click (onClick, not <a href>) — match the recommendations e2e.
  const poster = page.locator('img[src*="image.tmdb.org"]').first()
  await expect(poster).toBeVisible({ timeout: 20_000 })
  await poster.click()
  await expect(page).toHaveURL(/\/movie\/\d+/, { timeout: 15_000 })
  await page.waitForLoadState('networkidle')
  await audit(page, '/movie/:id')
})
