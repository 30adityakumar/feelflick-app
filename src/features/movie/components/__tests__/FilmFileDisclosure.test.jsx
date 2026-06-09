import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import FilmFileDisclosure from '../FilmFileDisclosure'

// F5.5 — the accessible native-details disclosure primitive.

describe('FilmFileDisclosure', () => {
  it('21. uses native <details>/<summary> (no custom button role)', () => {
    const { container } = render(<FilmFileDisclosure heading="Why this film"><p>evidence</p></FilmFileDisclosure>)
    const details = container.querySelector('details')
    const summary = container.querySelector('summary')
    expect(details).toBeTruthy()
    expect(summary).toBeTruthy()
    expect(summary.getAttribute('role')).toBeNull()         // no custom button role
    expect(summary.getAttribute('aria-expanded')).toBeNull() // native semantics only
  })

  it('22/23. the summary is the heading-equivalent label + carries the 44px/focus class', () => {
    render(<FilmFileDisclosure heading="Why this film">x</FilmFileDisclosure>)
    const summary = screen.getByText('Why this film').closest('summary')
    expect(summary).toHaveClass('ff-disclosure__summary')
  })

  it('24. collapsed by default', () => {
    const { container } = render(<FilmFileDisclosure heading="H">x</FilmFileDisclosure>)
    expect(container.querySelector('details').open).toBe(false)
  })

  it('25. defaultOpen renders open', () => {
    const { container } = render(<FilmFileDisclosure heading="H" defaultOpen>x</FilmFileDisclosure>)
    expect(container.querySelector('details').open).toBe(true)
  })

  it('26. children are present in the document (even when collapsed)', () => {
    render(<FilmFileDisclosure heading="H"><p data-testid="child">deep evidence</p></FilmFileDisclosure>)
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('deep evidence')).toBeInTheDocument()
  })

  it('28. the decorative chevron indicator is aria-hidden', () => {
    const { container } = render(<FilmFileDisclosure heading="H">x</FilmFileDisclosure>)
    const chevron = container.querySelector('.ff-disclosure__chevron')
    expect(chevron).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders eyebrow + copy + heading when provided', () => {
    render(<FilmFileDisclosure eyebrow="Go deeper" heading="Why this film" copy="See the signals.">x</FilmFileDisclosure>)
    expect(screen.getByText('Go deeper')).toBeInTheDocument()
    expect(screen.getByText('Why this film')).toBeInTheDocument()
    expect(screen.getByText('See the signals.')).toBeInTheDocument()
  })

  it('30. content is in normal document order with no measured-height/animation dependency', () => {
    // children are direct DOM content under the details — no portal, no JS height.
    const { container } = render(<FilmFileDisclosure heading="H"><p>c</p></FilmFileDisclosure>)
    const content = container.querySelector('.ff-disclosure__content')
    expect(content.textContent).toBe('c')
    expect(content.querySelector('p')).toBeTruthy()
  })

  it('applies className + id to the section wrapper', () => {
    const { container } = render(<FilmFileDisclosure id="film-details" className="ff-x" heading="H">x</FilmFileDisclosure>)
    const section = container.querySelector('section')
    expect(section.id).toBe('film-details')
    expect(section).toHaveClass('ff-x')
  })
})
