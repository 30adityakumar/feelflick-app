import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import HomeDnaStrip from '../components/HomeDnaStrip'

const renderStrip = (dna) => render(<MemoryRouter><HomeDnaStrip dna={dna} /></MemoryRouter>)

const established = { key: 'established', line: 'Your taste keeps sharpening.' }

describe('HomeDnaStrip', () => {
  it('renders nothing without a dna object', () => {
    const { container } = renderStrip(null)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the honest forming state and no chips when there is no real signal', () => {
    renderStrip({ motifs: ['Patterns forming…'], topMoods: null, topFit: null, filmsToNext: 6 })
    expect(screen.getByText('Your taste is still taking shape.')).toBeInTheDocument()
    expect(screen.queryByText(/still forming/)).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('shows real chips as a labelled list, an emerging lean, and a descriptive DNA link', () => {
    const { container } = renderStrip({
      motifs: ['Earnest', 'Warm'],
      topMoods: [{ label: 'Tender', weight: 0.4 }],
      topFit: 'prestige_drama',
      filmsToNext: 0,
      maturity: established,
    })
    expect(screen.getByText('Your taste keeps sharpening.')).toBeInTheDocument()
    // Chips are a real, named list (not bare spans).
    expect(screen.getByRole('list', { name: 'Recurring taste signals' })).toBeInTheDocument()
    expect(screen.getByText('Earnest')).toBeInTheDocument()
    expect(screen.getByText('Tender')).toBeInTheDocument()
    // Emerging lean carries a legible, non-color provenance cue.
    expect(container.textContent).toContain('Prestige drama')
    expect(screen.getByText(/still forming/)).toBeInTheDocument()
    // The door names its destination.
    expect(screen.getByRole('link', { name: 'Open your Cinematic DNA' })).toHaveAttribute('href', '/profile')
  })

  it('headline is depth-aware: an onboarding-only profile never claims "keeps sharpening"', () => {
    renderStrip({
      motifs: ['Earnest', 'Warm'],
      topMoods: [{ label: 'Tender', weight: 0.4 }],
      topFit: null,
      filmsToNext: 5,
      maturity: { key: 'seeded', line: 'Your taste is taking shape from your first picks.' },
    })
    expect(screen.getByText('Your taste is taking shape from your first picks.')).toBeInTheDocument()
    expect(screen.queryByText('Your taste keeps sharpening.')).not.toBeInTheDocument()
  })

  it('falls back to a non-overclaiming headline when maturity is unknown but signal exists', () => {
    renderStrip({ motifs: ['Earnest'], topMoods: [], topFit: null, filmsToNext: 0 })
    expect(screen.getByText('Your taste is coming into focus.')).toBeInTheDocument()
    expect(screen.queryByText('Your taste keeps sharpening.')).not.toBeInTheDocument()
  })

  it('omits the emerging chip when there is no clear fit lean', () => {
    renderStrip({ motifs: ['Earnest', 'Warm'], topMoods: [{ label: 'Tender' }], topFit: null, filmsToNext: 0, maturity: established })
    expect(screen.queryByText(/still forming/)).not.toBeInTheDocument()
  })

  it('never fabricates motifs from the cold-start placeholder', () => {
    renderStrip({ motifs: ['Patterns forming…'], topMoods: null, topFit: null, filmsToNext: 9 })
    expect(screen.queryByText('Patterns forming…')).not.toBeInTheDocument()
  })
})
