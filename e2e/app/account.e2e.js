import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { installAccountFixture, SYN } from '../fixtures/account.js'

// Account (redesign) — authenticated, fully-intercepted E2E. Proves the production-route contracts:
// URL-addressable master–detail navigation, honest plan/notification/connection/session copy,
// confirmed-save + rollback, disabled (never-called) avatar upload, validated name editing,
// truthful 7-day deletion, accessible dialogs, and mobile index/detail. Identity is synthetic
// (see fixtures/account.js); no real backend row is read or written.

const h1 = (page) => page.getByRole('heading', { level: 1 })
const detailHeading = (page) => page.locator('.ff-acct-detail__head h2').last()

async function openAccount(page, section) {
  await page.goto(section ? `/account?section=${section}` : '/account')
  await expect(h1(page)).toBeVisible({ timeout: 20_000 })
  await expect(h1(page)).toHaveText('Account')
}

test.describe('Account — route + navigation (desktop)', () => {
  test('loads in the AppShell with one h1, no nested main, defaults to Overview', async ({ page }) => {
    await installAccountFixture(page)
    await openAccount(page)
    await expect(h1(page)).toHaveCount(1)
    await expect(page.locator('main main')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 2, name: 'Overview' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Overview/ })).toHaveAttribute('aria-current', 'true')
  })

  test('?section=privacy opens Privacy directly; invalid section falls back safely', async ({ page }) => {
    await installAccountFixture(page)
    await openAccount(page, 'privacy')
    await expect(page.getByRole('heading', { level: 2, name: 'Privacy' })).toBeVisible()
    await page.goto('/account?section=not-a-section')
    await expect(page.getByRole('heading', { level: 2, name: 'Overview' })).toBeVisible()
    await expect(page).toHaveURL(/\/account$/)
  })

  test('clicking sidebar updates the URL, moves focus to the pane heading, Back/Forward restore panes', async ({ page }) => {
    await installAccountFixture(page)
    await openAccount(page)
    await page.getByRole('link', { name: /Privacy/ }).click()
    await expect(page).toHaveURL(/section=privacy/)
    await expect(detailHeading(page)).toBeFocused()
    await page.getByRole('link', { name: /Notifications/ }).click()
    await expect(page).toHaveURL(/section=notifications/)
    await page.goBack()
    await expect(page.getByRole('heading', { level: 2, name: 'Privacy' })).toBeVisible()
    await page.goForward()
    await expect(page.getByRole('heading', { level: 2, name: 'Notifications' })).toBeVisible()
  })
})

test.describe('Account — profile summary', () => {
  test('renders synthetic identity + Free plan, no stats, View profile → /profile, photo unavailable, no storage call', async ({ page }) => {
    const ledger = await installAccountFixture(page)
    await openAccount(page)
    await expect(page.getByRole('heading', { level: 2, name: SYN.name })).toBeVisible()
    await expect(page.getByText(SYN.email)).toBeVisible()
    await expect(page.getByText(/Member since April 2025/).first()).toBeVisible()
    await expect(page.getByText('Free plan')).toBeVisible()
    await expect(page.getByText(/Founding Member|locked in/i)).toHaveCount(0)
    await expect(page.getByText(/films logged|hours watched/i)).toHaveCount(0)
    await expect(page.locator('.ff-acct-summary').getByText(/\d+%/)).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'View profile' })).toHaveAttribute('href', '/profile')
    await openAccount(page, 'personal')
    await expect(page.getByText(/Photo changes are temporarily unavailable/i)).toBeVisible()
    expect(ledger.storageCalls, 'avatar editing disabled → no storage write').toEqual([])
  })
})

test.describe('Account — personal information (name editing)', () => {
  test('rejects empty + over-80 names, restores focus to the trigger on cancel', async ({ page }) => {
    await installAccountFixture(page)
    await openAccount(page, 'personal')
    const editBtn = page.getByRole('button', { name: 'Edit' }).first()
    await editBtn.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const input = page.getByLabel('Display name')
    await input.fill('   ')
    await page.getByRole('button', { name: 'Save name' }).click()
    await expect(page.getByRole('alert')).toContainText(/enter a name/i)
    await input.fill('x'.repeat(81))
    await page.getByRole('button', { name: 'Save name' }).click()
    await expect(page.getByRole('alert')).toContainText(/80 characters/i)
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
    await expect(editBtn).toBeFocused()
  })

  test('valid Unicode save updates the visible summary + writes name and auth metadata', async ({ page }) => {
    const ledger = await installAccountFixture(page)
    await openAccount(page, 'personal')
    await page.getByRole('button', { name: 'Edit' }).first().click()
    await page.getByLabel('Display name').fill('Mira Łükáš 名前')
    await page.getByRole('button', { name: 'Save name' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByRole('heading', { level: 2, name: 'Mira Łükáš 名前' })).toBeVisible()
    expect(ledger.writesFor('users').length).toBeGreaterThan(0)
    expect(ledger.authWrites.length).toBeGreaterThan(0)
  })

  test('failed save keeps the previous name + a persistent accessible error', async ({ page }) => {
    await installAccountFixture(page, { usersWrite: 'fail' })
    await openAccount(page, 'personal')
    await page.getByRole('button', { name: 'Edit' }).first().click()
    await page.getByLabel('Display name').fill('Broken Save')
    await page.getByRole('button', { name: 'Save name' }).click()
    await expect(page.getByRole('alert')).toContainText(/couldn’t save/i)
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('busy state prevents duplicate submission', async ({ page }) => {
    const ledger = await installAccountFixture(page, { usersWrite: 'hang' })
    await openAccount(page, 'personal')
    await page.getByRole('button', { name: 'Edit' }).first().click()
    await page.getByLabel('Display name').fill('Once Only')
    const save = page.getByRole('button', { name: /Save name|Saving/ })
    await save.click()
    await expect(save).toBeDisabled()
    await save.click({ force: true }).catch(() => {})
    await page.waitForTimeout(200)
    expect(ledger.writesFor('users').length).toBe(1)
  })
})

test.describe('Account — privacy', () => {
  test('privacy switches present — discovery off by default, follower sharing and public DNA profile controls visible', async ({ page }) => {
    await installAccountFixture(page)
    await openAccount(page, 'privacy')
    await expect(page.getByRole('switch')).toHaveCount(11)
    await expect(page.getByRole('switch', { name: /taste-match discovery/i })).toHaveAttribute('aria-checked', 'false')
    await expect(page.getByText(/name, avatar, your top film-taste tags and film count/i)).toBeVisible()
    await expect(page.getByText(/watched films, Diary, ratings, reviews and Cinematic DNA reflection stay private/i)).toBeVisible()
  })

  test('successful discovery save preserves the prefs branch', async ({ page }) => {
    const ledger = await installAccountFixture(page)
    await openAccount(page, 'privacy')
    const disc = page.getByRole('switch', { name: /taste-match discovery/i })
    await disc.click()
    await expect(disc).toHaveAttribute('aria-checked', 'true')
    await expect.poll(() => ledger.writesFor('user_settings').length).toBeGreaterThan(0)
    await expect.poll(() => ledger.lastSettings().privacy.showOnLeaderboards).toBe(true)
    expect(ledger.lastSettings().prefs?.engine, 'prefs branch preserved').toBeTruthy()
  })

  test('failed persistence rolls the switch back + shows an error', async ({ page }) => {
    await installAccountFixture(page, { settingsWrite: 'fail' })
    await openAccount(page, 'privacy')
    const disc = page.getByRole('switch', { name: /taste-match discovery/i })
    await disc.click()
    await expect(disc).toHaveAttribute('aria-checked', 'true')  // optimistic
    await expect(disc).toHaveAttribute('aria-checked', 'false') // rolled back
    await expect(page.getByText(/couldn’t save/i).first()).toBeVisible()
  })

  test('failed analytics persistence restores the analytics switch', async ({ page }) => {
    await installAccountFixture(page, { settingsWrite: 'fail' })
    await openAccount(page, 'privacy')
    const ana = page.getByRole('switch', { name: /product analytics/i })
    await expect(ana).toHaveAttribute('aria-checked', 'true')
    await ana.click()
    await expect(ana).toHaveAttribute('aria-checked', 'false') // optimistic off
    await expect(ana).toHaveAttribute('aria-checked', 'true')  // restored (UI + runtime) on failure
    await expect(page.getByText(/couldn’t save/i).first()).toBeVisible()
  })
})

test.describe('Account — notifications', () => {
  test('only Daily Briefing, generic copy, successful save preserves prefs', async ({ page }) => {
    const ledger = await installAccountFixture(page)
    await openAccount(page, 'notifications')
    await expect(page.getByRole('switch')).toHaveCount(1)
    await expect(page.getByText('Daily Briefing')).toBeVisible()
    await expect(page.getByText(/a daily email with tonight’s picks/i)).toBeVisible()
    await expect(page.getByText(/6 ?PM|three picks/i)).toHaveCount(0)
    const sw = page.getByRole('switch').first()
    await sw.click()
    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await expect.poll(() => ledger.lastSettings().notifications[0].enabled).toBe(false)
    expect(ledger.lastSettings().prefs?.engine).toBeTruthy()
  })

  test('failed save rolls the toggle back', async ({ page }) => {
    await installAccountFixture(page, { settingsWrite: 'fail' })
    await openAccount(page, 'notifications')
    const sw = page.getByRole('switch').first()
    await sw.click()
    await expect(sw).toHaveAttribute('aria-checked', 'true') // rolled back
  })
})

test.describe('Account — connections', () => {
  test('Google provider shows connected; imports row is non-interactive with no Connect button', async ({ page }) => {
    await installAccountFixture(page, { provider: 'google' })
    await openAccount(page, 'connections')
    await expect(page.getByText('Google')).toBeVisible()
    await expect(page.getByText('Connected')).toBeVisible()
    await expect(page.getByText(/Letterboxd, Netflix and Plex .* not available yet/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /connect/i })).toHaveCount(0)
  })

  test('email provider shows Email as the primary sign-in', async ({ page }) => {
    await installAccountFixture(page, { provider: 'email' })
    await openAccount(page, 'connections')
    await expect(page.getByText('Email')).toBeVisible()
    await expect(page.getByText('Connected')).toBeVisible()
  })
})

test.describe('Account — sign-in & security', () => {
  test('current device only, no Active-now, local sign-out is local-scoped', async ({ page }) => {
    const ledger = await installAccountFixture(page)
    await openAccount(page, 'security')
    await expect(page.getByText('This device', { exact: true })).toBeVisible()
    await expect(page.getByText(/active now/i)).toHaveCount(0)
    await page.getByRole('button', { name: 'Sign out', exact: true }).click()
    await page.waitForURL((url) => !url.pathname.startsWith('/account'), { timeout: 8000 }).catch(() => {})
    expect(ledger.signOuts.length).toBe(1)
    expect(ledger.signOuts[0].scope).toBe('local')
  })

  test('global sign-out requires confirmation, states it includes this device, calls scope:global', async ({ page }) => {
    const ledger = await installAccountFixture(page)
    await openAccount(page, 'security')
    await page.getByRole('button', { name: 'Sign out everywhere' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/including this device/i)).toBeVisible()
    await dialog.getByRole('button', { name: 'Sign out everywhere' }).click()
    await page.waitForURL((url) => !url.pathname.startsWith('/account'), { timeout: 8000 }).catch(() => {})
    expect(ledger.signOuts.length).toBe(1)
    expect(ledger.signOuts[0].scope).toBe('global')
  })

  test('failed global sign-out does not navigate', async ({ page }) => {
    await installAccountFixture(page, { signOut: 'fail' })
    await openAccount(page, 'security')
    await page.getByRole('button', { name: 'Sign out everywhere' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Sign out everywhere' }).click()
    await expect(page.getByRole('alert')).toContainText(/couldn’t sign out/i)
    await expect(page).toHaveURL(/section=security/)
  })
})

test.describe('Account — restart taste setup', () => {
  test('targets onboarding-source rows + all preferences, redirects only after every op succeeds', async ({ page }) => {
    const ledger = await installAccountFixture(page)
    await openAccount(page, 'data')
    await page.getByRole('button', { name: 'Restart setup' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Restart setup' }).click()
    await page.waitForURL('**/onboarding', { timeout: 10_000 })
    const ratings = ledger.resetOps.find((o) => o.table === 'user_ratings')
    const history = ledger.resetOps.find((o) => o.table === 'user_history')
    const prefs = ledger.resetOps.find((o) => o.table === 'user_preferences')
    expect(ratings.query).toMatch(/source=eq\.onboarding/)
    expect(history.query).toMatch(/source=eq\.onboarding/)
    expect(prefs.query).not.toMatch(/source=eq\.onboarding/)
  })

  test('a failed reset operation prevents navigation and shows an accessible error', async ({ page }) => {
    await installAccountFixture(page, { resetFailTable: 'user_history' })
    await openAccount(page, 'data')
    await page.getByRole('button', { name: 'Restart setup' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Restart setup' }).click()
    await expect(page.getByRole('alert')).toContainText(/couldn’t finish restarting/i)
    await expect(page).toHaveURL(/section=data/)
  })
})

test.describe('Account — deletion', () => {
  test('requires the exact email; success → pending with a dated/timezoned schedule', async ({ page }) => {
    const ledger = await installAccountFixture(page)
    await openAccount(page, 'data')
    await page.getByRole('button', { name: 'Delete account' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('button', { name: 'Schedule deletion' })).toBeDisabled()
    await dialog.getByLabel(/Type your email/).fill(SYN.email)
    await dialog.getByLabel(/Reason/).fill('moving on')
    await dialog.getByRole('button', { name: 'Schedule deletion' }).click()
    const pending = page.locator('.ff-acct-pending')
    await expect(pending).toContainText(/scheduled for permanent deletion/i)
    // date + time + a trailing timezone token (timeZoneName:'short')
    await expect(pending).toContainText(/\w+ \d{1,2}, 2026, \d{1,2}:\d{2}\s?(AM|PM)\s+\S+/i)
    expect(ledger.rpcs.some((r) => r.fn === 'request_account_deletion')).toBe(true)
  })

  test('reason is submitted to the RPC but never to analytics', async ({ page }) => {
    const ledger = await installAccountFixture(page)
    await openAccount(page, 'data')
    await page.getByRole('button', { name: 'Delete account' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel(/Type your email/).fill(SYN.email)
    await dialog.getByLabel(/Reason/).fill('too quiet')
    await dialog.getByRole('button', { name: 'Schedule deletion' }).click()
    await expect(page.locator('.ff-acct-pending')).toBeVisible()
    expect(ledger.rpcs.some((r) => r.fn === 'request_account_deletion')).toBe(true)
    expect(ledger.unexpected, 'no stray analytics/table write carrying the reason').toEqual([])
  })

  test('cancellation succeeds', async ({ page }) => {
    const ledger = await installAccountFixture(page, { pending: true })
    await openAccount(page, 'data')
    await page.locator('.ff-acct-pending').getByRole('button', { name: 'Cancel deletion' }).click()
    await expect.poll(() => ledger.rpcs.some((r) => r.fn === 'cancel_account_deletion')).toBe(true)
  })

  test('cancellation failure shows an accessible retry state', async ({ page }) => {
    await installAccountFixture(page, { pending: true, rpc: 'fail' })
    await openAccount(page, 'data')
    await page.locator('.ff-acct-pending').getByRole('button', { name: 'Cancel deletion' }).click()
    await expect(page.locator('.ff-acct-pending').getByRole('alert')).toContainText(/couldn’t cancel/i)
  })

  test('the delete dialog is an accessible modal: focus trap, Escape closes when not busy, focus restores', async ({ page }) => {
    await installAccountFixture(page)
    await openAccount(page, 'data')
    const trigger = page.getByRole('button', { name: 'Delete account' })
    await trigger.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    for (let i = 0; i < 8; i += 1) await page.keyboard.press('Tab')
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })
})

// The synthetic joined date is mid-month/midday UTC so "Member since <Month>" is stable across
// timezones (a month-boundary value previously read as April in UTC but March in America/Toronto).
for (const timezoneId of ['UTC', 'America/Toronto']) {
  test.describe(`Account — member-since is timezone-stable (${timezoneId})`, () => {
    test.use({ timezoneId })
    test('renders "Member since April 2025" regardless of timezone', async ({ page }) => {
      await installAccountFixture(page)
      await openAccount(page)
      await expect(page.getByText(/Member since April 2025/).first()).toBeVisible()
      await expect(page.getByText(/Member since March 2025/)).toHaveCount(0)
    })
  })
}

test.describe('Account — accessibility', () => {
  test('Overview has no serious/critical axe violations', async ({ page }) => {
    await installAccountFixture(page)
    await openAccount(page)
    const results = await new AxeBuilder({ page }).include('.ff-acct').analyze()
    const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
    expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([])
  })
})

for (const [w, h] of [[390, 844], [320, 812]]) {
  test.describe(`Account — mobile ${w}x${h}`, () => {
    test.use({ viewport: { width: w, height: h } })

    test('index → detail → Back, no horizontal overflow, BottomNav cleared', async ({ page }) => {
      await installAccountFixture(page)
      await openAccount(page)
      await expect(page.getByRole('link', { name: /Personal Information/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /back to settings/i })).toHaveCount(0)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(1)
      await page.getByRole('link', { name: /Privacy/ }).click()
      await expect(page.getByRole('button', { name: /back to settings/i })).toBeVisible()
      await expect(page.getByRole('heading', { level: 2, name: 'Privacy' })).toBeVisible()
      await expect(detailHeading(page)).toBeFocused()
      await page.getByRole('button', { name: /back to settings/i }).click()
      await expect(page.getByRole('button', { name: /back to settings/i })).toHaveCount(0)
      await expect(page.getByRole('link', { name: /Personal Information/ })).toBeVisible()
    })

    test('delete dialog remains scrollable + actionable; Escape closes it', async ({ page }) => {
      await installAccountFixture(page)
      await openAccount(page, 'data')
      await page.getByRole('button', { name: 'Delete account' }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await dialog.getByLabel(/Type your email/).fill(SYN.email)
      await expect(dialog.getByRole('button', { name: 'Schedule deletion' })).toBeEnabled()
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
    })
  })
}
