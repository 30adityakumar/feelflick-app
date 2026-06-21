import { test, expect } from '@playwright/test'
import { installProfileFixture } from '../fixtures/profile.js'

// Authoritative authenticated visual baselines for the Cinematic DNA redesign (/profile).
// Runs under the `visual-app` project (real dev-user sign-in + saved session). Every Profile
// read/write, the editorial Edge Function, and all images are intercepted by the deterministic
// fixture, so the route is fully offline + reproducible (fixed clock + seeded RNG + reduced motion
// + animation freeze + DSF 1). The AUTHENTICATED header is hidden (it carries the signed-in
// account avatar/identity) but the BottomNav is KEPT on mobile so reachability states are real.
//
// Scope = the distinct compositions + truthfulness / maturity / reachability / nav-IA / editorial /
// system states of the approved (locked-prototype) surface. Refresh button-text permutations
// (generating/success/error) and the build-flag-disabled state are deterministically covered by the
// unit + e2e suites (they are button-row text / build-time flag states, not stable pixel
// compositions) and by the screenshot-review bundle; they are intentionally not pixel-baselined.

const D_WIDE = { width: 1440, height: 900 }
const DESKTOP = { width: 1280, height: 800 }
const D_SHORT = { width: 1366, height: 650 }
const MOBILE = { width: 390, height: 844 }
const MOBILE_SM = { width: 320, height: 812 }
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
// Hide the authenticated header (avatar/identity) + the top progress bar. KEEP the BottomNav so the
// mobile reachability baselines are honest.
const HIDE_HEADER = 'header,.fixed.top-0.left-0.right-0{display:none!important}'

async function open(page, mode, vp, opts = {}) {
  await installProfileFixture(page, { mode, reducedMotion: true, ...opts })
  await page.setViewportSize(vp)
  await page.goto(opts.path || '/profile')
  const ready = opts.state || '#cinematic-dna-content'
  await expect(page.locator(ready).first()).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(150)
}
async function freeze(page) { await page.addStyleTag({ content: FREEZE + HIDE_HEADER }); await page.waitForTimeout(150) }
async function scrollToSel(page, sel) { await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'start' }), sel); await page.waitForTimeout(400) }
async function openEvidence(page) { await page.getByRole('button', { name: /why this read/i }).first().click(); await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8_000 }); await page.waitForTimeout(200) }
const el = (page, sel) => expect(page.locator(sel).first())
const view = (page) => expect(page)

test.describe('Cinematic DNA — authenticated visual baselines', () => {
  // ── Desktop established / rich compositions ───────────────────────────────────
  test('portrait hero — desktop 1440', async ({ page }) => { await open(page, 'established_rich', D_WIDE); await freeze(page); await el(page, '#dna-portrait').toHaveScreenshot('dna-portrait-desktop-1440.png') })
  test('portrait hero — desktop 1280', async ({ page }) => { await open(page, 'established_rich', DESKTOP); await freeze(page); await el(page, '#dna-portrait').toHaveScreenshot('dna-portrait-desktop-1280.png') })
  test('portrait hero — short height 1366x650', async ({ page }) => { await open(page, 'established_rich', D_SHORT); await freeze(page); await view(page).toHaveScreenshot('dna-portrait-short-1366.png') })
  test('response (rating language) — desktop', async ({ page }) => { await open(page, 'established_rich', DESKTOP); await freeze(page); await scrollToSel(page, '#dna-response'); await el(page, '#dna-response').toHaveScreenshot('dna-response-desktop.png') })
  test('journey three chapters — desktop', async ({ page }) => { await open(page, 'established_rich', DESKTOP); await freeze(page); await scrollToSel(page, '#dna-journey'); await el(page, '#dna-journey').toHaveScreenshot('dna-journey-three-desktop.png') })
  test('journey two chapters — desktop', async ({ page }) => { await open(page, 'established_current', DESKTOP); await freeze(page); await scrollToSel(page, '#dna-journey'); await el(page, '#dna-journey').toHaveScreenshot('dna-journey-two-desktop.png') })
  test('voices — desktop', async ({ page }) => { await open(page, 'established_rich', DESKTOP); await freeze(page); await scrollToSel(page, '#dna-voices'); await el(page, '#dna-voices').toHaveScreenshot('dna-voices-desktop.png') })
  test('passport — desktop', async ({ page }) => { await open(page, 'established_rich', DESKTOP); await freeze(page); await scrollToSel(page, '#dna-passport'); await el(page, '#dna-passport').toHaveScreenshot('dna-passport-desktop.png') })
  test('evidence sheet (current) — desktop', async ({ page }) => { await open(page, 'established_rich', DESKTOP); await freeze(page); await openEvidence(page); await el(page, '.ff-dna-sheet').toHaveScreenshot('dna-evidence-current-desktop.png') })

  // ── Section navigation (Portrait-first IA + active states) ────────────────────
  test('nav — Portrait active at page top', async ({ page }) => { await open(page, 'established_rich', DESKTOP); await freeze(page); await el(page, '.ff-dna-nav').toHaveScreenshot('dna-nav-portrait-active.png') })
  test('nav — Response active after scroll', async ({ page }) => { await open(page, 'established_rich', DESKTOP); await freeze(page); await scrollToSel(page, '#dna-response'); await el(page, '.ff-dna-nav').toHaveScreenshot('dna-nav-response-active.png') })
  test('nav — Voices active after scroll', async ({ page }) => { await open(page, 'established_rich', DESKTOP); await freeze(page); await scrollToSel(page, '#dna-voices'); await el(page, '.ff-dna-nav').toHaveScreenshot('dna-nav-voices-active.png') })
  test('nav — Passport active after scroll', async ({ page }) => { await open(page, 'established_rich', DESKTOP); await freeze(page); await scrollToSel(page, '#dna-passport'); await el(page, '.ff-dna-nav').toHaveScreenshot('dna-nav-passport-active.png') })

  // ── Mobile compositions ───────────────────────────────────────────────────────
  test('portrait hero — mobile 390 (compact density)', async ({ page }) => { await open(page, 'established_rich', MOBILE); await freeze(page); await el(page, '#dna-portrait').toHaveScreenshot('dna-portrait-mobile-390.png') })
  test('portrait hero — mobile 320', async ({ page }) => { await open(page, 'established_rich', MOBILE_SM); await freeze(page); await el(page, '#dna-portrait').toHaveScreenshot('dna-portrait-mobile-320.png') })
  test('response — mobile', async ({ page }) => { await open(page, 'established_rich', MOBILE); await freeze(page); await scrollToSel(page, '#dna-response'); await el(page, '#dna-response').toHaveScreenshot('dna-response-mobile.png') })
  test('journey — mobile', async ({ page }) => { await open(page, 'established_rich', MOBILE); await freeze(page); await scrollToSel(page, '#dna-journey'); await el(page, '#dna-journey').toHaveScreenshot('dna-journey-mobile.png') })
  test('voices — mobile', async ({ page }) => { await open(page, 'established_rich', MOBILE); await freeze(page); await scrollToSel(page, '#dna-voices'); await el(page, '#dna-voices').toHaveScreenshot('dna-voices-mobile.png') })
  test('passport card — mobile 390', async ({ page }) => { await open(page, 'established_rich', MOBILE); await freeze(page); await scrollToSel(page, '#dna-passport'); await el(page, '#dna-passport .ff-dna-passport').toHaveScreenshot('dna-passport-mobile-390.png') })
  test('passport card — mobile 320', async ({ page }) => { await open(page, 'established_rich', MOBILE_SM); await freeze(page); await scrollToSel(page, '#dna-passport'); await el(page, '#dna-passport .ff-dna-passport').toHaveScreenshot('dna-passport-mobile-320.png') })

  // ── Mobile reachability (shell visible: BottomNav kept) ───────────────────────
  test('passport actions clear BottomNav — mobile 390', async ({ page }) => { await open(page, 'established_rich', MOBILE); await freeze(page); await scrollToSel(page, '#dna-passport'); await page.locator('.ff-dna-share__actions').scrollIntoViewIfNeeded(); await page.waitForTimeout(200); await view(page).toHaveScreenshot('dna-passport-actions-mobile-390.png') })
  test('passport actions clear BottomNav — mobile 320', async ({ page }) => { await open(page, 'established_rich', MOBILE_SM); await freeze(page); await scrollToSel(page, '#dna-passport'); await page.locator('.ff-dna-share__actions').scrollIntoViewIfNeeded(); await page.waitForTimeout(200); await view(page).toHaveScreenshot('dna-passport-actions-mobile-320.png') })
  test('evidence actions clear BottomNav — mobile 390', async ({ page }) => { await open(page, 'established_rich', MOBILE); await freeze(page); await openEvidence(page); await page.locator('.ff-dna-sheet').evaluate((n) => { n.scrollTop = n.scrollHeight }); await page.waitForTimeout(200); await view(page).toHaveScreenshot('dna-evidence-end-mobile-390.png') })
  test('evidence actions clear BottomNav — mobile 320', async ({ page }) => { await open(page, 'established_rich', MOBILE_SM); await freeze(page); await openEvidence(page); await page.locator('.ff-dna-sheet').evaluate((n) => { n.scrollTop = n.scrollHeight }); await page.waitForTimeout(200); await view(page).toHaveScreenshot('dna-evidence-end-mobile-320.png') })

  // ── Evidence maturity ─────────────────────────────────────────────────────────
  test('forming — desktop', async ({ page }) => { await open(page, 'forming', DESKTOP); await freeze(page); await el(page, '#cinematic-dna-content').toHaveScreenshot('dna-forming-desktop.png') })
  test('forming — mobile', async ({ page }) => { await open(page, 'forming', MOBILE); await freeze(page); await el(page, '#cinematic-dna-content').toHaveScreenshot('dna-forming-mobile.png') })
  test('taking shape — desktop', async ({ page }) => { await open(page, 'emerging', DESKTOP); await freeze(page); await el(page, '#dna-portrait').toHaveScreenshot('dna-takingshape-desktop.png') })
  test('established + evidence-still-growing band — desktop', async ({ page }) => { await open(page, 'established_current', DESKTOP); await freeze(page); await el(page, '#dna-portrait').toHaveScreenshot('dna-lowband-desktop.png') })
  test('established + evidence-still-growing band — mobile', async ({ page }) => { await open(page, 'established_current', MOBILE); await freeze(page); await el(page, '#dna-portrait').toHaveScreenshot('dna-lowband-mobile.png') })

  // ── Editorial state (evidence sheet) ──────────────────────────────────────────
  test('editorial stale — desktop (Generate prompt)', async ({ page }) => { await open(page, 'established_stale', DESKTOP); await freeze(page); await openEvidence(page); await el(page, '.ff-dna-sheet').toHaveScreenshot('dna-evidence-stale-desktop.png') })
  test('editorial missing — desktop (Generate prompt)', async ({ page }) => { await open(page, 'established_missing', DESKTOP); await freeze(page); await openEvidence(page); await el(page, '.ff-dna-sheet').toHaveScreenshot('dna-evidence-missing-desktop.png') })

  // ── System states ─────────────────────────────────────────────────────────────
  test('error — desktop (safe copy)', async ({ page }) => { await open(page, 'load_error', DESKTOP, { state: '[role="alert"]' }); await freeze(page); await el(page, '.ff-dna-state').toHaveScreenshot('dna-error-desktop.png') })
  test('private other-user — desktop (no fetch)', async ({ page }) => { await open(page, 'established_rich', DESKTOP, { path: '/profile/other-user-9999', state: 'h1' }); await freeze(page); await el(page, '.ff-dna-state').toHaveScreenshot('dna-private-desktop.png') })
})
