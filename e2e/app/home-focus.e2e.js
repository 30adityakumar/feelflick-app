import { test, expect } from '@playwright/test'

// F1-A regression gate: keyboard focus on the Briefing's interactive elements must
// be VISIBLE in the rendered page. Asserted via COMPUTED STYLE, never className —
// the original bug shipped behind className assertions while the Tailwind v4 ring
// utilities rendered fully transparent at runtime (focus-visible:ring-2 computes to
// an oklab(... / 0) 0px box-shadow layer). Visibility currently comes from the
// global :focus-visible outline in src/styles/globals.css, which component-level
// `focus:outline-none` used to suppress.

const TARGETS = [
  { label: 'gradient CTA', locate: (page) => page.getByRole('button', { name: 'Open Film File', exact: true }) },
  { label: 'Mark Watched', locate: (page) => page.getByRole('button', { name: /^(Mark Watched|Watched)$/ }).first() },
  { label: 'Save', locate: (page) => page.getByRole('button', { name: /^(Save|Saved)$/ }).first() },
  { label: 'Not tonight', locate: (page) => page.getByRole('button', { name: 'Not tonight', exact: true }) },
  { label: 'first mood pill', locate: (page) => page.locator('[role="group"][aria-label="Adjust tonight’s mood"] button, [role="group"][aria-label="Adjust tonight\'s mood"] button').first() },
  { label: 'first seeding card', locate: (page) => page.getByRole('button', { name: /^Mark .+ as watched$/ }).first() },
]

async function focusedIndicator(locator) {
  return await locator.evaluate((el) => {
    el.scrollIntoView({ block: 'center' })
    el.focus({ focusVisible: true })
    const cs = getComputedStyle(el)
    const transparent = (c) => c === 'transparent' || /rgba?\([^)]*[,/]\s*0\s*\)$/.test(c)
    const outlineVisible =
      cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && !transparent(cs.outlineColor)
    const shadowVisible =
      cs.boxShadow !== 'none' &&
      cs.boxShadow.split(/,(?![^(]*\))/).some(
        (layer) => !/0px 0px 0px 0px/.test(layer) || !/rgba?\([^)]*[,/]\s*0\s*\)|oklab\([^)]*\/\s*0\s*\)/.test(layer)
      )
    return {
      focusVisible: el.matches(':focus-visible'),
      outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
      boxShadow: cs.boxShadow.slice(0, 120),
      visible: outlineVisible || shadowVisible,
    }
  })
}

test('home keyboard focus is visible — computed style, not className', async ({ page }) => {
  await page.goto('/home')
  // The briefing pick loads async; its primary CTA is the readiness signal.
  await expect(page.getByRole('button', { name: 'Open Film File', exact: true })).toBeVisible({ timeout: 20_000 })

  // One real keypress sets Chrome's keyboard-interaction modality so subsequent
  // programmatic focus() calls match :focus-visible, exactly as Tab navigation does.
  await page.keyboard.press('Tab')

  for (const t of TARGETS) {
    const locator = t.locate(page)
    await expect(locator, `${t.label} should be present`).toBeVisible({ timeout: 10_000 })
    const ind = await focusedIndicator(locator)
    expect(ind.focusVisible, `${t.label} should match :focus-visible when focused`).toBe(true)
    expect(
      ind.visible,
      `${t.label} must show a visible computed focus indicator (outline or box-shadow); got outline=[${ind.outline}] boxShadow=[${ind.boxShadow}]`
    ).toBe(true)
  }
})
