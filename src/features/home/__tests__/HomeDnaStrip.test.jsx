import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import HomeDnaStrip from '../components/HomeDnaStrip'

const renderStrip = (dna) => render(<MemoryRouter><HomeDnaStrip dna={dna} /></MemoryRouter>)

describe('HomeDnaStrip', () => {
  it('renders nothing without a dna object', () => {
    const { container } = renderStrip(null)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the honest forming state and no chips when there is no real signal', () => {
    renderStrip({ motifs: ['Patterns forming…'], topMoods: null, topFit: null, filmsToNext: 6 })
    expect(screen.getByText('Your taste is still taking shape.')).toBeInTheDocument()
    expect(screen.queryByText(/emerging$/)).not.toBeInTheDocument()
  })

  it('shows real motif/mood chips, an emerging signal, and an Open DNA link', () => {
    renderStrip({
      motifs: ['Earnest', 'Warm'],
      topMoods: [{ label: 'Tender', weight: 0.4 }],
      topFit: 'prestige_drama',
      filmsToNext: 0,
    })
    expect(screen.getByText('Your taste keeps sharpening.')).toBeInTheDocument()
    expect(screen.getByText('Earnest')).toBeInTheDocument()
    expect(screen.getByText('Tender')).toBeInTheDocument()
    expect(screen.getByText('Prestige drama emerging')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open DNA' })).toHaveAttribute('href', '/profile')
  })

  it('never fabricates motifs from the cold-start placeholder', () => {
    renderStrip({ motifs: ['Patterns forming…'], topMoods: null, topFit: null, filmsToNext: 9 })
    expect(screen.queryByText('Patterns forming…')).not.toBeInTheDocument()
  })
})
