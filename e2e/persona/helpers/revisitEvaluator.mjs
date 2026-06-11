export const SYNTHETIC_LABEL = 'Synthetic UX inspection — not real-user validation'
export const ALLOWED_SEVERITIES = ['P0', 'P1', 'P2', 'Insight']

const RECOMMENDATION_WORDS = [
  'pick',
  'recommend',
  'tonight',
  'match',
  'because',
  'why',
  'fits',
  'taste',
  'mood',
  'film file',
]

const TRUST_WORDS = [
  'because',
  'why',
  'taste',
  'mood',
  'dna',
  'film file',
  'not real reviews',
  'generated viewer notes',
  'history',
  'watched',
  'rated',
  'saved',
]

const GENERIC_WORDS = [
  'for you',
  'picked for you',
  'recommended for you',
  'popular',
  'trending',
  'perfect match',
  'you will love',
]

const EMPTY_WORDS = [
  'empty',
  'nothing here',
  'no picks',
  'no movies',
  'no films',
  'no history',
  'no watchlist',
  'couldn\'t load',
  'try refreshing',
]

const ROUTE_LABELS = {
  '/': 'Root',
  '/home': 'Home',
  '/discover': 'Discover',
  '/profile': 'Profile',
  '/watchlist': 'Watchlist',
  '/history': 'History',
  '/movie/:id': 'Movie detail',
}

export function clampScore(value) {
  if (!Number.isFinite(value)) return 3
  return Math.max(1, Math.min(5, Math.round(value)))
}

export function evaluatePersona({ account, profile, rubric, observations, movieDetail = null }) {
  const safeObservations = Array.isArray(observations) ? observations : []
  const allObservations = movieDetail ? [...safeObservations, movieDetail] : safeObservations
  const failed = allObservations.filter((observation) => observation?.status === 'failed')
  const combinedText = allObservations.map((observation) => observation?.textExcerpt || '').join('\n').toLowerCase()
  const observedRoutes = allObservations.map((observation) => observation?.route).filter(Boolean)

  const recommendationObserved = hasAny(combinedText, RECOMMENDATION_WORDS)
  const trustMatches = TRUST_WORDS.filter((word) => combinedText.includes(word))
  const genericObservations = allObservations.filter((observation) => observation?.genericCopyDetected)
  const emptyObservations = allObservations.filter((observation) => observation?.emptyStateDetected)
  const slowObservations = allObservations.filter((observation) => ['slow', 'timeout'].includes(observation?.loadTimingBucket))
  const confusionSignals = allObservations.flatMap((observation) => observation?.confusionSignals || [])
  const consoleOrRequestFailures = allObservations.filter((observation) => (
    Number(observation?.consoleErrorsCount || 0) > 0 || Number(observation?.requestFailuresCount || 0) > 0
  ))
  const rubricUntrustworthyMatches = (rubric?.untrustworthyTriggers || []).filter((trigger) => (
    combinedText.includes(String(trigger).toLowerCase())
  ))
  const rubricComebackMatches = (rubric?.comebackTriggers || []).filter((trigger) => (
    combinedText.includes(String(trigger).toLowerCase())
  ))
  const rubricLeaveMatches = (rubric?.leaveTriggers || []).filter((trigger) => (
    combinedText.includes(String(trigger).toLowerCase())
  ))

  const onboardingEvidence = buildOnboardingEvidence(allObservations, profile)
  const seemsOnboarded = observedRoutes.includes('/profile') || observedRoutes.includes('/history')
    ? true
    : 'unknown'

  const recommendationScore = clampScore(
    3
    + (recommendationObserved ? 1 : -1)
    + (trustMatches.length > 0 ? 1 : 0)
    - Math.min(2, genericObservations.length)
    - Math.min(2, emptyObservations.length)
    - Math.min(1, failed.length)
  )

  const feltExperience = {
    confusing: uniqueStrings(confusionSignals),
    generic: genericObservations.map((observation) => observedMessage('OBSERVED', observation, 'Generic or over-broad recommendation language was visible.')),
    slowOrHeavy: slowObservations.map((observation) => observedMessage('OBSERVED', observation, `Load felt ${observation.loadTimingBucket}.`)),
    emptyOrThin: emptyObservations.map((observation) => observedMessage('OBSERVED', observation, 'The surface looked empty or thin for this persona.')),
    untrustworthy: [
      ...consoleOrRequestFailures.map((observation) => observedMessage('OBSERVED', observation, 'Console or request failures appeared during the visit.')),
      ...rubricUntrustworthyMatches.map((trigger) => `INFERRED: "${trigger}" matched ${account.id}'s untrustworthy trigger list.`),
    ],
    trustBuilders: [
      ...trustMatches.slice(0, 6).map((word) => `OBSERVED: The UI included "${word}" language.`),
      ...rubricComebackMatches.slice(0, 3).map((trigger) => `INFERRED: "${trigger}" lines up with this persona's comeback triggers.`),
    ],
  }

  const scores = {
    trust: clampScore(3 + feltExperience.trustBuilders.length * 0.35 - feltExperience.untrustworthy.length * 0.7 - failed.length),
    clarity: clampScore(4 - Math.min(3, feltExperience.confusing.length) - (failed.length ? 1 : 0)),
    momentum: clampScore(4 - Math.min(3, feltExperience.slowOrHeavy.length + feltExperience.emptyOrThin.length)),
    feltPersonal: clampScore(3 + (onboardingEvidence.length ? 1 : 0) + (trustMatches.length ? 1 : 0) - Math.min(2, feltExperience.generic.length)),
    returnLikelihood: clampScore(3 + Math.min(2, rubricComebackMatches.length) - Math.min(2, rubricLeaveMatches.length) - Math.min(1, emptyObservations.length)),
    friction: clampScore(1 + feltExperience.confusing.length + feltExperience.slowOrHeavy.length + feltExperience.emptyOrThin.length + failed.length),
  }

  const issueCandidates = buildIssueCandidates({
    account,
    observations: allObservations,
    recommendationObserved,
    feltExperience,
  })

  const result = {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
    archetype: account.archetype,
    survivalInstinct: account.survivalInstinct,
    sourceMindset: account.sourceMindset,
    syntheticOnly: true,
    accountReliability: {
      loginWorked: Boolean(account.loginWorked),
      sessionEmailMatched: Boolean(account.sessionEmailMatched),
      authIssues: account.authIssues || [],
    },
    onboardingMemory: {
      onboarded: seemsOnboarded,
      evidence: onboardingEvidence.length
        ? onboardingEvidence
        : ['NOT_OBSERVED: No explicit onboarding memory signal was captured from the visited surfaces.'],
      seemsToRememberPersona: onboardingEvidence.length > 0,
    },
    recommendationBelievability: {
      score: recommendationScore,
      reasons: buildRecommendationReasons({
        recommendationObserved,
        trustMatches,
        genericObservations,
        emptyObservations,
        rubric,
      }),
      warning: recommendationObserved ? null : 'NOT_OBSERVED: No clear recommendation or pick language was visible in the captured text.',
    },
    feltExperience,
    comebackReason: buildComebackReason(account, rubric, feltExperience),
    leaveReason: buildLeaveReason(account, rubric, feltExperience),
    personaVoiceFeedback: buildVoiceFeedback({ account, rubric, observations: allObservations, feltExperience, recommendationObserved }),
    scores,
    issueCandidates,
    routesVisited: observedRoutes,
    observations: allObservations,
  }

  return result
}

export function buildAggregate(personaResults) {
  const results = Array.isArray(personaResults) ? personaResults : []
  const scoreAverage = (field) => average(results.map((result) => result?.scores?.[field]).filter(Number.isFinite))
  const issues = results.flatMap((result) => result?.issueCandidates || [])

  return {
    avgTrust: scoreAverage('trust'),
    avgClarity: scoreAverage('clarity'),
    avgMomentum: scoreAverage('momentum'),
    avgFeltPersonal: scoreAverage('feltPersonal'),
    avgReturnLikelihood: scoreAverage('returnLikelihood'),
    avgFriction: scoreAverage('friction'),
    topComebackReasons: results.map((result) => result.comebackReason).filter(Boolean).slice(0, 8),
    topLeaveReasons: results.map((result) => result.leaveReason).filter(Boolean).slice(0, 8),
    issueCandidatesBySeverity: ALLOWED_SEVERITIES.reduce((acc, severity) => {
      acc[severity] = issues.filter((issue) => issue.severity === severity).length
      return acc
    }, {}),
    weakestSurfaces: rankSurfaces(results, 'weakest').slice(0, 5),
    strongestSurfaces: rankSurfaces(results, 'strongest').slice(0, 5),
  }
}

export function renderPersonaMarkdown(result) {
  const observations = Array.isArray(result?.observations) ? result.observations : []
  const issueCandidates = Array.isArray(result?.issueCandidates) ? result.issueCandidates : []

  return [
    `# ${result.id} - ${result.displayName}`,
    '',
    SYNTHETIC_LABEL,
    '',
    `## Persona identity`,
    '',
    `- Archetype: ${safeMarkdown(result.archetype)}`,
    `- Source mindset: ${safeMarkdown(result.sourceMindset)}`,
    `- Survival instinct: ${safeMarkdown(result.survivalInstinct)}`,
    '',
    `## Routes visited`,
    '',
    ...bulletList(observations.map((observation) => `${observation.route}: ${observation.status}${observation.finalUrl ? ` (${observation.finalUrl})` : ''}`)),
    '',
    `## What worked`,
    '',
    ...bulletList(result.feltExperience?.trustBuilders?.length ? result.feltExperience.trustBuilders : ['NOT_OBSERVED: No strong trust builder was captured.']),
    '',
    `## What felt confusing/generic/slow/empty/untrustworthy`,
    '',
    ...bulletList([
      ...(result.feltExperience?.confusing || []),
      ...(result.feltExperience?.generic || []),
      ...(result.feltExperience?.slowOrHeavy || []),
      ...(result.feltExperience?.emptyOrThin || []),
      ...(result.feltExperience?.untrustworthy || []),
    ].filter(Boolean), 'No major synthetic friction was detected in the captured surfaces.'),
    '',
    `## Recommendation believability`,
    '',
    `Score: ${result.recommendationBelievability?.score ?? 'unknown'}/5`,
    '',
    ...bulletList(result.recommendationBelievability?.reasons || []),
    ...(result.recommendationBelievability?.warning ? ['', `- ${safeMarkdown(result.recommendationBelievability.warning)}`] : []),
    '',
    `## Comeback reason`,
    '',
    safeMarkdown(result.comebackReason),
    '',
    `## Leave reason`,
    '',
    safeMarkdown(result.leaveReason),
    '',
    `## Persona voice feedback`,
    '',
    ...bulletList(result.personaVoiceFeedback || []),
    '',
    `## Issue candidates`,
    '',
    ...bulletList(issueCandidates.map((issue) => `${issue.severity} on ${issue.surface}: ${issue.issue} Evidence: ${issue.evidence} Next: ${issue.suggestedNextAction}`), 'No issue candidates from this synthetic pass.'),
    '',
  ].join('\n')
}

export function detectGenericCopy(text, extraTriggers = []) {
  const lower = String(text || '').toLowerCase()
  return hasAny(lower, [...GENERIC_WORDS, ...extraTriggers.map((trigger) => String(trigger).toLowerCase())])
}

export function detectEmptyState(text) {
  const lower = String(text || '').toLowerCase()
  if (!lower.trim()) return true
  return hasAny(lower, EMPTY_WORDS)
}

function buildOnboardingEvidence(observations, profile) {
  const text = observations.map((observation) => observation?.textExcerpt || '').join('\n').toLowerCase()
  const profileSignals = [
    ...(profile?.moods || []),
    ...(profile?.genres || []),
    ...(profile?.anchorMovies || []).map((movie) => movie.expectedTitleHint),
  ].map((value) => String(value || '').toLowerCase()).filter(Boolean)

  return uniqueStrings(profileSignals
    .filter((signal) => signal.length >= 3 && text.includes(signal))
    .slice(0, 8)
    .map((signal) => `OBSERVED: Captured UI text included onboarding signal "${signal}".`))
}

function buildRecommendationReasons({ recommendationObserved, trustMatches, genericObservations, emptyObservations, rubric }) {
  const reasons = []
  if (recommendationObserved) {
    reasons.push('OBSERVED: Captured UI text included recommendation or pick language.')
  } else {
    reasons.push('NOT_OBSERVED: Captured UI text did not show a clear recommendation or pick.')
  }

  if (trustMatches.length) {
    reasons.push(`OBSERVED: Trust-building terms appeared: ${trustMatches.slice(0, 5).join(', ')}.`)
  }
  if (genericObservations.length) {
    reasons.push('OBSERVED: At least one surface used generic recommendation language.')
  }
  if (emptyObservations.length) {
    reasons.push('OBSERVED: At least one visited surface appeared empty or thin.')
  }
  if (rubric?.recommendationBelievabilityLens) {
    reasons.push(`INFERRED: Judged through this persona lens: ${rubric.recommendationBelievabilityLens}`)
  }
  return reasons
}

function buildIssueCandidates({ account, observations, recommendationObserved, feltExperience }) {
  const issues = []

  for (const observation of observations) {
    if (observation?.status === 'failed') {
      issues.push(issue({
        severity: 'P1',
        personaId: account.id,
        surface: observation.route || 'unknown',
        issue: 'Persona could not reliably visit this surface.',
        evidence: `OBSERVED: ${observation.safeMessage || 'Route visit failed.'}`,
        suggestedNextAction: 'Re-run the route with trace and inspect the page-level failure.',
      }))
    }

    if (observation?.emptyStateDetected) {
      issues.push(issue({
        severity: 'P2',
        personaId: account.id,
        surface: observation.route || 'unknown',
        issue: 'Surface looked empty or thin for this persona.',
        evidence: 'OBSERVED: Empty-state heuristic matched captured body text.',
        suggestedNextAction: 'Confirm whether this persona should have enough onboarding/history signal for this surface.',
      }))
    }

    if (observation?.genericCopyDetected) {
      issues.push(issue({
        severity: 'Insight',
        personaId: account.id,
        surface: observation.route || 'unknown',
        issue: 'Generic language may weaken the persona-specific case.',
        evidence: 'OBSERVED: Generic-copy heuristic matched captured body text.',
        suggestedNextAction: 'Review whether the surface can show a more concrete taste reason.',
      }))
    }

    if (Number(observation?.consoleErrorsCount || 0) > 0 || Number(observation?.requestFailuresCount || 0) > 0) {
      issues.push(issue({
        severity: 'P2',
        personaId: account.id,
        surface: observation.route || 'unknown',
        issue: 'Browser errors or request failures appeared during the revisit.',
        evidence: `OBSERVED: consoleErrors=${observation.consoleErrorsCount || 0}, requestFailures=${observation.requestFailuresCount || 0}.`,
        suggestedNextAction: 'Inspect Playwright trace and app logs for the failed surface.',
      }))
    }
  }

  if (!recommendationObserved) {
    issues.push(issue({
      severity: 'Insight',
      personaId: account.id,
      surface: '/home,/discover',
      issue: 'No clear recommendation or pick was visible in captured text.',
      evidence: 'NOT_OBSERVED: Recommendation/pick language did not appear in route observations.',
      suggestedNextAction: 'Check whether the persona has enough data and whether Home or Discover exposes a concrete pick.',
    }))
  }

  if (feltExperience.untrustworthy.length > 0) {
    issues.push(issue({
      severity: 'P2',
      personaId: account.id,
      surface: 'multiple',
      issue: 'Persona trust triggers were activated.',
      evidence: feltExperience.untrustworthy[0],
      suggestedNextAction: 'Review the trust lens and captured text before treating this as product direction.',
    }))
  }

  return issues
}

function issue({ severity, personaId, surface, issue: issueText, evidence, suggestedNextAction }) {
  return {
    severity: ALLOWED_SEVERITIES.includes(severity) ? severity : 'Insight',
    personaId,
    surface,
    issue: issueText,
    evidence,
    suggestedNextAction,
    syntheticOnly: true,
  }
}

function buildComebackReason(account, rubric, feltExperience) {
  const trigger = first(rubric?.comebackTriggers)
  if (feltExperience.trustBuilders.length) {
    return `INFERRED: ${account.id} would come back if FeelFlick keeps turning ${trigger || 'taste evidence'} into a concrete next watch.`
  }
  return `INFERRED: ${account.id} would come back only if the next pass shows ${trigger || 'clearer persona-specific evidence'}.`
}

function buildLeaveReason(account, rubric, feltExperience) {
  const trigger = first(rubric?.leaveTriggers)
  if (feltExperience.emptyOrThin.length || feltExperience.generic.length) {
    return `INFERRED: ${account.id} would leave if the app keeps feeling like ${trigger || 'generic browsing'} instead of remembering this persona.`
  }
  return `INFERRED: ${account.id} would leave if ${trigger || 'the recommendation case stops feeling credible'}.`
}

function buildVoiceFeedback({ account, rubric, observations, feltExperience, recommendationObserved }) {
  const lines = []
  const visitedLabels = observations.filter((observation) => observation.status === 'visited').map((observation) => ROUTE_LABELS[observation.route] || observation.route)
  const headings = observations.flatMap((observation) => observation.visibleHeadings || []).filter(Boolean)
  const firstHeading = headings[0]

  lines.push(rubric?.sampleVoiceLine || account.feedbackStyle || 'I need the app to prove it understands this taste.')
  if (visitedLabels.length) {
    lines.push(`I saw ${uniqueStrings(visitedLabels).slice(0, 4).join(', ')}, so I am judging this from the actual app surfaces, not a promise.`)
  }
  if (firstHeading) {
    lines.push(`The first thing I latched onto was "${firstHeading}", because it set the tone for whether this felt personal.`)
  }
  if (recommendationObserved) {
    lines.push('There is enough pick language here for me to look for a reason, but I still need the reason to be specific.')
  } else {
    lines.push('I did not see a clear pick in the captured text, so I would still be hunting instead of deciding.')
  }
  if (feltExperience.generic.length) {
    lines.push('The generic bits make me worry this could forget what I already told it.')
  }
  if (feltExperience.emptyOrThin.length) {
    lines.push('The thin areas make the product feel less ready for my taste than the onboarding implied.')
  }
  if (!feltExperience.generic.length && !feltExperience.emptyOrThin.length && feltExperience.trustBuilders.length) {
    lines.push('The trust cues give me something to come back to on another night.')
  }

  return uniqueStrings(lines).slice(0, 6)
}

function rankSurfaces(results, direction) {
  const bySurface = new Map()
  for (const result of results) {
    for (const observation of result.observations || []) {
      const key = observation.route || 'unknown'
      const current = bySurface.get(key) || { surface: key, visits: 0, issues: 0, trustSignals: 0 }
      current.visits += 1
      if (observation.status === 'failed' || observation.emptyStateDetected || observation.genericCopyDetected) current.issues += 1
      if (hasAny(String(observation.textExcerpt || '').toLowerCase(), TRUST_WORDS)) current.trustSignals += 1
      bySurface.set(key, current)
    }
  }
  return Array.from(bySurface.values()).sort((a, b) => {
    const aScore = a.trustSignals - a.issues
    const bScore = b.trustSignals - b.issues
    return direction === 'strongest' ? bScore - aScore : aScore - bScore
  })
}

function observedMessage(kind, observation, message) {
  return `${kind}: ${message} Surface: ${observation?.route || 'unknown'}.`
}

function hasAny(text, words) {
  return words.some((word) => text.includes(String(word || '').toLowerCase()))
}

function uniqueStrings(values) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
}

function average(values) {
  if (!values.length) return null
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
}

function first(values) {
  return Array.isArray(values) && values.length ? values[0] : null
}

function bulletList(values, fallback = null) {
  const list = values.filter(Boolean)
  if (!list.length && fallback) return [`- ${safeMarkdown(fallback)}`]
  return list.map((value) => `- ${safeMarkdown(value)}`)
}

function safeMarkdown(value) {
  return String(value ?? '')
    .replace(/password=[^&\s]+/gi, 'password=REDACTED')
    .replace(/access_token[=:][^&\s]+/gi, 'access_token=REDACTED')
    .replace(/refresh_token[=:][^&\s]+/gi, 'refresh_token=REDACTED')
    .replace(/apikey=[^&\s]+/gi, 'apikey=REDACTED')
    .replace(/authorization[:=][^&\s]+/gi, 'authorization=REDACTED')
}
