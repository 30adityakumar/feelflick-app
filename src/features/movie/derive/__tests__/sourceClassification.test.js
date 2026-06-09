import { describe, it, expect } from 'vitest'

import {
  FILM_FILE_SOURCE_REGISTRY as REG,
  classifyFilmFileContent,
} from '../sourceClassification'

// F5.2 — the code-level encoding of the F5.1 provenance matrix. Pins origin +
// presentation per Film File content surface so F5.4's trust redesign can reason
// from one source of truth. Pure: no behavior change, no rendering decision.

describe('FILM_FILE_SOURCE_REGISTRY — provenance matrix', () => {
  const has = (k) => expect(REG[k], k).toBeTruthy()

  it('classifies the real, directly-shown surfaces', () => {
    for (const k of ['heroFacts', 'friendsLoved', 'tasteTwinReview', 'providers', 'castAndCredits', 'yourTake']) {
      has(k)
      expect(REG[k].origin, k).toBe('real')
      expect(REG[k].presentation, k).toBe('direct')
    }
  })

  it('classifies match % and Why-for-you as real-origin / derived-presentation (NOT generated)', () => {
    expect(REG.matchPercentage.origin).toBe('real')
    expect(REG.matchPercentage.presentation).toBe('derived')
    expect(REG.whyForYou.origin).toBe('real')
    expect(REG.whyForYou.presentation).toBe('derived')
  })

  it('classifies the generated overlay surfaces as generated', () => {
    expect(REG.ffTake.origin).toBe('generated')
    expect(REG.ffTake.presentation).toBe('direct')
    expect(REG.viewerNotes.origin).toBe('generated') // critic_quotes = invented personas
    expect(REG.viewerNotes.presentation).toBe('direct')
    expect(REG.daypartFit.origin).toBe('generated')
    expect(REG.daypartFit.presentation).toBe('direct')
  })

  it('classifies Mood Radar as generated-origin (llm_*) / derived-presentation (geometry)', () => {
    expect(REG.moodRadar.origin).toBe('generated')
    expect(REG.moodRadar.presentation).toBe('derived')
  })

  it('classifies cold-start / fallback copy as static', () => {
    expect(REG.coldStartCopy.origin).toBe('static')
    expect(REG.coldStartCopy.presentation).toBe('direct')
  })

  it('never marks a generated surface as real, nor a real user review as generated', () => {
    const generated = ['ffTake', 'viewerNotes', 'daypartFit', 'moodRadar']
    for (const k of generated) expect(REG[k].origin, k).toBe('generated')
    // Friends / Taste-Twin review text is REAL user-authored data, never generated.
    expect(REG.friendsLoved.origin).toBe('real')
    expect(REG.tasteTwinReview.origin).toBe('real')
  })

  it('only uses the three allowed origins and two presentations', () => {
    for (const [k, v] of Object.entries(REG)) {
      expect(['real', 'generated', 'static'], k).toContain(v.origin)
      expect(['direct', 'derived'], k).toContain(v.presentation)
      expect(typeof v.source, k).toBe('string')
    }
  })
})

describe('classifyFilmFileContent — availability', () => {
  it('is null-safe with no arguments and returns every element', () => {
    const c = classifyFilmFileContent()
    expect(Object.keys(c).sort()).toEqual(Object.keys(REG).sort())
    // structural surfaces are always available
    expect(c.heroFacts.available).toBe(true)
    expect(c.castAndCredits.available).toBe(true)
    expect(c.coldStartCopy.available).toBe(true)
    // variable surfaces default to unavailable with no inputs
    expect(c.ffTake.available).toBe(false)
    expect(c.viewerNotes.available).toBe(false)
    expect(c.matchPercentage.available).toBe(false)
    expect(c.friendsLoved.available).toBe(false)
  })

  it('reports each spread element with its registry provenance + an available flag', () => {
    const c = classifyFilmFileContent({ overlay: { ff_take: { body: 'A class war.' } } })
    expect(c.ffTake).toEqual({ ...REG.ffTake, available: true })
    expect(c.viewerNotes).toEqual({ ...REG.viewerNotes, available: false })
  })

  it('marks generated overlay surfaces available only when present', () => {
    const c = classifyFilmFileContent({
      overlay: { ff_take: { body: '  ' }, critic_quotes: [{ quote: 'x' }], daypart_fit: 'evening' },
    })
    expect(c.ffTake.available).toBe(false)        // whitespace-only body → not available
    expect(c.viewerNotes.available).toBe(true)
    expect(c.daypartFit.available).toBe(true)
  })

  it('marks Mood Radar available only when a finite llm_* signal exists', () => {
    expect(classifyFilmFileContent({ filmRow: { llm_intensity: 70 } }).moodRadar.available).toBe(true)
    expect(classifyFilmFileContent({ filmRow: { mood_tags: ['tense'] } }).moodRadar.available).toBe(false)
    expect(classifyFilmFileContent({ filmRow: { llm_pacing: null } }).moodRadar.available).toBe(false)
  })

  it('marks match % available only for a finite positive value', () => {
    expect(classifyFilmFileContent({ matchPct: 84 }).matchPercentage.available).toBe(true)
    expect(classifyFilmFileContent({ matchPct: 0 }).matchPercentage.available).toBe(false)
    expect(classifyFilmFileContent({ matchPct: null }).matchPercentage.available).toBe(false)
    expect(classifyFilmFileContent({ matchPct: NaN }).matchPercentage.available).toBe(false)
  })

  it('marks providers available only when an offer exists', () => {
    expect(classifyFilmFileContent({ providers: { flatrate: [{ id: 8 }] } }).providers.available).toBe(true)
    expect(classifyFilmFileContent({ providers: { flatrate: [], rent: [], buy: [] } }).providers.available).toBe(false)
    expect(classifyFilmFileContent({ providers: null }).providers.available).toBe(false)
  })

  it('marks social + rating surfaces available from their own inputs', () => {
    expect(classifyFilmFileContent({ friends: [{ id: 1 }] }).friendsLoved.available).toBe(true)
    expect(classifyFilmFileContent({ friends: [] }).friendsLoved.available).toBe(false)
    expect(classifyFilmFileContent({ twin: { name: 'A' } }).tasteTwinReview.available).toBe(true)
    expect(classifyFilmFileContent({ twin: null }).tasteTwinReview.available).toBe(false)
    expect(classifyFilmFileContent({ userRating: { rating: 8 } }).yourTake.available).toBe(true)
    expect(classifyFilmFileContent({ userRating: null }).yourTake.available).toBe(false)
  })

  it('does not mutate its inputs', () => {
    const overlay = { ff_take: { body: 'x' }, critic_quotes: [{ quote: 'y' }] }
    const filmRow = { llm_intensity: 50, mood_tags: ['tense'] }
    const providers = { flatrate: [{ id: 8 }] }
    const snap = JSON.stringify({ overlay, filmRow, providers })
    classifyFilmFileContent({ overlay, filmRow, providers, matchPct: 80 })
    expect(JSON.stringify({ overlay, filmRow, providers })).toBe(snap)
  })

  // F5.2 §2 — useMovieData exposes state.contentSources via classifyFilmFileContent({
  // overlay, filmRow, matchPct: mv.ffMatch, providers: prov }). This proves the
  // assembled classification agrees with a representative loaded-film fixture.
  it('agrees with the useMovieData wiring shape for a representative loaded film', () => {
    const contentSources = classifyFilmFileContent({
      overlay: {
        ff_take: { body: 'A class war told as a home invasion.' },
        critic_quotes: [{ quote: 'Tense from frame one.' }],
        daypart_fit: 'Best watched · evening',
      },
      filmRow: { llm_intensity: 80, llm_pacing: 60, mood_tags: ['tense', 'dark'], fit_profile: 'prestige_drama' },
      matchPct: 84,
      providers: { flatrate: [{ id: 8, name: 'Mock Stream' }], rent: [], buy: [] },
    })
    // generated overlay surfaces present + correctly classified
    expect(contentSources.ffTake).toMatchObject({ origin: 'generated', presentation: 'direct', available: true })
    expect(contentSources.viewerNotes).toMatchObject({ origin: 'generated', available: true })
    expect(contentSources.daypartFit).toMatchObject({ origin: 'generated', available: true })
    expect(contentSources.moodRadar).toMatchObject({ origin: 'generated', presentation: 'derived', available: true })
    // derived-from-real + real surfaces
    expect(contentSources.matchPercentage).toMatchObject({ origin: 'real', presentation: 'derived', available: true })
    expect(contentSources.providers).toMatchObject({ origin: 'real', available: true })
    expect(contentSources.whyForYou).toMatchObject({ origin: 'real', presentation: 'derived', available: true })
    // surfaces this data layer doesn't fetch resolve in their own hooks → unavailable here
    expect(contentSources.friendsLoved.available).toBe(false)
    expect(contentSources.tasteTwinReview.available).toBe(false)
    expect(contentSources.yourTake.available).toBe(false)
  })
})
