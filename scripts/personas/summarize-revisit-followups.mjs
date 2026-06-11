#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_SUMMARY_PATH = 'e2e/.persona-artifacts/revisit-summary.json'
const SECRET_PATTERNS = [
  /access_token/gi,
  /refresh_token/gi,
  /service_role/gi,
  /apikey/gi,
  /authorization/gi,
  /cookie/gi,
  /localStorage/gi,
  /\bjwt\b/gi,
  /[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g,
]

function main() {
  const summaryPath = resolveSummaryPath(process.argv.slice(2))
  guardSafeReadPath(summaryPath)

  if (!fs.existsSync(summaryPath)) {
    console.log(`Persona revisit summary not found at ${normalizePath(path.relative(process.cwd(), summaryPath))}.`)
    console.log('Run `npm run persona:revisit` first, then rerun this summary command.')
    return
  }

  const summary = readSummary(summaryPath)
  const issues = summary.personaResults?.flatMap((result) => result.issueCandidates || []) || []
  const groupedIssues = groupIssues(issues).slice(0, 10)

  console.log('Persona revisit safe summary')
  console.log(`Source: ${normalizePath(path.relative(process.cwd(), summaryPath))}`)
  console.log(`Synthetic only: ${summary.personaResults?.every((result) => result.syntheticOnly) ? 'true' : 'unknown'}`)
  console.log(`Selected personas: ${safe(summary.selectedPersonaCount)}`)
  console.log(`Passed: ${safe(summary.passedCount)}`)
  console.log(`Failed: ${safe(summary.failedCount)}`)
  console.log(`Surfaces visited: ${(summary.surfacesVisited || []).map(safe).join(', ')}`)
  console.log(`Scores: trust ${score(summary.aggregate?.avgTrust)}, clarity ${score(summary.aggregate?.avgClarity)}, momentum ${score(summary.aggregate?.avgMomentum)}, feltPersonal ${score(summary.aggregate?.avgFeltPersonal)}, returnLikelihood ${score(summary.aggregate?.avgReturnLikelihood)}, friction ${score(summary.aggregate?.avgFriction)}`)
  console.log(`Issue severity summary: ${JSON.stringify(summary.aggregate?.issueCandidatesBySeverity || {})}`)
  console.log('Grouped issue candidates:')

  if (!groupedIssues.length) {
    console.log('- none')
  } else {
    for (const issue of groupedIssues) {
      console.log(`- ${issue.count}x [${safe(issue.severity)}] ${safe(issue.surface)}: ${safe(issue.issue)}`)
    }
  }

  console.log('No auth states, screenshots, cookies, browser storage, or secrets are read by this helper.')
}

function resolveSummaryPath(args) {
  const explicitPath = args.find((arg) => !arg.startsWith('-'))
  return path.resolve(process.cwd(), explicitPath || process.env.PERSONA_REVISIT_SUMMARY || DEFAULT_SUMMARY_PATH)
}

function guardSafeReadPath(filePath) {
  const normalized = normalizePath(filePath)
  const basename = path.basename(filePath).toLowerCase()
  if (normalized.includes('/e2e/.auth/') || normalized.includes('/.auth/')) {
    throw new Error('Refusing to read auth-state paths. Use the safe revisit summary JSON instead.')
  }
  if (/\.(png|jpe?g|webp|gif)$/i.test(basename)) {
    throw new Error('Refusing to read screenshot/image files. Use the safe revisit summary JSON instead.')
  }
}

function readSummary(summaryPath) {
  try {
    return JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
  } catch (error) {
    throw new Error(`Could not parse revisit summary at ${normalizePath(path.relative(process.cwd(), summaryPath))}: ${error.message}`)
  }
}

function groupIssues(issues) {
  const grouped = new Map()
  for (const issue of issues) {
    const key = `${issue.severity || 'Unknown'}::${issue.surface || 'unknown'}::${issue.issue || 'Unknown issue'}`
    const current = grouped.get(key) || {
      severity: issue.severity || 'Unknown',
      surface: issue.surface || 'unknown',
      issue: issue.issue || 'Unknown issue',
      count: 0,
    }
    current.count += 1
    grouped.set(key, current)
  }

  return Array.from(grouped.values()).sort((a, b) => b.count - a.count || a.surface.localeCompare(b.surface))
}

function score(value) {
  return Number.isFinite(value) ? `${value}/5` : 'unknown'
}

function safe(value) {
  let output = String(value ?? '')
  for (const pattern of SECRET_PATTERNS) {
    output = output.replace(pattern, 'REDACTED')
  }
  return output
}

function normalizePath(value) {
  return String(value).split(path.sep).join('/')
}

try {
  main()
} catch (error) {
  console.error(safe(error.message || error))
  process.exitCode = 1
}
