import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Runtime accessibility gate — the layer eslint-plugin-jsx-a11y (static) can't
// see: focus order, ARIA validity, computed contrast in the live DOM. Fails on
// serious/critical WCAG 2.1 A/AA violations on the public (logged-out) surfaces.
//
// `color-contrast` is intentionally NOT blocking: the editorial design uses
// deliberate low-opacity text for hierarchy (eyebrows, muted labels), which is a
// design decision tracked separately — not a code regression. Everything else
// (labels, roles, names, focus) IS gated, and currently passes clean.

const BLOCKING = ['serious', 'critical']
const NON_BLOCKING_RULES = ['color-contrast']
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

function summarize(violations) {
  if (!violations.length) return '(none)'
  return violations
    .map(
      (v) =>
        `  [${v.impact}] ${v.id} — ${v.help}\n` +
        `    ${v.nodes.length} node(s), e.g. \`${v.nodes[0]?.target?.join(' ')}\`\n` +
        `    ${v.helpUrl}`
    )
    .join('\n\n')
}

async function audit(page, label) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const blocking = violations.filter(
    (v) => BLOCKING.includes(v.impact) && !NON_BLOCKING_RULES.includes(v.id)
  )
  const contrast = violations.find((v) => v.id === 'color-contrast')
  // Surface contrast as an advisory (not a failure) so regressions are visible.
  console.log(
    `\n[a11y] ${label}: ${blocking.length} blocking` +
      (contrast ? `, ${contrast.nodes.length} color-contrast (advisory)` : '')
  )
  if (violations.length) console.log(summarize(violations))
  expect(blocking, `${label} — serious/critical a11y violations:\n${summarize(blocking)}`).toEqual([])
}

test('a11y — landing (/)', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await audit(page, 'landing /')
})

test('a11y — landing under default, forced-colors and reduced-motion', async ({ page }) => {
  for (const media of [{}, { forcedColors: 'active' }, { reducedMotion: 'reduce' }]) {
    // Reset, then apply, so each pass is isolated and nothing leaks between runs.
    await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference', ...media })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await audit(page, `landing ${JSON.stringify(media)}`)
  }
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' })
})

test('a11y — about (/about) under default, forced-colors and reduced-motion', async ({ page }) => {
  for (const media of [{}, { forcedColors: 'active' }, { reducedMotion: 'reduce' }]) {
    await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference', ...media })
    await page.goto('/about')
    await page.waitForLoadState('networkidle')
    await audit(page, `about ${JSON.stringify(media)}`)
  }
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' })
})

test('a11y — privacy (/privacy) under default, forced-colors and reduced-motion', async ({ page }) => {
  for (const media of [{}, { forcedColors: 'active' }, { reducedMotion: 'reduce' }]) {
    await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference', ...media })
    await page.goto('/privacy')
    await page.waitForLoadState('networkidle')
    await audit(page, `privacy ${JSON.stringify(media)}`)
  }
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' })
})
