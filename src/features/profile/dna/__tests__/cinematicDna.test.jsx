import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { resolveDnaIdentity } from '../identity'
import { deriveRatingLanguage } from '../../derive/ratingLanguage'
import { deriveTasteJourney } from '../../derive/tasteJourney'
import CinematicPassport from '../CinematicPassport'
import CinematicDnaHero from '../CinematicDnaHero'
import DnaFormingState from '../DnaFormingState'
import RatingLanguage from '../RatingLanguage'
import TasteJourney from '../TasteJourney'
import DirectorInfluence from '../DirectorInfluence'
import DnaEvidenceSheet from '../DnaEvidenceSheet'

// ── Fixtures ───────────────────────────────────────────────────────────────
const film = (iso, ...moods) => ({ watched_at: iso, movies: { mood_tags: moods } })
const SENSITIVE_EMAIL = 'ada@example.com'
const SENSITIVE_UUID = 'a6da9f6f-5aac-82f1-9918-74172dd0b862'

function establishedData(overrides = {}) {
  const ratings = [...Array(10).fill({ rating: 8 }), ...Array(8).fill({ rating: 10 }), ...Array(6).fill({ rating: 6 }), { rating: 4 }, { rating: 9 }]
  const history = []
  for (let i = 0; i < 30; i++) history.push(film(`${2023 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}-12T10:00:00Z`, i < 15 ? 'tender' : 'tense', 'cinematic'))
  return {
    user: { id: SENSITIVE_UUID, name: 'Ada Lovelace', email: SENSITIVE_EMAIL },
    stats: { filmsLogged: 41, filmsRated: 26, hoursWatched: 88, filmsThisMonth: 3, dnaConfidence: 78 },
    editorial: { summary: 'Tenderness pursued through tension and quiet aftermath.', signature: 'Soft heart, steady nerve.', archetype: ['The Tender', 'The Auteurist', 'The Patient'], generatedAt: new Date().toISOString() },
    editorialStatus: 'current',
    moods: [{ name: 'Tender', weight: 0.8 }, { name: 'Tense', weight: 0.6 }, { name: 'Reflective', weight: 0.4 }, { name: 'Warm', weight: 0.3 }, { name: 'Dark', weight: 0.2 }],
    directors: [{ name: 'Agnès Varda', films: 6, avg: 4.5, firstWatchedYear: 2023, accent: '#eda8cc' }, { name: 'Wong Kar-wai', films: 4, avg: 4.0, firstWatchedYear: 2024, accent: '#91d2ee' }],
    mixtape: [{ tmdbId: 1, title: 'Cléo', year: 1962, rating: 5, poster: 'https://image.tmdb.org/t/p/w500/a.jpg' }],
    ratingLanguage: deriveRatingLanguage({ ratings }),
    journey: deriveTasteJourney({ history }),
    evidenceVersion: 2,
    ...overrides,
  }
}

beforeEach(() => { vi.restoreAllMocks() })

// ── Identity resolver: honest states ─────────────────────────────────────────
describe('resolveDnaIdentity — honest states', () => {
  it('established: deterministic archetype title, current reflection line, no exact confidence %', () => {
    const id = resolveDnaIdentity(establishedData())
    expect(id.established).toBe(true)
    expect(id.title.lead).toBe('The Tender')
    expect(id.line).toMatch(/Tenderness pursued/)
    expect(id.provenance).toMatch(/verified taste patterns/)
    expect(id.updated).toBe('Updated today')
    // facts are structured pills carrying counts + evidence-maturity label, NEVER a raw % or
    // the unqualified band label beside the archetype.
    const factText = id.facts.map((f) => f.text).join(' ')
    expect(factText).toMatch(/41 watched/)
    expect(factText).not.toMatch(/78%|78 %|confidence/i)
    expect(factText).not.toMatch(/\bStill forming\b|\bWell established\b|\bTaking shape\b/) // unqualified band labels never shown
    expect(id.tags.length).toBeLessThanOrEqual(4)
  })

  it('evidence-maturity label is QUALIFIED (established identity + low band → "Evidence still growing"), formulas untouched', () => {
    // established maturity (16 watched ≥15, 6 rated ≥5) but low confidence (23 < 40 → band "Still forming")
    const id = resolveDnaIdentity(establishedData({ stats: { filmsLogged: 16, filmsRated: 6, dnaConfidence: 23 } }))
    expect(id.established).toBe(true)
    expect(id.band.label).toBe('Still forming') // the SHARED formula's band is unchanged
    const band = id.facts.find((f) => f.kind === 'band')
    expect(band.text).toBe('Evidence still growing')            // hero shows the qualified evidence label
    expect(band.aria).toBe('Taste evidence maturity: still growing') // SR identifies the evidence axis
    expect(id.facts.map((f) => f.text).join(' ')).not.toMatch(/^.*\bStill forming\b/) // never the bare phrase
    // well-established + taking-shape map correctly too
    expect(resolveDnaIdentity(establishedData({ stats: { filmsLogged: 41, filmsRated: 26, dnaConfidence: 82 } })).facts.find((f) => f.kind === 'band').text).toBe('Evidence well established')
    expect(resolveDnaIdentity(establishedData({ stats: { filmsLogged: 12, filmsRated: 4, dnaConfidence: 55 } })).facts.find((f) => f.kind === 'band').text).toBe('Evidence taking shape')
  })

  it('forming: no archetype, honest line, no fabricated identity', () => {
    const id = resolveDnaIdentity(establishedData({ stats: { filmsLogged: 2, filmsRated: 1, dnaConfidence: 12 }, editorial: null, editorialStatus: 'none' }))
    expect(id.forming).toBe(true)
    expect(id.title.lead).toBe('Your Cinematic DNA')
    expect(id.line).toMatch(/still forming/i)
    expect(id.provenance).toBeNull()
  })

  it('established but STALE reflection: no fabricated prose, surfaces "needs refreshing"', () => {
    const id = resolveDnaIdentity(establishedData({ editorialStatus: 'stale' }))
    expect(id.reflectionCurrent).toBe(false)
    expect(id.line).not.toMatch(/Tenderness pursued/) // stale prose is NOT presented as current
    expect(id.line).toMatch(/built from the films you actually watch/i)
    expect(id.updated).toBe('Reflection needs refreshing')
  })
})

// ── Passport privacy whitelist ────────────────────────────────────────────────
describe('CinematicPassport — privacy whitelist', () => {
  it('renders only whitelisted DNA; never leaks email, UUID, or exact counts', () => {
    const data = establishedData()
    const id = resolveDnaIdentity(data)
    const { container } = render(<CinematicPassport identity={id} evidenceVersion={2} />)
    const text = container.textContent
    expect(text).toMatch(/Cinematic DNA/)
    expect(text).toContain('The Tender')
    expect(text).not.toContain(SENSITIVE_EMAIL)
    expect(text).not.toContain(SENSITIVE_UUID)
    expect(text).not.toMatch(/\b41\b|\b26\b/) // exact watched/rated counts never on the passport face
    expect(text).not.toMatch(/watched_at|user_history|@example/)
  })
})

// ── Hero ──────────────────────────────────────────────────────────────────────
describe('CinematicDnaHero', () => {
  const id = resolveDnaIdentity(establishedData())
  const renderHero = () => render(
    <CinematicDnaHero identity={id} mixtape={establishedData().mixtape} evidenceVersion={2} onEvidence={() => {}} onScrollTo={() => {}} />,
  )
  it('owns exactly one h1 carrying the archetype identity', () => {
    renderHero()
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent('The Tender')
  })
  it('offers the three approved actions and NEVER the "Doesn\'t feel like me" action', () => {
    renderHero()
    expect(screen.getByRole('button', { name: /explore your dna/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /why this read/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /share portrait/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /doesn.?t feel like me/i })).not.toBeInTheDocument()
  })
  it('exposes the responsive DOM hooks the mobile-density CSS relies on (fact kinds, updated pill, band aria)', () => {
    const { container } = renderHero()
    // each fact pill carries its kind class so ≤420px can hide rated + band while keeping watched
    expect(container.querySelector('.ff-dna-fact--watched')).toBeTruthy()
    expect(container.querySelector('.ff-dna-fact--rated')).toBeTruthy()
    const band = container.querySelector('.ff-dna-fact--band')
    expect(band).toBeTruthy()
    expect(band.getAttribute('aria-label')).toMatch(/Taste evidence maturity:/)
    // the optional "Updated…" pill is class-tagged so it can be hidden on the compact hero
    expect(container.querySelector('.ff-dna-pill--updated')).toBeTruthy()
  })
})

describe('DnaFormingState', () => {
  it('is honest: still forming, no archetype, a route to Tonight', () => {
    const id = resolveDnaIdentity(establishedData({ stats: { filmsLogged: 3, filmsRated: 1, dnaConfidence: 10 }, editorial: null, editorialStatus: 'none' }))
    render(<DnaFormingState identity={id} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/still forming/i)
    expect(screen.queryByText('The Tender')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /tonight/i })).toBeInTheDocument()
  })
})

// ── Response (rating language) ────────────────────────────────────────────────
describe('RatingLanguage', () => {
  it('shows the deterministic interpretation when eligible', () => {
    render(<RatingLanguage ratingLanguage={deriveRatingLanguage({ ratings: [...Array(14).fill({ rating: 8 }), ...Array(4).fill({ rating: 10 })] })} />)
    expect(screen.getByText(/how strongly you respond/i)).toBeInTheDocument()
    // 18 ratings, high average WITH a meaningful share of fives → the deterministic "generous" read
    expect(screen.getByRole('heading', { name: /generous with high ratings/i })).toBeInTheDocument()
  })
  it('withholds interpretation below the minimum sample (calibrating)', () => {
    render(<RatingLanguage ratingLanguage={deriveRatingLanguage({ ratings: [{ rating: 8 }, { rating: 10 }, { rating: 6 }] })} />)
    expect(screen.getByText(/still calibrating/i)).toBeInTheDocument()
    expect(screen.queryByText(/warm, but selective|a demanding scale/i)).not.toBeInTheDocument()
  })
  it('renders nothing when there are no ratings', () => {
    const { container } = render(<RatingLanguage ratingLanguage={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})

// ── Journey ───────────────────────────────────────────────────────────────────
describe('TasteJourney', () => {
  it('adapts the headline to the real chapter count', () => {
    const two = deriveTasteJourney({ history: Array.from({ length: 16 }, (_, i) => film(`2024-${String((i % 12) + 1).padStart(2, '0')}-10T10:00:00Z`, i < 8 ? 'tender' : 'tense')) })
    render(<TasteJourney journey={two} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/^Two chapters/)
  })
  it('renders nothing with fewer than two evidenced chapters', () => {
    const { container } = render(<TasteJourney journey={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

// ── Directors ─────────────────────────────────────────────────────────────────
describe('DirectorInfluence', () => {
  it('names "directors", uses factual counts, and shows no 0–100 influence score', () => {
    const { container } = render(<DirectorInfluence directors={establishedData().directors} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/directors you return to/i)
    expect(screen.getAllByText('Agnès Varda').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/6 films/).length).toBeGreaterThanOrEqual(1)
    expect(container.textContent).not.toMatch(/influence score|\b92\b|\/100/)
  })
  it('renders nothing without eligible directors', () => {
    const { container } = render(<DirectorInfluence directors={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

// ── Evidence sheet a11y + governance ──────────────────────────────────────────
describe('DnaEvidenceSheet', () => {
  it('is an accessible dialog separating Measured/Derived/Generated with the LLM disclosure', () => {
    const id = resolveDnaIdentity(establishedData())
    render(<DnaEvidenceSheet open identity={id} editorialStatus="current" refreshStatus="idle" onClose={() => {}} onRefresh={() => {}} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    const u = within(dialog)
    expect(u.getByText('Measured')).toBeInTheDocument()
    expect(u.getByText('Derived')).toBeInTheDocument()
    expect(u.getByText('Generated')).toBeInTheDocument()
    expect(u.getByText(/language model does not calculate your profile/i)).toBeInTheDocument()
  })
  it('hides the refresh action when the reflection is current; offers it when stale', () => {
    const id = resolveDnaIdentity(establishedData())
    const { rerender } = render(<DnaEvidenceSheet open identity={id} editorialStatus="current" refreshStatus="idle" onClose={() => {}} onRefresh={() => {}} />)
    expect(screen.queryByRole('button', { name: /generate reflection|try again/i })).not.toBeInTheDocument()
    const stale = resolveDnaIdentity(establishedData({ editorialStatus: 'stale' }))
    rerender(<DnaEvidenceSheet open identity={stale} editorialStatus="stale" refreshStatus="idle" onClose={() => {}} onRefresh={() => {}} />)
    expect(screen.getByRole('button', { name: /generate reflection/i })).toBeInTheDocument()
  })
  it('closes on Escape', () => {
    const onClose = vi.fn()
    const id = resolveDnaIdentity(establishedData())
    render(<DnaEvidenceSheet open identity={id} editorialStatus="current" refreshStatus="idle" onClose={onClose} onRefresh={() => {}} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
