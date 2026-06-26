import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Isolate the host controller: stub the shared Header (just a search launcher) and
// SearchBar (a dialog driven by the open prop) so we verify the host's search state,
// keyboard shortcuts, and single-SearchBar guarantee — not their internals.
vi.mock('@/app/header/Header', () => ({
  default: ({ onOpenSearch }) => (
    <header>
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

const renderHost = (extra = null) =>
  render(<MemoryRouter><>{extra}<SiteHeaderHost /></></MemoryRouter>)

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

  it('Cmd+K and Ctrl+K open search (matches the displayed shortcut hint)', () => {
    renderHost()
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
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
