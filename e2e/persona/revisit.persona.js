import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  buildAggregate,
  detectEmptyState,
  detectGenericCopy,
  evaluatePersona,
  renderPersonaMarkdown,
} from './helpers/revisitEvaluator.mjs'

const DEFAULT_REGISTRY = 'docs/personas/persona-test-accounts.json'
const DEFAULT_PROFILES = 'docs/personas/persona-onboarding-profiles.json'
const DEFAULT_RUBRIC = 'docs/personas/persona-revisit-rubric.json'
const DEFAULT_AUTH_STATE_DIR = 'e2e/.auth/personas'
const DEFAULT_ARTIFACT_DIR = 'e2e/.persona-artifacts'
const SUMMARY_FILE = 'revisit-summary.json'
const EMAIL_DOMAIN = '@feelflick.test'
const ROUTES = ['/', '/home', '/discover', '/profile', '/watchlist', '/history']
const DEFAULT_TEXT_MAX_CHARS = 12_000

test('revisit app as synthetic personas and produce felt-experience QA', async ({ browser, baseURL }) => {
  test.setTimeout(25 * 60 * 1000)

  const registryPath = process.env.PERSONA_ACCOUNT_REGISTRY || DEFAULT_REGISTRY
  const profilesPath = process.env.PERSONA_ONBOARDING_PROFILES || DEFAULT_PROFILES
  const rubricPath = process.env.PERSONA_REVISIT_RUBRIC || DEFAULT_RUBRIC
  const authStateDir = process.env.PERSONA_AUTH_STATE_DIR || DEFAULT_AUTH_STATE_DIR
  const artifactDir = process.env.PERSONA_ARTIFACT_DIR || DEFAULT_ARTIFACT_DIR
  const screenshotsEnabled = process.env.PERSONA_REVISIT_SCREENSHOTS !== 'false'
  const textMaxChars = parsePositiveInt(process.env.PERSONA_REVISIT_TEXT_MAX_CHARS, DEFAULT_TEXT_MAX_CHARS)
  const captureHtml = process.env.PERSONA_REVISIT_CAPTURE_HTML === 'true'
  const summaryPath = path.resolve(process.cwd(), artifactDir, SUMMARY_FILE)
  const reportsDir = path.resolve(process.cwd(), artifactDir, 'reports')
  const runStartedAt = new Date().toISOString()
  const rows = []
  let summaryWritten = false

  try {
    const registry = await readJsonArray(registryPath, 'persona registry')
    const profiles = await readJsonArray(profilesPath, 'persona onboarding profiles')
    const rubric = await readJsonArray(rubricPath, 'persona revisit rubric')
    const personas = selectPersonas(registry, process.env.PERSONA_LIMIT)
    const selected = await joinInputs({ personas, profiles, rubric, authStateDir })

    await fs.mkdir(path.resolve(process.cwd(), artifactDir), { recursive: true })
    await fs.mkdir(reportsDir, { recursive: true })

    for (const entry of selected) {
      const row = await runPersonaRevisit({
        browser,
        baseURL,
        entry,
        authStateDir,
        artifactDir,
        screenshotsEnabled,
        textMaxChars,
        captureHtml,
      })
      rows.push(row)

      const reportPath = path.join(reportsDir, `${entry.persona.id}.md`)
      await fs.writeFile(reportPath, renderPersonaMarkdown(row.personaResult), 'utf8')
    }

    const summary = buildSummary({ rows, runStartedAt })
    await writeJson(summaryPath, summary)
    summaryWritten = true

    const failed = rows.filter((row) => row.status === 'failed')
    expect(failed, `Persona revisit had hard failures for: ${failed.map((row) => row.id).join(', ')}`).toHaveLength(0)
  } catch (error) {
    if (summaryWritten) throw error
    const summary = buildSummary({
      rows,
      runStartedAt,
      setupError: safeErrorMessage(error),
    })
    await writeJson(summaryPath, summary)
    throw error
  }
})

async function runPersonaRevisit({
  browser,
  baseURL,
  entry,
  authStateDir,
  artifactDir,
  screenshotsEnabled,
  textMaxChars,
  captureHtml,
}) {
  const { persona, profile, rubric } = entry
  const storageState = path.resolve(process.cwd(), authStateDir, `${persona.id}.json`)
  const context = await browser.newContext({ baseURL, storageState })
  const page = await context.newPage()
  const observations = []
  let movieDetail = null
  let accountState = {
    ...persona,
    loginWorked: false,
    sessionEmailMatched: false,
    authIssues: [],
  }

  try {
    for (const route of ROUTES) {
      const observation = await visitAndCaptureSurface({
        page,
        personaId: persona.id,
        route,
        artifactDir,
        screenshotsEnabled,
        textMaxChars,
        captureHtml,
        rubric,
      })
      observations.push(observation)

      if (route === '/') {
        const session = await readBrowserSession(page)
        accountState = {
          ...persona,
          loginWorked: Boolean(session.email),
          sessionEmailMatched: String(session.email || '').toLowerCase() === persona.email.toLowerCase(),
          authIssues: session.error ? [session.error] : [],
        }

        if (!accountState.loginWorked || !accountState.sessionEmailMatched) {
          throw new Error(`${persona.id} browser session did not match the expected persona email.`)
        }
      }
    }

    movieDetail = await captureFirstMovieDetail({
      page,
      personaId: persona.id,
      artifactDir,
      screenshotsEnabled,
      textMaxChars,
      captureHtml,
      rubric,
    })

    const personaResult = evaluatePersona({
      account: accountState,
      profile,
      rubric,
      observations,
      movieDetail,
    })

    return safeRow({ persona, status: 'passed', personaResult })
  } catch (error) {
    accountState = {
      ...accountState,
      authIssues: uniqueStrings([...accountState.authIssues, safeErrorMessage(error)]),
    }

    const failureObservation = {
      route: 'setup',
      finalUrl: safeUrl(page.url()),
      title: null,
      status: 'failed',
      visibleHeadings: [],
      primaryActions: [],
      textExcerpt: '',
      consoleErrorsCount: 0,
      requestFailuresCount: 0,
      loadTimingBucket: 'timeout',
      emptyStateDetected: true,
      genericCopyDetected: false,
      confusionSignals: [`OBSERVED: ${safeErrorMessage(error)}`],
      screenshotPath: null,
      safeMessage: safeErrorMessage(error),
      warnings: [],
    }

    const personaResult = evaluatePersona({
      account: accountState,
      profile,
      rubric,
      observations: observations.length ? [...observations, failureObservation] : [failureObservation],
      movieDetail,
    })

    return safeRow({ persona, status: 'failed', personaResult })
  } finally {
    await context.close()
  }
}

async function visitAndCaptureSurface({
  page,
  personaId,
  route,
  artifactDir,
  screenshotsEnabled,
  textMaxChars,
  captureHtml,
  rubric,
  gotoTarget = route,
}) {
  const started = Date.now()
  const counters = { consoleErrors: 0, requestFailures: 0 }
  const onConsole = (message) => {
    if (message.type() === 'error') counters.consoleErrors += 1
  }
  const onRequestFailed = () => {
    counters.requestFailures += 1
  }

  page.on('console', onConsole)
  page.on('requestfailed', onRequestFailed)

  const warnings = []
  let status = 'visited'
  let safeMessage = null

  try {
    await page.goto(gotoTarget, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {
      warnings.push('Network idle was not reached before capture.')
    })
    await page.waitForTimeout(600)
  } catch (error) {
    status = 'failed'
    safeMessage = safeErrorMessage(error)
  } finally {
    page.off('console', onConsole)
    page.off('requestfailed', onRequestFailed)
  }

  const durationMs = Date.now() - started
  const safeDom = await collectSafeDom(page, textMaxChars, captureHtml).catch((error) => ({
    title: null,
    bodyText: '',
    visibleHeadings: [],
    primaryActions: [],
    movieLinks: [],
    htmlExcerpt: null,
    collectError: safeErrorMessage(error),
  }))

  if (safeDom.collectError) warnings.push(`DOM capture failed: ${safeDom.collectError}`)

  const textExcerpt = safeTextExcerpt(safeDom.bodyText, textMaxChars)
  const finalUrl = safeUrl(page.url())
  const emptyStateDetected = detectEmptyState(textExcerpt) || textExcerpt.trim().length < 80
  const genericCopyDetected = detectGenericCopy(textExcerpt, rubric?.genericnessTriggers || [])
  const confusionSignals = buildConfusionSignals({
    route,
    finalUrl,
    textExcerpt,
    visibleHeadings: safeDom.visibleHeadings,
    primaryActions: safeDom.primaryActions,
    warnings,
  })

  let screenshotPath = null
  if (screenshotsEnabled) {
    screenshotPath = await captureScreenshot({ page, personaId, route, artifactDir, warnings })
  }

  return {
    route,
    finalUrl,
    title: safeDom.title,
    status,
    visibleHeadings: safeDom.visibleHeadings,
    primaryActions: safeDom.primaryActions,
    textExcerpt,
    ...(captureHtml && safeDom.htmlExcerpt ? { htmlExcerpt: safeTextExcerpt(safeDom.htmlExcerpt, Math.min(textMaxChars, 4000)) } : {}),
    consoleErrorsCount: counters.consoleErrors,
    requestFailuresCount: counters.requestFailures,
    loadTimingBucket: loadTimingBucket(durationMs, status),
    emptyStateDetected,
    genericCopyDetected,
    confusionSignals,
    screenshotPath,
    safeMessage,
    warnings,
    movieLinks: safeDom.movieLinks,
  }
}

async function captureFirstMovieDetail({
  page,
  personaId,
  artifactDir,
  screenshotsEnabled,
  textMaxChars,
  captureHtml,
  rubric,
}) {
  for (const sourceRoute of ['/home', '/discover']) {
    const target = await findMovieDetailHref(page, sourceRoute)
    if (!target) continue

    return visitAndCaptureSurface({
      page,
      personaId,
      route: '/movie/:id',
      gotoTarget: target,
      artifactDir,
      screenshotsEnabled,
      textMaxChars,
      captureHtml,
      rubric,
    })
  }

  return {
    route: '/movie/:id',
    finalUrl: null,
    title: null,
    status: 'not_found',
    visibleHeadings: [],
    primaryActions: [],
    textExcerpt: '',
    consoleErrorsCount: 0,
    requestFailuresCount: 0,
    loadTimingBucket: 'normal',
    emptyStateDetected: false,
    genericCopyDetected: false,
    confusionSignals: ['NOT_OBSERVED: No /movie/:id link was found on /home or /discover.'],
    screenshotPath: null,
    safeMessage: 'No movie detail link found.',
    warnings: [],
  }
}

async function findMovieDetailHref(page, sourceRoute) {
  await page.goto(sourceRoute, { waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {})
  await page.waitForTimeout(600)

  return page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href]'))
    const match = anchors.find((anchor) => {
      const href = anchor.getAttribute('href') || ''
      return /^\/movie\/[^/?#]+/.test(href) || /\/movie\/[^/?#]+/.test(href)
    })
    return match?.getAttribute('href') || null
  }).catch(() => null)
}

async function collectSafeDom(page, textMaxChars, captureHtml) {
  const data = await page.evaluate(({ maxChars, includeHtml }) => {
    const isVisible = (element) => {
      const style = window.getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return style.visibility !== 'hidden'
        && style.display !== 'none'
        && Number(style.opacity || 1) !== 0
        && rect.width > 0
        && rect.height > 0
    }
    const trim = (value) => String(value || '').replace(/\s+/g, ' ').trim()
    const actionLabel = (element) => trim(element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || element.getAttribute('href'))

    const bodyText = trim(document.body?.innerText || '')
    const visibleHeadings = Array.from(document.querySelectorAll('h1,h2,h3,[role="heading"]'))
      .filter(isVisible)
      .map((element) => trim(element.innerText || element.getAttribute('aria-label')))
      .filter(Boolean)
      .slice(0, 20)
    const primaryActions = Array.from(document.querySelectorAll('button,a[href]'))
      .filter(isVisible)
      .map(actionLabel)
      .filter(Boolean)
      .slice(0, 40)
    const movieLinks = Array.from(document.querySelectorAll('a[href]'))
      .map((anchor) => anchor.getAttribute('href'))
      .filter((href) => href && /\/movie\/[^/?#]+/.test(href))
      .slice(0, 10)

    return {
      title: document.title || null,
      bodyText: bodyText.slice(0, maxChars * 2),
      visibleHeadings,
      primaryActions,
      movieLinks,
      htmlExcerpt: includeHtml ? String(document.body?.innerHTML || '').slice(0, Math.min(maxChars * 2, 8000)) : null,
    }
  }, { maxChars: textMaxChars, includeHtml: captureHtml })

  return {
    title: safeTextExcerpt(data.title, 300),
    bodyText: data.bodyText,
    visibleHeadings: data.visibleHeadings.map((heading) => safeTextExcerpt(heading, 240)),
    primaryActions: data.primaryActions.map((action) => safeTextExcerpt(action, 180)),
    movieLinks: data.movieLinks.map((href) => safeUrl(href)),
    htmlExcerpt: data.htmlExcerpt ? safeTextExcerpt(stripHtmlDanger(data.htmlExcerpt), Math.min(textMaxChars, 4000)) : null,
  }
}

async function captureScreenshot({ page, personaId, route, artifactDir, warnings }) {
  const screenshotPath = path.resolve(process.cwd(), artifactDir, 'screenshots', personaId, `${safeRouteName(route)}.png`)
  try {
    await fs.mkdir(path.dirname(screenshotPath), { recursive: true })
    await page.screenshot({ path: screenshotPath, fullPage: true })
    return normalizePath(path.relative(process.cwd(), screenshotPath))
  } catch (error) {
    warnings.push(`Screenshot capture failed: ${safeErrorMessage(error)}`)
    return null
  }
}

async function readBrowserSession(page) {
  try {
    await page.waitForFunction(() => Boolean(window.supabase), null, { timeout: 15_000 })
    const session = await page.evaluate(async () => {
      const { data, error } = await window.supabase.auth.getSession()
      return {
        email: data?.session?.user?.email ?? null,
        error: error?.message ?? null,
      }
    })
    return {
      email: session.email,
      error: session.error ? safeErrorMessage(session.error) : null,
    }
  } catch (error) {
    return {
      email: null,
      error: safeErrorMessage(error),
    }
  }
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

async function joinInputs({ personas, profiles, rubric, authStateDir }) {
  if (!personas.length) throw new Error('No personas selected for revisit.')

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
  const rubricById = new Map(rubric.map((entry) => [entry.id, entry]))
  const ids = new Set()
  const emails = new Set()
  const selected = []

  for (const persona of personas) {
    if (!persona.id) throw new Error('Selected persona is missing id.')
    if (!persona.email) throw new Error(`Selected persona ${persona.id} is missing email.`)

    const email = String(persona.email).toLowerCase()
    if (!email.endsWith(EMAIL_DOMAIN)) throw new Error(`Persona email must end with ${EMAIL_DOMAIN}: ${persona.email}`)
    if (ids.has(persona.id)) throw new Error(`Duplicate selected persona id: ${persona.id}`)
    if (emails.has(email)) throw new Error(`Duplicate selected persona email: ${persona.email}`)
    ids.add(persona.id)
    emails.add(email)

    const profile = profilesById.get(persona.id)
    if (!profile) throw new Error(`Missing onboarding profile for ${persona.id}`)
    const rubricEntry = rubricById.get(persona.id)
    if (!rubricEntry) throw new Error(`Missing revisit rubric for ${persona.id}`)

    const storageState = path.resolve(process.cwd(), authStateDir, `${persona.id}.json`)
    await fs.access(storageState).catch(() => {
      throw new Error(`Missing auth state for ${persona.id}: ${normalizePath(path.relative(process.cwd(), storageState))}`)
    })

    selected.push({ persona, profile, rubric: rubricEntry })
  }

  return selected
}

function buildSummary({ rows, runStartedAt, setupError = null }) {
  const personaResults = rows.map((row) => row.personaResult)
  const failedCount = rows.filter((row) => row.status === 'failed').length
  const passedCount = rows.filter((row) => row.status === 'passed').length

  return {
    runStartedAt,
    runFinishedAt: new Date().toISOString(),
    selectedPersonaCount: rows.length,
    passedCount,
    failedCount,
    setupError,
    surfacesVisited: [...ROUTES, '/movie/:id'],
    personaResults,
    aggregate: buildAggregate(personaResults),
  }
}

function safeRow({ persona, status, personaResult }) {
  return {
    id: persona.id,
    email: persona.email,
    status,
    personaResult,
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function buildConfusionSignals({ route, finalUrl, textExcerpt, visibleHeadings, primaryActions, warnings }) {
  const signals = []
  const finalPath = routePath(finalUrl)

  if (route !== '/' && finalPath && finalPath !== route && route !== '/movie/:id') {
    signals.push(`OBSERVED: Expected ${route} but landed on ${finalPath}.`)
  }
  if (finalPath === '/onboarding') {
    signals.push('OBSERVED: Persona was redirected to onboarding during revisit.')
  }
  if (!visibleHeadings.length) {
    signals.push(`OBSERVED: No visible headings were captured on ${route}.`)
  }
  if (primaryActions.length > 30) {
    signals.push(`OBSERVED: More than 30 visible actions were captured on ${route}.`)
  }
  if (/couldn.t load|try refreshing|something went wrong|error/i.test(textExcerpt)) {
    signals.push(`OBSERVED: Error or recovery copy appeared on ${route}.`)
  }
  for (const warning of warnings) {
    signals.push(`OBSERVED: ${warning}`)
  }

  return uniqueStrings(signals)
}

function loadTimingBucket(durationMs, status) {
  if (status === 'failed') return 'timeout'
  if (durationMs > 12_000) return 'slow'
  if (durationMs > 3_000) return 'normal'
  return 'fast'
}

function routePath(urlValue) {
  try {
    return new URL(urlValue).pathname
  } catch {
    if (String(urlValue || '').startsWith('/')) return String(urlValue).split(/[?#]/)[0]
    return null
  }
}

function safeRouteName(route) {
  if (route === '/') return 'root'
  return String(route).replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'route'
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function stripHtmlDanger(value) {
  const input = String(value || '')
  let output = ''
  let skippingTag = null
  let index = 0

  while (index < input.length) {
    if (input[index] !== '<') {
      if (!skippingTag) output += input[index]
      index += 1
      continue
    }

    const tagEnd = input.indexOf('>', index + 1)
    if (tagEnd === -1) break

    const tagName = readTagName(input.slice(index + 1, tagEnd))
    if (tagName === 'script' || tagName === 'style') {
      skippingTag = isClosingTag(input.slice(index + 1, tagEnd)) ? null : tagName
    }

    if (!skippingTag) output += ' '
    index = tagEnd + 1
  }

  return output.replace(/\s+/g, ' ').trim()
}

function readTagName(tagContent) {
  const trimmed = String(tagContent || '').trim().toLowerCase()
  const withoutSlash = trimmed.startsWith('/') ? trimmed.slice(1).trimStart() : trimmed
  const spaceIndex = withoutSlash.search(/\s/)
  return spaceIndex === -1 ? withoutSlash : withoutSlash.slice(0, spaceIndex)
}

function isClosingTag(tagContent) {
  return String(tagContent || '').trim().startsWith('/')
}

function safeTextExcerpt(value, maxChars) {
  return String(value || '')
    .replace(/password=[^&\s]+/gi, 'password=REDACTED')
    .replace(/access_token[=:][^&\s]+/gi, 'access_token=REDACTED')
    .replace(/refresh_token[=:][^&\s]+/gi, 'refresh_token=REDACTED')
    .replace(/apikey=[^&\s]+/gi, 'apikey=REDACTED')
    .replace(/authorization[:=][^&\s]+/gi, 'authorization=REDACTED')
    .replace(/[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, 'JWT_REDACTED')
    .slice(0, maxChars)
}

function safeErrorMessage(error) {
  return safeTextExcerpt(error?.message || error || 'Unknown error', 1000)
}

function safeUrl(value) {
  return safeTextExcerpt(value, 500)
    .replace(/([?&](?:access_token|refresh_token|token|apikey|code)=)[^&#]+/gi, '$1REDACTED')
}

function normalizePath(value) {
  return String(value).split(path.sep).join('/')
}

function uniqueStrings(values) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
}
