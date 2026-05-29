import { test as setup, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Saved Supabase session, consumed by the `app` project's storageState.
const authFile = 'e2e/.auth/user.json'

// Authenticate the dev test user the same way the app does — a client-side
// signInWithPassword against the exposed window.supabase. Credentials come from
// env (E2E_TEST_EMAIL / E2E_TEST_PASSWORD); the local dev creds live in
// .claude/local-secrets.json (gitignored). No Google OAuth popup to automate.
setup('authenticate dev user', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD
  if (!email || !password) {
    throw new Error(
      'E2E auth requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars (the dev test user).\n' +
        'Local creds: .claude/local-secrets.json → feelflickDevUser. Example:\n' +
        '  E2E_TEST_EMAIL=… E2E_TEST_PASSWORD=… npm run test:e2e'
    )
  }

  await page.goto('/')
  await page.waitForFunction(() => Boolean(window.supabase), null, { timeout: 15_000 })

  const result = await page.evaluate(async ([e, p]) => {
    const { error } = await window.supabase.auth.signInWithPassword({ email: e, password: p })
    const { data } = await window.supabase.auth.getSession()
    return { error: error?.message ?? null, hasSession: Boolean(data?.session) }
  }, [email, password])

  expect(result.error, `sign-in failed: ${result.error}`).toBeNull()
  expect(result.hasSession, 'no session after sign-in').toBe(true)

  fs.mkdirSync(path.dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
})
