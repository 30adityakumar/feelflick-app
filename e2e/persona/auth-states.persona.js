import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_REGISTRY = 'docs/personas/persona-test-accounts.json'
const DEFAULT_AUTH_STATE_DIR = 'e2e/.auth/personas'
const DEFAULT_ARTIFACT_DIR = 'e2e/.persona-artifacts'
const EMAIL_DOMAIN = '@feelflick.test'
const SUMMARY_FILE = 'auth-states-summary.json'

test('generate persona auth storage states', async ({ browser, baseURL }) => {
  const registryPath = process.env.PERSONA_ACCOUNT_REGISTRY || DEFAULT_REGISTRY
  const authStateDir = process.env.PERSONA_AUTH_STATE_DIR || DEFAULT_AUTH_STATE_DIR
  const artifactDir = process.env.PERSONA_ARTIFACT_DIR || DEFAULT_ARTIFACT_DIR
  const password = process.env.PERSONA_TEST_PASSWORD

  const summaryPath = path.resolve(process.cwd(), artifactDir, SUMMARY_FILE)
  const startedAt = new Date().toISOString()
  const results = []

  try {
    const registry = await readRegistry(registryPath)
    const selectedPersonas = selectPersonas(registry, process.env.PERSONA_LIMIT)
    validateSelectedPersonas(selectedPersonas)
    if (!password) throw new Error('PERSONA_TEST_PASSWORD is required to generate persona auth states.')

    await fs.mkdir(path.resolve(process.cwd(), authStateDir), { recursive: true })
    await fs.mkdir(path.resolve(process.cwd(), artifactDir), { recursive: true })

    for (const persona of selectedPersonas) {
      const storageStatePath = path.join(authStateDir, `${persona.id}.json`)
      const safeStorageStatePath = normalizePath(storageStatePath)
      const context = await browser.newContext({ baseURL })
      const page = await context.newPage()

      try {
        await page.goto('/')
        await page.waitForFunction(() => Boolean(window.supabase), null, { timeout: 15_000 })

        const result = await page.evaluate(async ({ email, password: personaPassword }) => {
          await window.supabase.auth.signOut()
          const { error } = await window.supabase.auth.signInWithPassword({
            email,
            password: personaPassword,
          })
          const { data } = await window.supabase.auth.getSession()
          const sessionEmail = data?.session?.user?.email ?? null

          return {
            error: error?.message ?? null,
            hasSession: Boolean(data?.session),
            sessionEmail,
          }
        }, { email: persona.email, password })

        expect(result.error, `${persona.id} sign-in failed: ${result.error}`).toBeNull()
        expect(result.hasSession, `${persona.id} did not return a Supabase session`).toBe(true)
        expect(String(result.sessionEmail).toLowerCase(), `${persona.id} session email mismatch`).toBe(persona.email.toLowerCase())

        await page.context().storageState({ path: path.resolve(process.cwd(), storageStatePath) })

        results.push({
          id: persona.id,
          email: persona.email,
          status: 'created',
          storageStatePath: safeStorageStatePath,
        })
      } catch (error) {
        results.push({
          id: persona.id,
          email: persona.email,
          status: 'failed',
          storageStatePath: safeStorageStatePath,
          message: safeErrorMessage(error),
        })
      } finally {
        await context.close()
      }
    }

    const summary = buildSummary({ registryPath, authStateDir, artifactDir, results, startedAt })
    await writeSummary(summaryPath, summary)

    const failures = results.filter((result) => result.status === 'failed')
    expect(failures, `Persona auth-state generation failed for: ${failures.map((result) => result.id).join(', ')}`).toHaveLength(0)
  } catch (error) {
    const summary = buildSummary({
      registryPath,
      authStateDir,
      artifactDir,
      results,
      startedAt,
      setupError: safeErrorMessage(error),
    })
    await writeSummary(summaryPath, summary)
    throw error
  }
})

async function readRegistry(registryPath) {
  const resolved = path.resolve(process.cwd(), registryPath)
  let raw
  try {
    raw = await fs.readFile(resolved, 'utf8')
  } catch (error) {
    throw new Error(`Could not read persona registry at ${registryPath}: ${error.message}`)
  }

  try {
    const registry = JSON.parse(raw)
    if (!Array.isArray(registry)) throw new Error('registry must be a JSON array')
    return registry
  } catch (error) {
    throw new Error(`Persona registry is not valid JSON: ${error.message}`)
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

function validateSelectedPersonas(personas) {
  if (!personas.length) throw new Error('No personas selected for auth-state generation.')

  const ids = new Set()
  const emails = new Set()

  for (const persona of personas) {
    if (!persona.id) throw new Error('Selected persona is missing id.')
    if (!persona.email) throw new Error(`Selected persona ${persona.id} is missing email.`)

    const email = String(persona.email).toLowerCase()
    if (!email.endsWith(EMAIL_DOMAIN)) {
      throw new Error(`Persona email must end with ${EMAIL_DOMAIN}: ${persona.email}`)
    }
    if (ids.has(persona.id)) throw new Error(`Duplicate selected persona id: ${persona.id}`)
    if (emails.has(email)) throw new Error(`Duplicate selected persona email: ${persona.email}`)
    ids.add(persona.id)
    emails.add(email)
  }
}

function buildSummary({ registryPath, authStateDir, artifactDir, results, startedAt, setupError = null }) {
  const failedCount = results.filter((result) => result.status === 'failed').length
  const createdCount = results.filter((result) => result.status === 'created').length

  return {
    ok: !setupError && failedCount === 0,
    startedAt,
    finishedAt: new Date().toISOString(),
    registryPath,
    authStateDir: normalizePath(authStateDir),
    artifactDir: normalizePath(artifactDir),
    selectedAccountCount: results.length,
    createdCount,
    failedCount,
    setupError,
    accounts: results,
  }
}

async function writeSummary(summaryPath, summary) {
  await fs.mkdir(path.dirname(summaryPath), { recursive: true })
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
}

function normalizePath(value) {
  return String(value).split(path.sep).join('/')
}

function safeErrorMessage(error) {
  return String(error?.message || error || 'Unknown error')
    .replace(/password=[^&\s]+/gi, 'password=REDACTED')
    .replace(/access_token[=:][^&\s]+/gi, 'access_token=REDACTED')
    .replace(/refresh_token[=:][^&\s]+/gi, 'refresh_token=REDACTED')
    .replace(/apikey=[^&\s]+/gi, 'apikey=REDACTED')
    .replace(/authorization[:=][^&\s]+/gi, 'authorization=REDACTED')
}
