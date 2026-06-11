import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ALLOWED_SEVERITIES,
  SYNTHETIC_LABEL,
  evaluatePersona,
  renderPersonaMarkdown,
} from '../../e2e/persona/helpers/revisitEvaluator.mjs'
import {
  parseArgs,
  selectAccounts,
  validateExecutionConfig,
  validatePasswordStrength,
  validateRegistry,
} from '../../scripts/personas/provision-persona-accounts.mjs'
import { GENRES, MOODS } from '../../src/features/onboarding/data.js'

const registryPath = path.resolve(process.cwd(), 'docs/personas/persona-test-accounts.json')
const onboardingProfilesPath = path.resolve(process.cwd(), 'docs/personas/persona-onboarding-profiles.json')
const revisitRubricPath = path.resolve(process.cwd(), 'docs/personas/persona-revisit-rubric.json')
const revisitIssueCandidatesPath = path.resolve(process.cwd(), 'docs/personas/persona-revisit-issue-candidates.json')
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
const onboardingProfiles = JSON.parse(fs.readFileSync(onboardingProfilesPath, 'utf8'))
const revisitRubric = JSON.parse(fs.readFileSync(revisitRubricPath, 'utf8'))
const revisitIssueCandidates = JSON.parse(fs.readFileSync(revisitIssueCandidatesPath, 'utf8'))

describe('persona test account registry', () => {
  it('contains unique synthetic persona and control accounts', () => {
    expect(Array.isArray(registry)).toBe(true)

    const ids = registry.map((account) => account.id)
    const emails = registry.map((account) => account.email)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(emails).size).toBe(emails.length)
    expect(emails.every((email) => email.endsWith('@feelflick.test'))).toBe(true)

    for (let number = 1; number <= 16; number += 1) {
      expect(ids).toContain(`P${number}`)
    }

    expect(ids).toContain('CTRL')
  })

  it('passes the provisioning registry validator', () => {
    expect(() => validateRegistry(registry)).not.toThrow()
  })
})

describe('persona account provisioning guardrails', () => {
  const baseApplyConfig = {
    allowRemote: false,
    apply: true,
    defaultedMode: false,
    dryRun: false,
    mode: 'apply',
    personaEnv: 'local',
    registryPath: 'docs/personas/persona-test-accounts.json',
    resetPassword: false,
    serviceRoleKey: 'not-a-real-key',
    supabaseUrl: 'http://127.0.0.1:54321',
    testPassword: 'StrongPersona1!x',
  }

  it('blocks production provisioning', () => {
    expect(() => validateExecutionConfig({ ...baseApplyConfig, personaEnv: 'production' }))
      .toThrow(/production is blocked/)
  })

  it('requires PERSONA_ALLOW_REMOTE=true for preview provisioning', () => {
    expect(() => validateExecutionConfig({
      ...baseApplyConfig,
      personaEnv: 'preview',
      supabaseUrl: 'https://preview-ref.supabase.co',
      allowRemote: false,
    })).toThrow(/PERSONA_ALLOW_REMOTE=true/)
  })

  it('allows preview provisioning when remote access is explicit', () => {
    expect(() => validateExecutionConfig({
      ...baseApplyConfig,
      personaEnv: 'preview',
      supabaseUrl: 'https://preview-ref.supabase.co',
      allowRemote: true,
    })).not.toThrow()
  })

  it('rejects weak persona account passwords', () => {
    expect(() => validatePasswordStrength('weak')).toThrow(/not strong enough/)
  })

  it('rejects registry emails outside @feelflick.test', () => {
    const unsafeRegistry = registry.map((account) => ({ ...account }))
    unsafeRegistry[0].email = 'persona@example.com'

    expect(() => validateRegistry(unsafeRegistry)).toThrow(/@feelflick\.test/)
  })

  it('selects only requested IDs with --limit', () => {
    const args = parseArgs(['--dry-run', '--limit', 'P1,P2,P11'])
    const selected = selectAccounts(registry, args.limit)

    expect(selected.map((account) => account.id)).toEqual(['P1', 'P2', 'P11'])
  })
})

describe('persona onboarding profiles', () => {
  const validMoodKeys = new Set(MOODS.map((mood) => mood.key))
  const validGenreNames = new Set(GENRES.map((genre) => genre.name))
  const validSentiments = new Set(['okay', 'liked', 'loved'])

  it('defines browser-fillable onboarding choices for every persona and control account', () => {
    const ids = onboardingProfiles.map((profile) => profile.id)

    expect(new Set(ids).size).toBe(ids.length)
    for (let number = 1; number <= 16; number += 1) {
      expect(ids).toContain(`P${number}`)
    }
    expect(ids).toContain('CTRL')
  })

  it('uses valid moods, genres, anchors, and sentiments', () => {
    for (const profile of onboardingProfiles) {
      expect(Array.isArray(profile.moods), `${profile.id} moods`).toBe(true)
      expect(profile.moods.length, `${profile.id} mood count`).toBeGreaterThanOrEqual(1)
      expect(profile.moods.length, `${profile.id} mood count`).toBeLessThanOrEqual(3)
      for (const mood of profile.moods) {
        expect(validMoodKeys.has(mood), `${profile.id} invalid mood ${mood}`).toBe(true)
      }

      expect(Array.isArray(profile.genres), `${profile.id} genres`).toBe(true)
      expect(profile.genres.length, `${profile.id} genre count`).toBeGreaterThanOrEqual(1)
      for (const genre of profile.genres) {
        expect(validGenreNames.has(genre), `${profile.id} invalid genre ${genre}`).toBe(true)
      }

      expect(Array.isArray(profile.anchorMovies), `${profile.id} anchors`).toBe(true)
      expect(profile.anchorMovies.length, `${profile.id} anchor count`).toBeGreaterThanOrEqual(5)
      for (const movie of profile.anchorMovies) {
        expect(typeof movie.query, `${profile.id} anchor query`).toBe('string')
        expect(movie.query.length, `${profile.id} anchor query`).toBeGreaterThan(0)
        expect(typeof movie.expectedTitleHint, `${profile.id} anchor hint`).toBe('string')
        expect(movie.expectedTitleHint.length, `${profile.id} anchor hint`).toBeGreaterThan(0)
        expect(validSentiments.has(movie.sentiment), `${profile.id} invalid sentiment ${movie.sentiment}`).toBe(true)
        expect(typeof movie.whyThisPersonaChoseIt, `${profile.id} anchor reason`).toBe('string')
        expect(movie.whyThisPersonaChoseIt.length, `${profile.id} anchor reason`).toBeGreaterThan(0)
      }

      expect(['slow', 'normal', 'fast']).toContain(profile.onboardingBehavior?.speed)
      expect(['low', 'medium', 'high']).toContain(profile.onboardingBehavior?.confidence)
      expect(typeof profile.onboardingBehavior?.likelyFriction).toBe('string')
      expect(typeof profile.onboardingBehavior?.humanNote).toBe('string')
    }
  })
})

describe('persona revisit rubric and evaluator', () => {
  const requiredTextFields = [
    'primaryQuestion',
    'trustLens',
    'recommendationBelievabilityLens',
    'voiceStyle',
    'sampleVoiceLine',
  ]
  const requiredArrayFields = [
    'confusionTriggers',
    'genericnessTriggers',
    'slownessTriggers',
    'emptinessTriggers',
    'untrustworthyTriggers',
    'comebackTriggers',
    'leaveTriggers',
    'requiredSurfaces',
    'optionalSurfaces',
  ]

  it('defines revisit rubric entries for every persona and control account', () => {
    expect(Array.isArray(revisitRubric)).toBe(true)

    const ids = revisitRubric.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (let number = 1; number <= 16; number += 1) {
      expect(ids).toContain(`P${number}`)
    }
    expect(ids).toContain('CTRL')
  })

  it('keeps required rubric fields populated and includes core surfaces', () => {
    for (const entry of revisitRubric) {
      for (const field of requiredTextFields) {
        expect(typeof entry[field], `${entry.id} ${field}`).toBe('string')
        expect(entry[field].length, `${entry.id} ${field}`).toBeGreaterThan(0)
      }

      for (const field of requiredArrayFields) {
        expect(Array.isArray(entry[field]), `${entry.id} ${field}`).toBe(true)
        expect(entry[field].length, `${entry.id} ${field}`).toBeGreaterThan(0)
      }

      expect(entry.requiredSurfaces, `${entry.id} required /home`).toContain('/home')
      expect(entry.requiredSurfaces, `${entry.id} required /discover`).toContain('/discover')
    }
  })

  it('generates bounded deterministic scores, allowed issue severities, and synthetic report labels', () => {
    const account = {
      ...registry.find((entry) => entry.id === 'P11'),
      loginWorked: true,
      sessionEmailMatched: true,
      authIssues: [],
    }
    const profile = onboardingProfiles.find((entry) => entry.id === 'P11')
    const rubric = revisitRubric.find((entry) => entry.id === 'P11')
    const observations = [
      {
        route: '/home',
        finalUrl: 'http://localhost:5173/home',
        title: 'Home - FeelFlick',
        status: 'visited',
        visibleHeadings: ['Tonight - your nightly pick'],
        primaryActions: ['Watch', 'Skip'],
        textExcerpt: 'Tonight pick because your cozy mood and taste history point this way.',
        consoleErrorsCount: 0,
        requestFailuresCount: 0,
        loadTimingBucket: 'fast',
        emptyStateDetected: false,
        genericCopyDetected: false,
        confusionSignals: [],
        screenshotPath: null,
      },
      {
        route: '/discover',
        finalUrl: 'http://localhost:5173/discover',
        title: 'Discover - FeelFlick',
        status: 'visited',
        visibleHeadings: ['What kind of night is this?'],
        primaryActions: ['Continue'],
        textExcerpt: 'Choose a mood and we will shape a pick for tonight.',
        consoleErrorsCount: 0,
        requestFailuresCount: 0,
        loadTimingBucket: 'normal',
        emptyStateDetected: false,
        genericCopyDetected: false,
        confusionSignals: [],
        screenshotPath: null,
      },
    ]

    const result = evaluatePersona({ account, profile, rubric, observations })
    for (const score of Object.values(result.scores)) {
      expect(score).toBeGreaterThanOrEqual(1)
      expect(score).toBeLessThanOrEqual(5)
    }

    for (const issue of result.issueCandidates) {
      expect(ALLOWED_SEVERITIES).toContain(issue.severity)
      expect(issue.syntheticOnly).toBe(true)
    }

    const markdown = renderPersonaMarkdown(result)
    expect(markdown).toContain(SYNTHETIC_LABEL)
  })
})

describe('persona revisit issue candidates', () => {
  const allowedPriorities = new Set(['P1', 'P2', 'Insight'])
  const allowedTypes = new Set(['bug', 'qa', 'product', 'workflow'])
  const forbiddenTerms = [
    'access_token',
    'refresh_token',
    'cookie',
    'localstorage',
    'service_role',
    'jwt',
  ]

  it('is clearly labeled as synthetic-only and not real-user validation', () => {
    expect(revisitIssueCandidates.syntheticOnly).toBe(true)
    expect(revisitIssueCandidates.notRealUserValidation).toBe(true)
    expect(Array.isArray(revisitIssueCandidates.items)).toBe(true)
    expect(revisitIssueCandidates.items.length).toBeGreaterThan(0)
    expect(revisitIssueCandidates.items.length).toBeLessThanOrEqual(8)
  })

  it('uses unique IDs, allowed priorities, and actionable fields', () => {
    const ids = revisitIssueCandidates.items.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const item of revisitIssueCandidates.items) {
      expect(item.id).toMatch(/^PRQA-\d{3}$/)
      expect(typeof item.title).toBe('string')
      expect(item.title.length).toBeGreaterThan(0)
      expect(allowedPriorities.has(item.priority), `${item.id} priority`).toBe(true)
      expect(allowedTypes.has(item.type), `${item.id} type`).toBe(true)
      expect(Array.isArray(item.personasMostAffected), `${item.id} personas`).toBe(true)
      expect(item.personasMostAffected.length, `${item.id} personas`).toBeGreaterThan(0)
      expect(Array.isArray(item.surfacesAffected), `${item.id} surfaces`).toBe(true)
      expect(item.surfacesAffected.length, `${item.id} surfaces`).toBeGreaterThan(0)
      expect(Array.isArray(item.evidence), `${item.id} evidence`).toBe(true)
      expect(item.evidence.length, `${item.id} evidence`).toBeGreaterThan(0)
      expect(typeof item.whyItMatters, `${item.id} why`).toBe('string')
      expect(item.whyItMatters.length, `${item.id} why`).toBeGreaterThan(0)
      expect(typeof item.suggestedNextAction, `${item.id} action`).toBe('string')
      expect(item.suggestedNextAction.length, `${item.id} action`).toBeGreaterThan(0)
      expect(Array.isArray(item.acceptanceCriteria), `${item.id} criteria`).toBe(true)
      expect(item.acceptanceCriteria.length, `${item.id} criteria`).toBeGreaterThan(0)
      expect(Array.isArray(item.nonGoals), `${item.id} nonGoals`).toBe(true)
      expect(item.nonGoals.length, `${item.id} nonGoals`).toBeGreaterThan(0)
    }
  })

  it('does not contain obvious secret-bearing terms', () => {
    const serialized = JSON.stringify(revisitIssueCandidates).toLowerCase()
    for (const term of forbiddenTerms) {
      expect(serialized.includes(term), `forbidden term ${term}`).toBe(false)
    }
  })
})
