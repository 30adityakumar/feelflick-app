import { test, expect } from '@playwright/test'

// Stabilized visual baseline for the v3 landing — the highest-value public
// surface, and the one most likely to silently drift on a design-system change
// (it caught nothing automatically during the Tailwind 4 migration).
//
// The landing is non-deterministic by nature, so we pin every moving part before
// snapshotting. It already honors prefers-reduced-motion, which does most of the
// work for free:
//   - reducedMotion:'reduce' → the hero never auto-rotates (stays on PICKS[0])
//                              and reveal-on-scroll renders in its final state
//   - clock.setFixedTime     → deterministic greeting eyebrow + footer year
//   - seeded Math.random      → deterministic starfield (the only RNG on the page)
//
// LOCAL-FIRST: snapshot baselines are platform-specific (see about.visual.js).
// Run: `npm run test:visual` (update: `npm run test:visual:update`).
test('landing — visual baseline (stabilized)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  // A fixed instant → the greeting ("{day} {part-of-day}") and the © year freeze.
  await page.clock.setFixedTime(new Date('2026-02-13T15:00:00'))
  // Seed the starfield RNG before any page script runs.
  await page.addInitScript(() => {
    let seed = 0x2bee5eed
    Math.random = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  // Belt-and-suspenders: collapse any residual animation/transition timing.
  await page.addStyleTag({
    content: '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}',
  })

  await expect(page).toHaveScreenshot('landing-fullpage.png', { fullPage: true })
})
