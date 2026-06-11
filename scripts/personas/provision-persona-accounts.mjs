#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

export const DEFAULT_REGISTRY = 'docs/personas/persona-test-accounts.json'
export const EMAIL_DOMAIN = '@feelflick.test'
export const VALID_ENVIRONMENTS = new Set(['local', 'preview'])

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli(process.argv.slice(2)).catch((error) => {
    console.error(`persona account provisioning failed: ${error.message}`)
    process.exitCode = 1
  })
}

async function cli(argv) {
  const args = parseArgs(argv)

  if (args.help) {
    printHelp()
    return
  }

  try {
    const summary = await runProvisioning({ args, env: process.env })
    printSummary(summary, { json: args.json })
    if (summary.failedCount > 0) process.exitCode = 1
  } catch (error) {
    if (args.json) {
      console.error(JSON.stringify({ ok: false, error: error.message }, null, 2))
    } else {
      console.error(`persona account provisioning failed: ${error.message}`)
    }
    process.exitCode = 1
  }
}

export async function runProvisioning({ args, env }) {
  if (args.apply && args.dryRun) {
    throw new Error('Use either --dry-run or --apply, not both.')
  }

  if (args.resetPassword && !args.apply) {
    throw new Error('--reset-password must be combined with --apply.')
  }

  const mode = args.apply ? 'apply' : 'dry-run'
  const defaultedMode = !args.apply && !args.dryRun
  const registryPath = env.PERSONA_ACCOUNT_REGISTRY || DEFAULT_REGISTRY
  const registry = await readRegistry(registryPath)
  const selectedAccounts = selectAccounts(registry, args.limit)
  const config = resolveConfig({ env, args, mode, registryPath, defaultedMode })

  validateRegistry(registry)
  validateSelectedAccounts(selectedAccounts)
  validateExecutionConfig(config)

  if (mode === 'dry-run') {
    return buildDryRunSummary({ accounts: selectedAccounts, config })
  }

  return applyAccounts(selectedAccounts, config)
}

export function parseArgs(argv) {
  const parsed = {
    apply: false,
    dryRun: false,
    help: false,
    json: false,
    limit: null,
    resetPassword: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--apply') {
      parsed.apply = true
    } else if (arg === '--dry-run') {
      parsed.dryRun = true
    } else if (arg === '--help' || arg === '-h') {
      parsed.help = true
    } else if (arg === '--json') {
      parsed.json = true
    } else if (arg === '--reset-password') {
      parsed.resetPassword = true
    } else if (arg === '--limit') {
      const value = argv[index + 1]
      if (!value) throw new Error('--limit requires a comma-separated value, e.g. --limit P1,P2.')
      parsed.limit = value
      index += 1
    } else if (arg.startsWith('--limit=')) {
      parsed.limit = arg.slice('--limit='.length)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return parsed
}

export async function readRegistry(registryPath) {
  const resolved = path.resolve(repoRoot, registryPath)
  let raw
  try {
    raw = await fs.readFile(resolved, 'utf8')
  } catch (error) {
    throw new Error(`Could not read registry at ${registryPath}: ${error.message}`)
  }

  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new Error(`Registry is not valid JSON: ${error.message}`)
  }
}

export function selectAccounts(registry, limit) {
  if (!limit) return registry

  const requestedIds = limit.split(',').map((id) => id.trim()).filter(Boolean)
  if (!requestedIds.length) throw new Error('--limit did not include any persona IDs.')

  const byId = new Map(registry.map((account) => [account.id, account]))
  const missing = requestedIds.filter((id) => !byId.has(id))
  if (missing.length) throw new Error(`Unknown persona ID(s) in --limit: ${missing.join(', ')}`)

  return requestedIds.map((id) => byId.get(id))
}

export function resolveConfig({ env, args, mode, registryPath, defaultedMode = false }) {
  return {
    allowRemote: env.PERSONA_ALLOW_REMOTE === 'true',
    apply: mode === 'apply',
    defaultedMode,
    dryRun: mode === 'dry-run',
    mode,
    personaEnv: env.PERSONA_ENV || 'local',
    registryPath,
    resetPassword: args.resetPassword,
    serviceRoleKey: env.PERSONA_SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: env.PERSONA_SUPABASE_URL,
    testPassword: env.PERSONA_TEST_PASSWORD,
  }
}

export function validateRegistry(registry) {
  if (!Array.isArray(registry)) {
    throw new Error('Registry must be a JSON array.')
  }

  const requiredFields = [
    'id',
    'email',
    'displayName',
    'archetype',
    'sourceMindset',
    'survivalInstinct',
    'patienceLevel',
    'trustRequirement',
    'abandonmentTrigger',
    'returnTrigger',
    'feedbackStyle',
    'onboardingIntent',
    'qaFocusAreas',
    'notes',
  ]

  const ids = new Set()
  const emails = new Set()

  for (const account of registry) {
    for (const field of requiredFields) {
      if (!(field in account)) throw new Error(`Registry entry is missing required field: ${field}`)
    }

    const id = String(account.id)
    const email = normalizeEmail(account.email)
    if (ids.has(id)) throw new Error(`Duplicate persona id: ${id}`)
    if (emails.has(email)) throw new Error(`Duplicate persona email: ${account.email}`)
    ids.add(id)
    emails.add(email)

    if (!email.endsWith(EMAIL_DOMAIN)) {
      throw new Error(`Persona email must end with ${EMAIL_DOMAIN}: ${account.email}`)
    }

    if (!Array.isArray(account.qaFocusAreas) || account.qaFocusAreas.length === 0) {
      throw new Error(`qaFocusAreas must be a non-empty array for ${account.id}`)
    }
  }

  for (let number = 1; number <= 16; number += 1) {
    const id = `P${number}`
    if (!ids.has(id)) throw new Error(`Missing required persona id: ${id}`)
  }

  if (!ids.has('CTRL')) throw new Error('Missing required control account id: CTRL')
}

export function validateSelectedAccounts(accounts) {
  if (!accounts.length) throw new Error('No persona accounts selected.')
  for (const account of accounts) {
    if (!normalizeEmail(account.email).endsWith(EMAIL_DOMAIN)) {
      throw new Error(`Selected account email must end with ${EMAIL_DOMAIN}: ${account.email}`)
    }
  }
}

export function validateExecutionConfig(config) {
  validateEnvironment(config)

  if (config.dryRun) return

  const missing = []
  if (!config.supabaseUrl) missing.push('PERSONA_SUPABASE_URL')
  if (!config.serviceRoleKey) missing.push('PERSONA_SUPABASE_SERVICE_ROLE_KEY')
  if (!config.testPassword) missing.push('PERSONA_TEST_PASSWORD')
  if (missing.length) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`)
  }

  validatePasswordStrength(config.testPassword)
  validateRemoteAccess(config)
}

export function validateEnvironment(config) {
  if (config.personaEnv === 'production') {
    throw new Error('PERSONA_ENV=production is blocked. Production provisioning is not supported.')
  }

  if (!VALID_ENVIRONMENTS.has(config.personaEnv)) {
    throw new Error(`PERSONA_ENV must be one of: ${Array.from(VALID_ENVIRONMENTS).join(', ')}`)
  }
}

export function validatePasswordStrength(password) {
  const value = String(password || '')
  const checks = [
    [value.length >= 16, 'at least 16 characters'],
    [/[a-z]/.test(value), 'a lowercase letter'],
    [/[A-Z]/.test(value), 'an uppercase letter'],
    [/[0-9]/.test(value), 'a number'],
    [/[^A-Za-z0-9]/.test(value), 'a symbol'],
  ]

  const missing = checks.filter(([passes]) => !passes).map(([, label]) => label)
  if (missing.length) {
    throw new Error(`PERSONA_TEST_PASSWORD is not strong enough; missing ${missing.join(', ')}.`)
  }
}

export function validateRemoteAccess(config) {
  const isLocal = isLocalSupabaseUrl(config.supabaseUrl)
  const looksProduction = looksLikeProductionSupabaseUrl(config.supabaseUrl)

  if (config.personaEnv === 'local' && !isLocal) {
    throw new Error('PERSONA_ENV=local requires PERSONA_SUPABASE_URL to be a local URL.')
  }

  if (config.personaEnv !== 'local' && !config.allowRemote) {
    throw new Error('Remote persona provisioning requires PERSONA_ALLOW_REMOTE=true.')
  }

  if (looksProduction) {
    throw new Error('PERSONA_SUPABASE_URL looks like a production URL. Production provisioning is blocked.')
  }
}

export function isLocalSupabaseUrl(urlValue) {
  try {
    const url = new URL(urlValue)
    return ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(url.hostname)
  } catch {
    return false
  }
}

export function looksLikeProductionSupabaseUrl(urlValue) {
  if (!urlValue) return false
  try {
    const url = new URL(urlValue)
    const hostname = url.hostname.toLowerCase()
    return hostname.includes('prod') || hostname.includes('production') || hostname === 'feelflick.com' || hostname.endsWith('.feelflick.com')
  } catch {
    return false
  }
}

export function buildPersonaMetadata(account, { existingMetadata = {}, created = false } = {}) {
  const workflowField = created ? { created_by: 'persona-qa-workflow' } : { managed_by: 'persona-qa-workflow' }
  return {
    ...existingMetadata,
    persona_id: account.id,
    persona_display_name: account.displayName,
    persona_archetype: account.archetype,
    persona_source_mindset: account.sourceMindset,
    persona_survival_instinct: account.survivalInstinct,
    synthetic_persona: true,
    feelflick_test_account: true,
    ...workflowField,
  }
}

export function buildAppMetadata(account, existingMetadata = {}) {
  return {
    ...existingMetadata,
    persona_id: account.id,
    synthetic_persona: true,
    feelflick_test_account: true,
    managed_by: 'persona-qa-workflow',
  }
}

export async function applyAccounts(accounts, config) {
  const supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const rows = []

  for (const account of accounts) {
    try {
      const existing = await findUserByEmail(supabase, account.email)
      if (existing) {
        const action = await updateExistingAccount({ supabase, account, existing, config })
        rows.push({
          id: account.id,
          email: account.email,
          action,
          message: action === 'unchanged'
            ? 'Existing auth user already has required metadata.'
            : config.resetPassword
              ? 'Existing auth user metadata and password were updated.'
              : 'Existing auth user metadata was updated.',
        })
      } else {
        const { error } = await supabase.auth.admin.createUser({
          email: account.email,
          password: config.testPassword,
          email_confirm: true,
          user_metadata: buildPersonaMetadata(account, { created: true }),
          app_metadata: buildAppMetadata(account),
        })
        if (error) throw error
        rows.push({
          id: account.id,
          email: account.email,
          action: 'created',
          message: 'Created confirmed synthetic persona auth user.',
        })
      }
    } catch (error) {
      rows.push({
        id: account.id,
        email: account.email,
        action: 'failed',
        message: safeErrorMessage(error),
      })
    }
  }

  return buildSummary({ rows, config })
}

async function updateExistingAccount({ supabase, account, existing, config }) {
  const userMetadata = buildPersonaMetadata(account, {
    existingMetadata: existing.user_metadata || {},
    created: false,
  })
  const appMetadata = buildAppMetadata(account, existing.app_metadata || {})
  const payload = {
    user_metadata: userMetadata,
    app_metadata: appMetadata,
  }

  if (config.resetPassword) {
    payload.password = config.testPassword
  }

  if (!config.resetPassword && metadataMatches(existing.user_metadata || {}, userMetadata) && metadataMatches(existing.app_metadata || {}, appMetadata)) {
    return 'unchanged'
  }

  const { error } = await supabase.auth.admin.updateUserById(existing.id, payload)
  if (error) throw error
  return 'updated'
}

export async function findUserByEmail(supabase, email) {
  const targetEmail = normalizeEmail(email)
  const perPage = 1000
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`Failed to list existing auth users while looking up ${email}: ${error.message}`)

    const users = data?.users || []
    const match = users.find((user) => normalizeEmail(user.email) === targetEmail)
    if (match) return match
    if (users.length < perPage) return null
    page += 1
  }
}

function buildDryRunSummary({ accounts, config }) {
  const rows = accounts.map((account) => ({
    id: account.id,
    email: account.email,
    action: 'planned',
    message: 'Would create missing account or update existing metadata; no Supabase call was made.',
  }))

  return buildSummary({ rows, config })
}

function buildSummary({ rows, config }) {
  const count = (action) => rows.filter((row) => row.action === action).length

  return {
    ok: count('failed') === 0,
    registryPath: config.registryPath,
    environment: config.personaEnv,
    mode: config.mode,
    defaultedMode: config.defaultedMode,
    resetPassword: config.resetPassword,
    remoteAllowed: config.allowRemote,
    selectedAccountCount: rows.length,
    createdCount: count('created'),
    updatedCount: count('updated'),
    unchangedCount: count('unchanged'),
    skippedCount: count('planned') + count('skipped'),
    failedCount: count('failed'),
    accounts: rows,
  }
}

export function printSummary(summary, { json = false } = {}) {
  if (json) {
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  if (summary.defaultedMode) {
    console.log('No mode supplied; defaulting to dry-run. Use --apply to create or update accounts.')
  }

  console.log('Persona account provisioning summary')
  console.log(`Registry: ${summary.registryPath}`)
  console.log(`Environment: ${summary.environment}`)
  console.log(`Remote allowed: ${summary.remoteAllowed ? 'true' : 'false'}`)
  console.log(`Mode: ${summary.mode}`)
  console.log(`Reset password: ${summary.resetPassword ? 'true' : 'false'}`)
  console.log(`Selected accounts: ${summary.selectedAccountCount}`)
  console.log(`Created: ${summary.createdCount}`)
  console.log(`Updated: ${summary.updatedCount}`)
  console.log(`Unchanged: ${summary.unchangedCount}`)
  console.log(`Skipped: ${summary.skippedCount}`)
  console.log(`Failed: ${summary.failedCount}`)
  console.log('Accounts:')
  for (const row of summary.accounts) {
    console.log(`- ${row.id} ${row.email} ${row.action}: ${row.message}`)
  }

  if (summary.mode === 'dry-run') {
    console.log('Mode: dry-run. No Supabase admin APIs were called.')
  }
}

function metadataMatches(current, expected) {
  for (const [key, value] of Object.entries(expected)) {
    if (current[key] !== value) return false
  }
  return true
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function safeErrorMessage(error) {
  return String(error?.message || error || 'Unknown error')
    .replace(/password=[^&\s]+/gi, 'password=REDACTED')
    .replace(/apikey=[^&\s]+/gi, 'apikey=REDACTED')
    .replace(/authorization[:=][^&\s]+/gi, 'authorization=REDACTED')
}

function printHelp() {
  console.log(`Usage: node scripts/personas/provision-persona-accounts.mjs [--dry-run|--apply] [--limit P1,P2] [--reset-password] [--json]

Options:
  --dry-run         Validate and print the provisioning plan without credentials or Supabase calls.
  --apply           Create missing accounts and update metadata for existing accounts.
  --limit           Comma-separated persona IDs to include, e.g. P1,P2,CTRL.
  --reset-password  With --apply, update existing accounts to PERSONA_TEST_PASSWORD.
  --json            Print a machine-readable summary without secrets.

Default:
  If neither --dry-run nor --apply is supplied, the script defaults to dry-run.

Required for --apply:
  PERSONA_SUPABASE_URL
  PERSONA_SUPABASE_SERVICE_ROLE_KEY
  PERSONA_TEST_PASSWORD

Safety:
  PERSONA_ENV may be local or preview only.
  PERSONA_ENV=production is blocked.
  Preview provisioning requires PERSONA_ALLOW_REMOTE=true.
  Secrets are never printed.`)
}
