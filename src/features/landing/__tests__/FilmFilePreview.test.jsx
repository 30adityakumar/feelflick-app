import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

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
