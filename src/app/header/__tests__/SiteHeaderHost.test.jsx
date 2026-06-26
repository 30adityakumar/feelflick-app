import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Isolate the host controller: stub the shared Header (just a search launcher) and
// SearchBar (a dialog driven by the open prop) so we verify the host's search state,
// keyboard shortcuts, and single-SearchBar guarantee — not their internals.
vi.mock('@/app/header/Header', () => ({
  default: ({ onOpenSearch, tone }) => (
    <header data-tone={tone}>
      <button type="button" onClick={onOpenSearch}>open-search</button>
    </header>
  ),
}))
vi.mock('@/app/header/components/SearchBar', () => ({
  default: ({ open, onClose }) =>
    open ? (
      <div role="dialog" aria-label="Search">
        <button type="button" onClick={onClose}>close-search</button>
      </div>
    ) : null,
}))

import SiteHeaderHost from '../SiteHeaderHost'

afterEach(() => cleanup())

const renderHost = (extra = null, props = {}) =>
  render(<MemoryRouter><>{extra}<SiteHeaderHost {...props} /></></MemoryRouter>)

describe('SiteHeaderHost — tone variant forwarding', () => {
  it('defaults to the "default" tone', () => {
    renderHost()
    expect(document.querySelector('header')).toHaveAttribute('data-tone', 'default')
  })

  it('forwards tone="quiet" to the shared Header', () => {
    renderHost(null, { tone: 'quiet' })
    expect(document.querySelector('header')).toHaveAttribute('data-tone', 'quiet')
  })
})

describe('SiteHeaderHost — shared search host', () => {
  it('opens the SearchBar when the launcher is clicked', () => {
    renderHost()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'open-search' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('"/" opens search and Escape closes it', () => {
    renderHost()
    fireEvent.keyDown(window, { key: '/' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('"/" does not open search while typing in a field', () => {
    renderHost(<input data-testid="field" />)
    const input = screen.getByTestId('field')
    input.focus()
    fireEvent.keyDown(input, { key: '/' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders exactly one SearchBar instance', () => {
    renderHost()
    fireEvent.click(screen.getByRole('button', { name: 'open-search' }))
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })

  it('removes its keydown listener on unmount (no leaked global shortcut)', () => {
    const { unmount } = renderHost()
    unmount()
    fireEvent.keyDown(window, { key: '/' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
