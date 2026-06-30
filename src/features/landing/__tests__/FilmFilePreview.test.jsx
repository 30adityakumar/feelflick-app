import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'

import FilmFilePreview from '../components/FilmFilePreview'

afterEach(() => cleanup())

// Both tab panels must exist with stable IDs so every tab's aria-controls
// resolves; the inactive panel is `hidden` (removed from focus order + a11y tree).
describe('FilmFilePreview tab relationships', () => {
  it('renders both panels with stable ids and resolvable aria-controls; inactive is hidden', () => {
    const { container } = render(<FilmFilePreview />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)

    // Every tab's aria-controls points at an element that exists in the DOM.
    for (const tab of tabs) {
      const id = tab.getAttribute('aria-controls')
      expect(id).toBeTruthy()
      expect(container.querySelector(`#${id}`)).not.toBeNull()
    }

    // Exactly one panel is visible; the other is hidden (not just display:none).
    const before = container.querySelector('#ff-l-filmfile-panel-before')
    const after = container.querySelector('#ff-l-filmfile-panel-after')
    expect(before).not.toBeNull()
    expect(after).not.toBeNull()
    expect(before.hidden).toBe(false)
    expect(after.hidden).toBe(true)

    // Each panel is labelled by its tab.
    expect(before.getAttribute('aria-labelledby')).toBe('ff-l-filmfile-tab-before')
    expect(after.getAttribute('aria-labelledby')).toBe('ff-l-filmfile-tab-after')
  })

  it('toggles the hidden panel when the other tab is activated', () => {
    const { container } = render(<FilmFilePreview />)
    fireEvent.click(screen.getByRole('tab', { name: /after watching/i }))
    expect(container.querySelector('#ff-l-filmfile-panel-before').hidden).toBe(true)
    expect(container.querySelector('#ff-l-filmfile-panel-after').hidden).toBe(false)
    // The after-state qualification note is now present and truthful.
    expect(screen.getByText(/curated Film Portrait/i)).toBeInTheDocument()
  })
})

describe('FilmFilePreview content + semantics', () => {
  const BEFORE_ROWS = [
    ['Why this film', /Personal reasons grounded in your taste/i],
    ['Experience profile', /Pace, attention, emotional weight/i],
    ['Where to watch', /Regional availability via supported providers/i],
    ['Cast and context', /Useful people and background, kept spoiler-safe/i],
  ]
  const AFTER_ROWS = [
    ['Your private response', /Rating, reaction and a private note/i],
    ['Followed voices', /Watched-gated notes from people you follow/i],
    ['Generated impressions', /Clearly labelled context—not fabricated reviews/i],
    ['Deeper portrait', /Curated interpretation where genuinely available/i],
  ]

  it('keeps the section id, heading, lede, illustrative label, Parasite identity, and poster alt', () => {
    const { container } = render(<FilmFilePreview />)
    expect(container.querySelector('section#film-file')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Decide before. Reflect after.')
    expect(screen.getByText(/the same page opens your private reflection and deeper context/i)).toBeInTheDocument()
    expect(screen.getByText('Illustrative Film File')).toBeInTheDocument()
    // The visible (before) panel shows Parasite as an h3 and a meaningful poster alt.
    expect(screen.getByRole('heading', { level: 3, name: 'Parasite' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Parasite poster' })).toBeInTheDocument()
  })

  it('shows the before-watching state by default with status, summary, and four detail rows (dl/dt/dd)', () => {
    const { container } = render(<FilmFilePreview />)
    const before = container.querySelector('#ff-l-filmfile-panel-before')
    expect(within(before).getByText('Before watching · spoiler-safe')).toBeInTheDocument()
    expect(within(before).getByText(/A practical decision file/i)).toBeInTheDocument()
    expect(before.querySelector('dl')).not.toBeNull()
    expect(before.querySelectorAll('dl > div')).toHaveLength(4)
    for (const [label, value] of BEFORE_ROWS) {
      const dt = within(before).getByText(label)
      expect(dt.tagName.toLowerCase()).toBe('dt')
      expect(within(before).getByText(value).tagName.toLowerCase()).toBe('dd')
    }
  })

  it('reveals the after-watching state on tab activation with status, four rows, and the honest portrait note', () => {
    const { container } = render(<FilmFilePreview />)
    fireEvent.click(screen.getByRole('tab', { name: /after watching/i }))
    const after = container.querySelector('#ff-l-filmfile-panel-after')
    expect(after.hidden).toBe(false)
    expect(within(after).getByText('Watched · reflection open')).toBeInTheDocument()
    expect(within(after).getByText(/reveals deeper post-watch context/i)).toBeInTheDocument()
    expect(after.querySelectorAll('dl > div')).toHaveLength(4)
    for (const [label, value] of AFTER_ROWS) {
      expect(within(after).getByText(label).tagName.toLowerCase()).toBe('dt')
      expect(within(after).getByText(value).tagName.toLowerCase()).toBe('dd')
    }
    expect(within(after).getByText(/Other titles may offer a lighter reflection state rather than fabricated depth/i)).toBeInTheDocument()
  })

  it('is an honest, non-interactive specimen: no links, no non-tab buttons, no match %, no star rating', () => {
    const { container } = render(<FilmFilePreview />)
    expect(container.querySelectorAll('a')).toHaveLength(0)
    expect(container.querySelectorAll('button:not([role="tab"])')).toHaveLength(0)
    expect(screen.queryByText(/continue with google/i)).toBeNull()
    expect(container.textContent).not.toMatch(/\d+\s*%/)
    expect(container.textContent).not.toMatch(/★|⭐|\d(\.\d)?\s*\/\s*5/)
  })
})
