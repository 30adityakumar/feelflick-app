import { test, expect } from '@playwright/test'

// Regression gate: keyboard-focus visibility on the shared public Header chrome
// (SiteHeaderHost, rendered on /about and the other public pages) and on the 404
// page, asserted via COMPUTED STYLE — never className (className assertions
// previously passed while Tailwind v4 ring layers rendered fully transparent).
//
// The shared Header applies one focus-visible treatment (paper-white outline) to
// every control; this proves it actually computes. Runs logged-out (public
// project) because the anonymous Sign in CTA only renders for signed-out users —
// authenticated users see the avatar menu instead. Sibling of home-focus.e2e.js
// which guards /home.
//
// Mechanism note: the assertion is mechanism-agnostic — SOME visible indicator
// (a real outline OR a non-transparent box-shadow ring) must compute.

async function focusedIndicator(locator) {
  return await locator.evaluate((el) => {
    el.scrollIntoView({ block: 'center' })
    el.focus({ focusVisible: true })
    const cs = getComputedStyle(el)
    const transparent = (c) => c === 'transparent' || /rgba?\([^)]*[,/]\s*0\s*\)$/.test(c)
    const outlineVisible =
      cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && !transparent(cs.outlineColor)
    // A visible ring = a box-shadow layer with non-zero geometry and non-zero alpha.
    const ringVisible =
      cs.boxShadow !== 'none' &&
      cs.boxShadow.split(/,(?![^(]*\))/).some((layer) => {
        const l = layer.trim()
        if (/(^|\s)0px 0px 0px 0px$/.test(l)) return false
        return !/rgba?\([^)]*[,/]\s*0\s*\)|oklab\([^)]*\/\s*0\s*\)/.test(l)
      })
    return {
      focusVisible: el.matches(':focus-visible'),
      outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
      boxShadow: cs.boxShadow.slice(0, 120),
      visible: outlineVisible || ringVisible,
    }
  })
}

test('public Header + 404 keyboard focus is visible — computed style, not className', async ({ page }) => {
  // One real keypress per page sets Chrome's keyboard modality so programmatic
  // focus() matches :focus-visible, as real Tab navigation does.

  // --- shared Header on /about (public chrome, signed-out) ---
  await page.goto('/about')
  const signIn = page.getByRole('button', { name: /sign in with google/i }).first()
  await expect(signIn).toBeVisible({ timeout: 15_000 })
  await page.keyboard.press('Tab')

  const signInState = await focusedIndicator(signIn)
  expect(signInState.focusVisible, 'Sign in should match :focus-visible').toBe(true)
  expect(
    signInState.visible,
    `Header Sign in must show a visible focus indicator; got outline=[${signInState.outline}] boxShadow=[${signInState.boxShadow}]`
  ).toBe(true)

  const navLink = page.getByRole('link', { name: /discover|browse/i }).first()
  if (await navLink.count()) {
    const linkState = await focusedIndicator(navLink)
    expect(
      linkState.visible,
      `Header nav link must keep its visible focus treatment; got outline=[${linkState.outline}] boxShadow=[${linkState.boxShadow}]`
    ).toBe(true)
  }

  // --- 404 page ---
  await page.goto('/this-route-does-not-exist')
  await expect(page.getByText('Page not found')).toBeVisible({ timeout: 10_000 })
  await page.keyboard.press('Tab')

  for (const name of [/go home/i, /browse movies/i]) {
    const pill = page.getByRole('link', { name }).or(page.getByRole('button', { name })).first()
    await expect(pill).toBeVisible()
    const state = await focusedIndicator(pill)
    expect(
      state.visible,
      `404 "${name}" must show a visible focus indicator; got outline=[${state.outline}] boxShadow=[${state.boxShadow}]`
    ).toBe(true)
  }
})
