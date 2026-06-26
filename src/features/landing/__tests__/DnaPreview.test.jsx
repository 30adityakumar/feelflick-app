import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import DnaPreview from '../components/DnaPreview'
import { DNA_EXAMPLE } from '../data'

afterEach(() => cleanup())

const TRAITS = [
  ['Emotional patience', 'Strong', /let feeling accumulate rather than announce itself/i],
  ['Tonal contrast', 'Growing', /warmth, humour and unease occupy the same story/i],
  ['Visual precision', 'Strong', /Deliberate composition and controlled detail/i],
  ['Heavy aftertaste', 'Contextual', /lingering emotional weight when the moment is right/i],
]
const SOURCES = ['Watches', 'Ratings and reactions', 'Saves and skips', 'Direct preferences']

describe('DNA_EXAMPLE data', () => {
  it('uses verbal bands + descriptions, with no numeric level', () => {
    expect(DNA_EXAMPLE.traits).toHaveLength(4)
    expect(DNA_EXAMPLE.traits.map((t) => t.label)).toEqual(TRAITS.map((t) => t[0]))
    for (const t of DNA_EXAMPLE.traits) {
      expect('level' in t).toBe(false)
      expect(t.band.trim().length).toBeGreaterThan(0)
      expect(t.description.trim().length).toBeGreaterThan(0)
    }
    expect(DNA_EXAMPLE.sources).toEqual(SOURCES)
  })
})

describe('DnaPreview', () => {
  it('keeps section id, heading, lede, illustrative label, archetype + statement', () => {
    const { container } = render(<DnaPreview />)
    expect(container.querySelector('section#cinematic-dna')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Your taste, written in human language.')
    expect(screen.getByText(/An evolving portrait of what moves you/i)).toBeInTheDocument()
    expect(screen.getByText('Illustrative Cinematic DNA')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'The Thinking Heart.' })).toBeInTheDocument()
    expect(screen.getByText(/Tenderness through ambiguity/i)).toBeInTheDocument()
  })

  it('shows "How strongly you respond" with four verbal traits (band + explanation), in order', () => {
    const { container } = render(<DnaPreview />)
    expect(screen.getByRole('heading', { level: 4, name: /how strongly you respond/i })).toBeInTheDocument()
    const list = container.querySelector('.ff-l-dna-traits')
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(4)
    TRAITS.forEach(([label, band, desc], i) => {
      expect(within(items[i]).getByText(label)).toBeInTheDocument()
      expect(within(items[i]).getByText(band)).toBeInTheDocument()
      expect(within(items[i]).getByText(desc)).toBeInTheDocument()
    })
  })

  it('shows "What shapes this portrait" with the four source categories as plain list items', () => {
    const { container } = render(<DnaPreview />)
    expect(screen.getByRole('heading', { level: 4, name: /what shapes this portrait/i })).toBeInTheDocument()
    const list = container.querySelector('.ff-l-dna-sources')
    const items = within(list).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual(SOURCES)
  })

  it('shows the living-portrait disclosure and a logical heading order (one h2, one h3, two h4)', () => {
    render(<DnaPreview />)
    expect(screen.getByText('A living portrait, not a permanent label.')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(2)
  })

  it('implies no precision: no percentage, digit, meter, progressbar, aria-valuenow, segment, link, or button', () => {
    const { container } = render(<DnaPreview />)
    expect(container.textContent).not.toMatch(/\d/) // no numbers anywhere (no level/score/%)
    expect(container.querySelector('meter, [role="meter"], [role="progressbar"], [aria-valuenow]')).toBeNull()
    expect(container.querySelector('.ff-l-dna-trait__segments')).toBeNull()
    expect(container.querySelectorAll('.ff-l-dna-traits i')).toHaveLength(0)
    expect(container.querySelectorAll('a, button, [role="button"]')).toHaveLength(0)
  })
})
