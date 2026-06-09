import { describe, it, expect } from 'vitest'

import { derivePrimaryCase } from '../primaryCase'

// F5.2 — pins the CURRENT PrimaryCaseCard tier-selection logic (extracted verbatim
// from PrimaryCaseCard.jsx). F5.4 will intentionally change this hierarchy; until
// then these assert today's behavior so any change is a visible, reviewable diff.

const HEADER_WARM = {
  eyebrow: 'Why this fits you',
  headline: 'Signals from your last 20 films.',
  rationale: 'Mood overlap, director history, and runtime patterns.',
}
const HEADER_COLD = {
  eyebrow: 'Editorial fingerprint',
  headline: 'How this film reads.',
  rationale: 'Rate 5+ films to unlock personalized matching.',
}

describe('derivePrimaryCase — current tier hierarchy (pre-F5.4)', () => {
  it('generated ff_take wins over the adaptive rationale', () => {
    const r = derivePrimaryCase({
      ffTake: { body: 'A class war told as a home invasion.', byline: 'FeelFlick take' },
      whyHeader: HEADER_WARM, matchPct: 94, signedIn: true,
    })
    expect(r.tier).toBe('generated_take')
    expect(r.provenance).toBe('generated')
    expect(r.isTake).toBe(true)
    expect(r.lead).toBe('A class war told as a home invasion.')
    expect(r.label).toBe('FeelFlick take') // custom byline used
  })

  it('uses the default byline when ff_take has none', () => {
    const r = derivePrimaryCase({ ffTake: { body: 'A quiet stunner.' }, whyHeader: HEADER_WARM })
    expect(r.label).toBe('FeelFlick’s read') // current default (typographic apostrophe)
  })

  it('trims the ff_take body and ignores a whitespace-only take', () => {
    expect(derivePrimaryCase({ ffTake: { body: '  spaced  ' }, whyHeader: HEADER_WARM }).lead).toBe('spaced')
    const blank = derivePrimaryCase({ ffTake: { body: '   ' }, whyHeader: HEADER_WARM })
    expect(blank.isTake).toBe(false)
    expect(blank.lead).toBe(HEADER_WARM.rationale) // falls through to the rationale
  })

  it('falls back to the warm whyHeader rationale (adaptive_reason)', () => {
    const r = derivePrimaryCase({ ffTake: null, whyHeader: HEADER_WARM, matchPct: 80, signedIn: true })
    expect(r.tier).toBe('adaptive_reason')
    expect(r.provenance).toBe('derived')
    expect(r.lead).toBe(HEADER_WARM.rationale)
    expect(r.label).toBe('Why this fits you') // eyebrow becomes the label
  })

  it('classifies the cold / signed-out rationale as standalone (static)', () => {
    const r = derivePrimaryCase({ ffTake: null, whyHeader: HEADER_COLD, signedIn: false })
    expect(r.tier).toBe('standalone')
    expect(r.provenance).toBe('static')
    expect(r.label).toBe('Editorial fingerprint')
  })

  it('uses the "How this reads" eyebrow fallback when no whyHeader eyebrow', () => {
    const r = derivePrimaryCase({ ffTake: null, whyHeader: { rationale: '' }, matchPct: 70 })
    expect(r.label).toBe('How this reads')
    expect(r.tier).toBe('signals_only') // no lead, but a match exists
  })

  it('match availability: finite positive → hasMatch; zero/null/NaN → not', () => {
    expect(derivePrimaryCase({ whyHeader: HEADER_WARM, matchPct: 1 }).hasMatch).toBe(true)
    expect(derivePrimaryCase({ whyHeader: HEADER_WARM, matchPct: 0 }).hasMatch).toBe(false)
    expect(derivePrimaryCase({ whyHeader: HEADER_WARM, matchPct: null }).hasMatch).toBe(false)
    expect(derivePrimaryCase({ whyHeader: HEADER_WARM, matchPct: NaN }).hasMatch).toBe(false)
  })

  it('builds chips from the first mood tag and the fit profile (capitalized, underscores→spaces)', () => {
    const r = derivePrimaryCase({ whyHeader: { rationale: '' }, moodTags: ['tense', 'dark'], fitProfile: 'prestige_drama' })
    expect(r.chips).toEqual(['Tense', 'Prestige drama'])
  })

  it('shows the sign-in nudge only for a signed-out generated take', () => {
    expect(derivePrimaryCase({ ffTake: { body: 'x' }, whyHeader: HEADER_WARM, signedIn: false }).showNudge).toBe(true)
    expect(derivePrimaryCase({ ffTake: { body: 'x' }, whyHeader: HEADER_WARM, signedIn: true }).showNudge).toBe(false)
    // signed-out without a take (the rationale already says "sign in") → no extra nudge
    expect(derivePrimaryCase({ ffTake: null, whyHeader: HEADER_COLD, signedIn: false }).showNudge).toBe(false)
  })

  it('shouldRender: true when any of lead / match / chips exist; signals_only still renders', () => {
    expect(derivePrimaryCase({ whyHeader: { rationale: '' }, matchPct: 80 }).shouldRender).toBe(true)
    expect(derivePrimaryCase({ whyHeader: { rationale: '' }, moodTags: ['tense'] }).shouldRender).toBe(true)
    expect(derivePrimaryCase({ whyHeader: { rationale: '' }, matchPct: 80 }).tier).toBe('signals_only')
  })

  it('fully empty input → empty tier, does not render', () => {
    const r = derivePrimaryCase({ ffTake: null, whyHeader: { rationale: '' }, matchPct: null })
    expect(r.tier).toBe('empty')
    expect(r.provenance).toBe(null)
    expect(r.shouldRender).toBe(false)
    expect(r.chips).toEqual([])
  })
})
