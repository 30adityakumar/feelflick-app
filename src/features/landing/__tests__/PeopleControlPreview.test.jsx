import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import PeopleControlPreview from '../components/PeopleControlPreview'

afterEach(() => cleanup())

const VOICES = [
  ['A followed voice', /tenderness, restraint and emotional ambiguity/i, 'Past Lives', 'The restraint is what made it stay.'],
  ['Another followed voice', /tonal risk, social tension and Korean cinema/i, 'Parasite', 'Every turn sharpened what came before it.'],
]
const PREFS = [
  ['Mood emphasis', 'Editable', /Adjust how strongly the present mood should shape a choice/i],
  ['Preferred and avoided genres', 'Editable', /Set broad genre preferences without permanently excluding discovery/i],
  ['Runtime and content boundaries', 'Editable', /Keep recommendations within practical time and content limits/i],
  ['Directors', 'Editable', /Trust or down-rank filmmakers directly/i],
  ['Recommendation influences', 'Inspectable', /watches, ratings, reactions, saves and skips shaping suggestions/i],
]

describe('PeopleControlPreview — section', () => {
  it('keeps section id, eyebrow, new heading, supporting copy, one illustrative label, two halves', () => {
    const { container } = render(<PeopleControlPreview />)
    expect(container.querySelector('section#people-control')).not.toBeNull()
    expect(screen.getByText('People and control')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('The voices you trust. The choices you keep.')
    expect(screen.getByText(/your taste portrait, library and direct preferences remain private and yours to inspect/i)).toBeInTheDocument()
    // Exactly one illustrative label for the whole specimen.
    expect(screen.getAllByText('Illustrative people and preferences')).toHaveLength(1)

    const halves = container.querySelectorAll('.ff-l-control-half')
    expect(halves).toHaveLength(2)
    halves.forEach((h) => expect(h.tagName).toBe('ARTICLE'))
    expect(halves[0].querySelector('h3')).toHaveTextContent('The voices you trust')
    expect(halves[1].querySelector('h3')).toHaveTextContent('Control stays with you')
  })
})

describe('PeopleControlPreview — followed voices', () => {
  it('shows exactly two anonymous voice records (label, context, film, note) — no names, avatars, links or counts', () => {
    const { container } = render(<PeopleControlPreview />)
    const voices = container.querySelectorAll('.ff-l-voice')
    expect(voices).toHaveLength(2)
    VOICES.forEach(([label, context, film, note], i) => {
      const v = voices[i]
      expect(within(v).getByText(label)).toBeInTheDocument()
      expect(within(v).getByText(context)).toBeInTheDocument()
      expect(within(v).getByText(film)).toBeInTheDocument()
      expect(within(v).getByText(note)).toBeInTheDocument()
    })
    // No avatar glyphs / images, no profile links or Follow buttons.
    expect(container.querySelector('.ff-l-voice__glyph')).toBeNull()
    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(container.querySelectorAll('a, button')).toHaveLength(0)
    // No engagement counts in the voices area.
    const left = container.querySelectorAll('.ff-l-control-half')[0]
    expect(left.textContent).not.toMatch(/\d+\s*(likes?|comments?|followers?)/i)
  })
})

describe('PeopleControlPreview — control preferences', () => {
  it('renders a valid dl of five preference records (4 Editable, 1 Inspectable) + coming-later disclosure', () => {
    const { container } = render(<PeopleControlPreview />)
    const dl = container.querySelector('.ff-l-pref-list')
    expect(dl.tagName).toBe('DL')
    const rows = dl.querySelectorAll(':scope > div')
    expect(rows).toHaveLength(5)
    PREFS.forEach(([label, status, desc], i) => {
      const dt = rows[i].querySelector('dt')
      const dd = rows[i].querySelector('dd')
      expect(dt).not.toBeNull()
      expect(dd).not.toBeNull()
      expect(within(dt).getByText(label)).toBeInTheDocument()
      expect(within(dt).getByText(status)).toBeInTheDocument()
      expect(within(dd).getByText(desc)).toBeInTheDocument()
    })
    expect(within(dl).getAllByText('Editable')).toHaveLength(4)
    expect(within(dl).getAllByText('Inspectable')).toHaveLength(1)
    expect(screen.getByText('Streaming-service preferences are planned, but are not available yet.')).toBeInTheDocument()
  })
})

describe('PeopleControlPreview — integrity & a11y', () => {
  it('has no fake controls, no percentages, no hidden interactive state, and a clean heading order', () => {
    const { container } = render(<PeopleControlPreview />)
    expect(container.textContent).not.toMatch(/\d+\s*%/)
    expect(container.querySelectorAll('button, input, select, textarea, [role="switch"], [role="checkbox"], [aria-checked]')).toHaveLength(0)
    // Nothing focusable inside the illustrative specimen.
    const specimen = container.querySelector('.ff-l-control-specimen')
    expect(specimen.querySelectorAll('a, button, input, select, textarea, [tabindex], [contenteditable]')).toHaveLength(0)
    // Heading hierarchy: one h2, two h3, no skipped levels.
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2)
  })
})
