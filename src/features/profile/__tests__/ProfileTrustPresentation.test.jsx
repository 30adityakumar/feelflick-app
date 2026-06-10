import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('html-to-image', () => ({ toPng: vi.fn(() => Promise.resolve('data:image/png;base64,x')) }))
vi.mock('@/shared/components/FollowButton', () => ({ default: () => null }))

import { ProfileDataProvider } from '../useProfileData'
import { Masthead } from '../sections-top'
import { PatternPanel, ShareCard } from '../sections-bottom'

const renderWith = (Comp, value) => render(
  <MemoryRouter>
    <ProfileDataProvider value={{ isSelf: true, viewingUserId: 'u1', ...value }}><Comp /></ProfileDataProvider>
  </MemoryRouter>
)

const GEN = 'A precise, witty machine-written identity sentence.'
const SIG = 'A generated signature line.'

describe('Masthead — F7.4 provenance + maturity gating', () => {
  it('FORMING: no generated summary/signature, no provenance label, honest forming copy + evidence', () => {
    renderWith(Masthead, {
      user: { name: 'Ada Lovelace', handle: '@ada', joined: 'May 2026', filmsLogged: 3, hoursWatched: 5 },
      stats: { filmsLogged: 3, filmsRated: 0 },
      editorialStatus: 'forming',
      editorial: { summary: GEN, signature: SIG, archetype: ['X', 'Y', 'Z'] },
    })
    expect(screen.queryByText(new RegExp(GEN))).not.toBeInTheDocument()       // generated prose suppressed
    expect(screen.queryByText(new RegExp(SIG))).not.toBeInTheDocument()       // generated signature suppressed
    expect(screen.queryByText(/FeelFlick reflection/i)).not.toBeInTheDocument()
    expect(screen.getByText(/still forming/i)).toBeInTheDocument()
    expect(screen.getByText('Based on 3 watched films')).toBeInTheDocument()
  })

  it('ESTABLISHED: generated summary + signature render WITH a visible FeelFlick-reflection label; archetype marked derived', () => {
    renderWith(Masthead, {
      user: { name: 'Ada Lovelace', handle: '@ada', joined: 'May 2026', filmsLogged: 30, hoursWatched: 60 },
      stats: { filmsLogged: 30, filmsRated: 12 },
      editorialStatus: 'current',
      editorial: { summary: GEN, signature: SIG, archetype: ['The Watcher', 'The Quiet', 'The Patient'] },
    })
    expect(screen.getByText(new RegExp(GEN))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(SIG))).toBeInTheDocument()
    expect(screen.getAllByText(/FeelFlick reflection/i).length).toBeGreaterThan(0)  // provenance on summary + signature
    expect(screen.getByText(/generated interpretation of your film activity, not a measured fact/i)).toBeInTheDocument()
    expect(screen.getByText(/Derived from your film signals/i)).toBeInTheDocument()  // archetype = derived, not generated
    expect(screen.getByText('Based on 30 watched films and 12 ratings')).toBeInTheDocument()
  })
})

describe('PatternPanel — F7.4 small-sample percentage guard', () => {
  const data = {
    decades: [{ d: '2020s', pct: 75 }, { d: '2010s', pct: 25 }],
    runtime: { median: 110, band: 'standard', share: 0.6, shortest: { title: 'A', value: 80 }, longest: { title: 'B', value: 140 } },
    daypart: [{ label: 'Late', pct: 80 }, { label: 'Evening', pct: 20 }],
  }
  it('FORMING (< 5 watched): exact percentages are suppressed; labels remain', () => {
    renderWith(PatternPanel, { ...data, stats: { filmsLogged: 3, filmsRated: 0 } })
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument()
    expect(screen.getByText('2020s')).toBeInTheDocument()              // label kept (qualitative)
    expect(screen.getByText('Late')).toBeInTheDocument()
  })
  it('established sample (≥ 5 watched): exact percentages render', () => {
    renderWith(PatternPanel, { ...data, stats: { filmsLogged: 20, filmsRated: 8 } })
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
  })
})

describe('ShareCard — F7.4 trust alignment', () => {
  it('FORMING: does not export a generated identity; no reflection label; no percentage', () => {
    renderWith(ShareCard, {
      user: { name: 'Ada Lovelace', filmsLogged: 3, hoursWatched: 5 },
      stats: { filmsLogged: 3, filmsRated: 0 },
      editorialStatus: 'forming',
      editorial: { signature: SIG, archetype: ['X', 'Y', 'Z'] },
    })
    expect(screen.queryByText(new RegExp(SIG))).not.toBeInTheDocument()
    expect(screen.queryByText(/FeelFlick reflection/i)).not.toBeInTheDocument()
    expect(screen.getByText(/A portrait of your film taste/i)).toBeInTheDocument() // neutral structured fallback
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument()
  })
  it('ESTABLISHED: exports the generated signature WITH a reflection label, no confidence %', () => {
    renderWith(ShareCard, {
      user: { name: 'Ada Lovelace', filmsLogged: 30, hoursWatched: 60 },
      stats: { filmsLogged: 30, filmsRated: 12 },
      editorialStatus: 'current',
      editorial: { signature: SIG, archetype: ['The Watcher', 'The Quiet', 'The Patient'] },
    })
    expect(screen.getByText(new RegExp(SIG))).toBeInTheDocument()
    expect(screen.getByText(/FeelFlick reflection/i)).toBeInTheDocument()
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument()         // no confidence percentage on the card
  })
})
