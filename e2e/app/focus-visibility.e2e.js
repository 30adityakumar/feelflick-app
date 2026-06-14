import { test, expect } from '@playwright/test'

// F1-B regression gate: keyboard-focus visibility on TopNav (public-page chrome)
// and the 404 page, asserted via COMPUTED STYLE — never className (className
// assertions previously passed while Tailwind v4 ring layers rendered fully
// transparent). Sibling of home-focus.e2e.js (F1-A) which guards /home.
//
// Mechanism note: some elements get a working focus ring (TopNav links), others'
// rings collapse and rely on the global :focus-visible outline now that their
// focus:outline-none suppression is removed (TopNav Sign In / menu CTA). The
// assertion is mechanism-agnostic: SOME visible indicator must compute.

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

test('TopNav and 404 keyboard focus is visible — computed style, not className', async ({ page }) => {
  // One real keypress per page sets Chrome's keyboard modality so programmatic
  // focus() matches :focus-visible, as real Tab navigation does.

  // --- TopNav on /about (public chrome) ---
  await page.goto('/about')
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 15_000 })
  await page.keyboard.press('Tab')

  const signIn = page.locator('button.md\\:inline-flex', { hasText: /sign in/i }).first()
  const signInState = await focusedIndicator(signIn)
  expect(signInState.focusVisible, 'Sign In should match :focus-visible').toBe(true)
  expect(
    signInState.visible,
    `TopNav Sign In must show a visible focus indicator; got outline=[${signInState.outline}] boxShadow=[${signInState.boxShadow}]`
  ).toBe(true)

  const navLink = page.locator('nav a, header a', { hasText: /how it works/i }).first()
  if (await navLink.count()) {
    const linkState = await focusedIndicator(navLink)
    expect(
      linkState.visible,
      `TopNav nav link must keep its visible focus treatment; got outline=[${linkState.outline}] boxShadow=[${linkState.boxShadow}]`
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
