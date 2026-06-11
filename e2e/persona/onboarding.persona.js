import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_REGISTRY = 'docs/personas/persona-test-accounts.json'
const DEFAULT_PROFILES = 'docs/personas/persona-onboarding-profiles.json'
const DEFAULT_AUTH_STATE_DIR = 'e2e/.auth/personas'
const DEFAULT_ARTIFACT_DIR = 'e2e/.persona-artifacts'
const SUMMARY_FILE = 'onboarding-summary.json'
const EMAIL_DOMAIN = '@feelflick.test'
const MIN_ANCHORS = 5

const MOOD_LABELS = {
  cozy: 'Cozy',
  wired: 'Wired',
  tender: 'Tender',
  fun: 'Fun',
  tense: 'Tense',
  mythic: 'Mythic',
}

const SENTIMENT_LABELS = {
  okay: 'Okay',
  liked: 'Liked',
  loved: 'Loved',
}

test('complete persona onboarding through the browser UI', async ({ browser, baseURL }) => {
  test.setTimeout(20 * 60 * 1000)

  const registryPath = process.env.PERSONA_ACCOUNT_REGISTRY || DEFAULT_REGISTRY
  const profilesPath = process.env.PERSONA_ONBOARDING_PROFILES || DEFAULT_PROFILES
  const authStateDir = process.env.PERSONA_AUTH_STATE_DIR || DEFAULT_AUTH_STATE_DIR
  const artifactDir = process.env.PERSONA_ARTIFACT_DIR || DEFAULT_ARTIFACT_DIR
  const retryEnabled = process.env.PERSONA_ONBOARDING_RETRY === 'true'
  const summaryPath = path.resolve(process.cwd(), artifactDir, SUMMARY_FILE)
  const runStartedAt = new Date().toISOString()
  const rows = []
  let summaryWritten = false

  try {
    const registry = await readJsonArray(registryPath, 'persona registry')
    const profiles = await readJsonArray(profilesPath, 'persona onboarding profiles')
    const personas = selectPersonas(registry, process.env.PERSONA_LIMIT)
    const selected = joinProfiles(personas, profiles)
    validateSelected(selected)

    await fs.mkdir(path.resolve(process.cwd(), artifactDir), { recursive: true })

    for (const entry of selected) {
      const row = await runPersonaOnboarding({
        browser,
        baseURL,
        entry,
        authStateDir,
        retryEnabled,
      })
      rows.push(row)
    }

    const summary = buildSummary({ rows, runStartedAt })
    await writeSummary(summaryPath, summary)
    summaryWritten = true

    const failed = rows.filter((row) => row.status === 'failed')
    if (failed.length > 0) {
      throw new Error(`Persona onboarding failed for: ${failed.map((row) => row.id).join(', ')}`)
    }
  } catch (error) {
    if (summaryWritten) throw error
    const summary = buildSummary({
      rows,
      runStartedAt,
      setupError: safeErrorMessage(error),
    })
    await writeSummary(summaryPath, summary)
    throw error
  }
})

async function runPersonaOnboarding({ browser, baseURL, entry, authStateDir, retryEnabled }) {
  const { persona, profile } = entry
  const storageState = path.resolve(process.cwd(), authStateDir, `${persona.id}.json`)
  const context = await browser.newContext({ baseURL, storageState })
  const page = await context.newPage()
  const warnings = []
  let selectedAnchors = []
  let ratingsAttempted = 0

  try {
    await page.goto('/onboarding')
    await page.waitForFunction(() => Boolean(window.supabase), null, { timeout: 15_000 })

    const sessionEmail = await page.evaluate(async () => {
      const { data } = await window.supabase.auth.getSession()
      return data?.session?.user?.email ?? null
    })
    expect(String(sessionEmail).toLowerCase(), `${persona.id} session email mismatch`).toBe(persona.email.toLowerCase())

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)

    if (isAlreadyCompleteUrl(page.url())) {
      const verification = await verifyOnboardingCompletion(page)
      return safeRow({
        persona,
        profile,
        status: 'already_complete',
        completionRoute: routePath(page.url()),
        verification,
        warnings,
      })
    }

    await expect(page.getByText(/The vibe you/i)).toBeVisible({ timeout: 15_000 })

    await selectMoods(page, profile.moods)
    await clickContinue(page)
    await selectGenres(page, profile.genres)
    await clickContinue(page)

    selectedAnchors = await selectAnchorMovies(page, profile.anchorMovies, warnings)
    if (selectedAnchors.length < MIN_ANCHORS) {
      throw new Error(`Only selected ${selectedAnchors.length} anchor films; expected at least ${MIN_ANCHORS}.`)
    }

    await clickContinue(page)
    ratingsAttempted = await rateSelectedMovies(page, selectedAnchors)
    const verification = await waitForOnboardingCompletion(page, selectedAnchors.length, ratingsAttempted, warnings)
    assertCompletionVerification(verification, selectedAnchors.length, ratingsAttempted)

    return safeRow({
      persona,
      profile,
      status: 'passed',
      anchorCount: selectedAnchors.length,
      ratingsAttempted,
      completionRoute: routePath(page.url()),
      verification,
      warnings,
    })
  } catch (error) {
    if (retryEnabled) {
      warnings.push('Initial onboarding attempt failed; retry was enabled but automatic reset is not implemented for safety.')
    }
    return safeRow({
      persona,
      profile,
      status: 'failed',
      anchorCount: selectedAnchors.length,
      ratingsAttempted,
      completionRoute: routePath(page.url()),
      safeNotes: [safeErrorMessage(error), ...warnings],
    })
  } finally {
    await context.close()
  }
}

async function selectMoods(page, moods) {
  for (const mood of moods) {
    const label = MOOD_LABELS[mood] || mood
    await page.getByRole('button', { name: new RegExp(`^${escapeRegExp(label)}\\b`, 'i') }).click()
  }
}

async function selectGenres(page, genres) {
  await expect(page.getByRole('group', { name: 'Genres' })).toBeVisible({ timeout: 15_000 })
  for (const genre of genres) {
    await page.getByRole('button', { name: new RegExp(`^${escapeRegExp(genre)}$`, 'i') }).click()
  }
}

async function selectAnchorMovies(page, anchors, warnings) {
  const selected = []
  await expect(page.getByLabel('Search for a film to add')).toBeVisible({ timeout: 20_000 })

  for (const anchor of anchors) {
    if (selected.length >= MIN_ANCHORS) break
    const picked = await trySearchMovie(page, anchor, warnings)
    if (picked) selected.push({ ...anchor, pickedTitle: picked })
  }

  while (selected.length < MIN_ANCHORS) {
    const picked = await trySuggestionMovie(page)
    if (!picked) break
    selected.push({
      query: picked,
      expectedTitleHint: picked,
      sentiment: 'liked',
      whyThisPersonaChoseIt: 'Fallback suggestion selected because search did not yield enough anchors.',
      pickedTitle: picked,
    })
    warnings.push(`Used suggestion fallback for anchor ${selected.length}.`)
  }

  return selected
}

async function trySearchMovie(page, anchor, warnings) {
  const search = page.getByLabel('Search for a film to add')
  await search.fill(anchor.query)

  const listbox = page.getByRole('listbox', { name: 'Search results' })
  try {
    await listbox.getByRole('option').first().waitFor({ state: 'visible', timeout: 8_000 })
  } catch {
    warnings.push(`Search produced no usable result for "${anchor.query}".`)
    await clearSearch(page)
    return null
  }

  const options = listbox.getByRole('option')
  let option = options.filter({ hasText: new RegExp(escapeRegExp(anchor.expectedTitleHint), 'i') }).first()
  if (!(await option.isVisible().catch(() => false))) {
    option = options.first()
    warnings.push(`Used first search result for "${anchor.query}" because "${anchor.expectedTitleHint}" was not visible.`)
  }

  const pickedText = firstLine(await option.innerText().catch(() => anchor.query))
  await option.click()
  await waitForAnchorCountAtLeast(page, 1)
  return pickedText
}

async function trySuggestionMovie(page) {
  const suggestion = page.locator('section[aria-labelledby="ob-suggestions-h"] button[aria-label^="Select "]').first()
  if (!(await suggestion.isVisible().catch(() => false))) return null
  const label = await suggestion.getAttribute('aria-label')
  await suggestion.click()
  return String(label || 'suggestion').replace(/^Select\s+/i, '')
}

async function rateSelectedMovies(page, selectedAnchors) {
  await expect(page.locator('p.ob-eyebrow').filter({ hasText: /The verdict/i })).toBeVisible({ timeout: 15_000 })
  let attempted = 0
  for (const anchor of selectedAnchors) {
    const label = SENTIMENT_LABELS[anchor.sentiment] || 'Liked'
    const button = page.getByRole('button', { name: new RegExp(`^${escapeRegExp(label)}$`, 'i') })
    await button.click()
    attempted += 1
    await page.waitForTimeout(380)
  }
  return attempted
}

async function verifyOnboardingCompletion(page) {
  return page.evaluate(async () => {
    const { data: sessionData } = await window.supabase.auth.getSession()
    const session = sessionData?.session
    const userId = session?.user?.id
    if (!userId) return { hasSession: false }

    const [userRes, prefsRes, historyRes, ratingsRes] = await Promise.all([
      window.supabase.from('users').select('onboarding_complete').eq('id', userId).maybeSingle(),
      window.supabase.from('user_preferences').select('genre_id').eq('user_id', userId),
      window.supabase.from('user_history').select('id').eq('user_id', userId).eq('source', 'onboarding'),
      window.supabase.from('user_ratings').select('id').eq('user_id', userId).eq('source', 'onboarding'),
    ])

    return {
      hasSession: true,
      userOnboardingComplete: Boolean(userRes.data?.onboarding_complete),
      authMetadataComplete: Boolean(session.user?.user_metadata?.onboarding_complete || session.user?.user_metadata?.has_onboarded),
      preferenceCount: Array.isArray(prefsRes.data) ? prefsRes.data.length : 0,
      onboardingHistoryCount: Array.isArray(historyRes.data) ? historyRes.data.length : 0,
      onboardingRatingCount: Array.isArray(ratingsRes.data) ? ratingsRes.data.length : 0,
      errors: [userRes.error, prefsRes.error, historyRes.error, ratingsRes.error].filter(Boolean).map((error) => error.message),
    }
  })
}

async function waitForOnboardingCompletion(page, anchorCount, ratingsAttempted, warnings) {
  const deadline = Date.now() + 120_000
  let lastVerification = null

  while (Date.now() < deadline) {
    lastVerification = await verifyOnboardingCompletion(page)
    const routeComplete = /\/(discover|home)(?:$|[?#])/.test(page.url())
    const dataComplete = isCompletionVerificationReady(lastVerification, anchorCount, ratingsAttempted)

    if (routeComplete && dataComplete) return lastVerification
    if (dataComplete) {
      warnings.push('Onboarding completion was verified before the browser route changed.')
      return lastVerification
    }

    await page.waitForTimeout(2_000)
  }

  throw new Error(`Timed out waiting for onboarding completion. Last safe verification: ${JSON.stringify(safeVerification(lastVerification))}`)
}

function isCompletionVerificationReady(verification, anchorCount, ratingsAttempted) {
  if (!verification?.hasSession) return false
  if (verification.errors?.length) return false
  if (!verification.userOnboardingComplete && !verification.authMetadataComplete) return false
  if (verification.preferenceCount < 1) return false
  if (verification.onboardingHistoryCount < Math.min(anchorCount, MIN_ANCHORS)) return false
  if (ratingsAttempted > 0 && verification.onboardingRatingCount < 1) return false
  return true
}

function assertCompletionVerification(verification, anchorCount, ratingsAttempted) {
  if (!verification.hasSession) throw new Error('No Supabase session during completion verification.')
  if (verification.errors?.length) throw new Error(`Completion verification query failed: ${verification.errors.join('; ')}`)
  if (!verification.userOnboardingComplete && !verification.authMetadataComplete) {
    throw new Error('Onboarding completion flag was not visible after the browser flow.')
  }
  if (verification.preferenceCount < 1) throw new Error('No user_preferences rows were visible after onboarding.')
  if (verification.onboardingHistoryCount < Math.min(anchorCount, MIN_ANCHORS)) {
    throw new Error('Too few onboarding user_history rows were visible after onboarding.')
  }
  if (ratingsAttempted > 0 && verification.onboardingRatingCount < 1) {
    throw new Error('No onboarding user_ratings rows were visible after ratings were attempted.')
  }
}

function safeVerification(verification) {
  if (!verification) return null
  return {
    hasSession: verification.hasSession,
    userOnboardingComplete: verification.userOnboardingComplete,
    authMetadataComplete: verification.authMetadataComplete,
    preferenceCount: verification.preferenceCount,
    onboardingHistoryCount: verification.onboardingHistoryCount,
    onboardingRatingCount: verification.onboardingRatingCount,
    errors: verification.errors,
  }
}

async function clickContinue(page) {
  await page.getByRole('button', { name: /^Continue$/i }).click()
}

async function clearSearch(page) {
  const clear = page.getByRole('button', { name: 'Clear search' })
  if (await clear.isVisible().catch(() => false)) await clear.click()
}

async function waitForAnchorCountAtLeast(page, minimum) {
  await expect.poll(async () => page.getByRole('button', { name: /^Remove / }).count(), {
    timeout: 5_000,
  }).toBeGreaterThanOrEqual(minimum)
}

async function readJsonArray(filePath, label) {
  let raw
  try {
    raw = await fs.readFile(path.resolve(process.cwd(), filePath), 'utf8')
  } catch (error) {
    throw new Error(`Could not read ${label} at ${filePath}: ${error.message}`)
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error(`${label} must be a JSON array`)
    return parsed
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`)
  }
}

function selectPersonas(registry, limitValue) {
  if (!limitValue) return registry
  const requestedIds = limitValue.split(',').map((id) => id.trim()).filter(Boolean)
  if (!requestedIds.length) throw new Error('PERSONA_LIMIT did not include any persona IDs.')

  const byId = new Map(registry.map((persona) => [persona.id, persona]))
  const missing = requestedIds.filter((id) => !byId.has(id))
  if (missing.length) throw new Error(`Unknown persona ID(s) in PERSONA_LIMIT: ${missing.join(', ')}`)
  return requestedIds.map((id) => byId.get(id))
}

function joinProfiles(personas, profiles) {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
  return personas.map((persona) => {
    const profile = profilesById.get(persona.id)
    if (!profile) throw new Error(`Missing onboarding profile for ${persona.id}`)
    return { persona, profile }
  })
}

function validateSelected(entries) {
  for (const { persona, profile } of entries) {
    if (!String(persona.email).toLowerCase().endsWith(EMAIL_DOMAIN)) {
      throw new Error(`Persona email must end with ${EMAIL_DOMAIN}: ${persona.email}`)
    }
    if (!Array.isArray(profile.anchorMovies) || profile.anchorMovies.length < MIN_ANCHORS) {
      throw new Error(`Onboarding profile ${profile.id} must include at least ${MIN_ANCHORS} anchorMovies.`)
    }
  }
}

function safeRow({ persona, profile, status, anchorCount = 0, ratingsAttempted = 0, completionRoute = null, verification = null, warnings = [], safeNotes = [] }) {
  return {
    id: persona.id,
    email: persona.email,
    status,
    moodsSelected: profile.moods,
    genresSelected: profile.genres,
    anchorCount,
    ratingsAttempted,
    completionRoute,
    safeNotes: [...safeNotes, ...warnings].filter(Boolean),
    verification: verification ? {
      userOnboardingComplete: verification.userOnboardingComplete,
      authMetadataComplete: verification.authMetadataComplete,
      preferenceCount: verification.preferenceCount,
      onboardingHistoryCount: verification.onboardingHistoryCount,
      onboardingRatingCount: verification.onboardingRatingCount,
    } : null,
  }
}

function buildSummary({ rows, runStartedAt, setupError = null }) {
  return {
    runStartedAt,
    runFinishedAt: new Date().toISOString(),
    selectedPersonaCount: rows.length,
    passedCount: rows.filter((row) => row.status === 'passed').length,
    alreadyCompleteCount: rows.filter((row) => row.status === 'already_complete').length,
    failedCount: rows.filter((row) => row.status === 'failed').length,
    setupError,
    personas: rows,
  }
}

async function writeSummary(summaryPath, summary) {
  await fs.mkdir(path.dirname(summaryPath), { recursive: true })
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
}

function isAlreadyCompleteUrl(urlValue) {
  return /\/home(?:$|[?#])/.test(urlValue)
}

function routePath(urlValue) {
  try {
    const url = new URL(urlValue)
    return url.pathname
  } catch {
    return null
  }
}

function firstLine(value) {
  return String(value || '').split('\n').map((line) => line.trim()).find(Boolean) || ''
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function safeErrorMessage(error) {
  return String(error?.message || error || 'Unknown error')
    .replace(/password=[^&\s]+/gi, 'password=REDACTED')
    .replace(/access_token[=:][^&\s]+/gi, 'access_token=REDACTED')
    .replace(/refresh_token[=:][^&\s]+/gi, 'refresh_token=REDACTED')
    .replace(/apikey=[^&\s]+/gi, 'apikey=REDACTED')
    .replace(/authorization[:=][^&\s]+/gi, 'authorization=REDACTED')
}
