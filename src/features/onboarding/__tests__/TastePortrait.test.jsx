import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import TastePortrait from '../components/TastePortrait'

const base = { moods: [], genres: [], films: [], ratings: {} }

describe('TastePortrait', () => {
  it('starts from an explicitly provisional state', () => {
    render(<TastePortrait {...base} />)
    expect(screen.getByText(/first signals, not conclusions/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/taste is still quiet/i)
    expect(screen.getByText(/not a fixed type/i)).toBeInTheDocument()
  })

  it('reflects real selected mood labels without scoring the user', () => {
    render(<TastePortrait {...base} moods={['cozy', 'tense']} />)
    expect(screen.getByText('Cozy')).toBeInTheDocument()
    expect(screen.getByText('Tense')).toBeInTheDocument()
    expect(screen.getByText(/you return to cozy and tense films/i)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\d+%|match score|accuracy/i)
  })

  it('maps genre ids to their visible names', () => {
    render(<TastePortrait {...base} genres={[18, 53]} />)
    expect(screen.getByText('Drama')).toBeInTheDocument()
    expect(screen.getByText('Thriller')).toBeInTheDocument()
    expect(screen.getByText(/reach first toward drama and thriller/i)).toBeInTheDocument()
  })

  it('shows chosen films as earned anchors', () => {
    render(
      <TastePortrait
        {...base}
        films={[{ id: 1, title: 'Parasite' }, { id: 2, title: 'Arrival' }]}
      />
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/taste has anchors/i)
    expect(screen.getByText('Parasite')).toBeInTheDocument()
    expect(screen.getByText('Arrival')).toBeInTheDocument()
  })

  it('renders a compact mobile interpretation using the same honest copy', () => {
    render(<TastePortrait {...base} compact moods={['mythic']} />)
    expect(screen.getByText('So far')).toBeInTheDocument()
    expect(screen.getByText(/you return to mythic films/i)).toBeInTheDocument()
  })
})
