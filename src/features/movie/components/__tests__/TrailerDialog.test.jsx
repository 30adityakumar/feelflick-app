import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'

import AccessibleMediaDialog from '../AccessibleMediaDialog'

// F5.4 — the hardened accessible media dialog (replaces the inline TrailerModal).

// A stable opener whose DOM node is preserved across open/close so focus
// restoration is observable.
function Controlled({ youtubeKey = 'abc123', title = 'Parasite · Official Trailer' }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button type="button" id="opener" onClick={() => setOpen(true)}>Open trailer</button>
      <AccessibleMediaDialog open={open} onClose={() => setOpen(false)} youtubeKey={youtubeKey} title={title} />
    </div>
  )
}

beforeEach(() => { cleanup(); document.body.innerHTML = ''; document.body.style.overflow = '' })

describe('AccessibleMediaDialog', () => {
  it('42. is a named modal dialog', () => {
    render(<AccessibleMediaDialog open onClose={() => {}} youtubeKey="k" title="Parasite · Official Trailer" />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    const labelId = dialog.getAttribute('aria-labelledby')
    expect(labelId).toBeTruthy()
    expect(document.getElementById(labelId).textContent).toMatch(/Parasite · Official Trailer/)
  })

  it('43/44. initial focus is the close control, which is ≥44×44', async () => {
    render(<AccessibleMediaDialog open onClose={() => {}} youtubeKey="k" title="t" />)
    const close = screen.getByRole('button', { name: /close trailer/i })
    await waitFor(() => expect(close).toHaveFocus())
    expect(close.style.width).toBe('44px')
    expect(close.style.height).toBe('44px')
  })

  it('45. Escape closes', () => {
    const onClose = vi.fn()
    render(<AccessibleMediaDialog open onClose={onClose} youtubeKey="k" title="t" />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('46. backdrop click closes', () => {
    const onClose = vi.fn()
    const { container } = render(<AccessibleMediaDialog open onClose={onClose} youtubeKey="k" title="t" />)
    const backdrop = document.querySelector('.ff-media-dialog [aria-hidden="true"]')
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
    void container
  })

  it('47. clicking inside the player does NOT close', () => {
    const onClose = vi.fn()
    render(<AccessibleMediaDialog open onClose={onClose} youtubeKey="k" title="t" />)
    const iframe = document.querySelector('iframe')
    fireEvent.click(iframe.parentElement)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('48/49. Tab and Shift+Tab wrap inside the dialog (close ↔ iframe)', () => {
    render(<AccessibleMediaDialog open onClose={() => {}} youtubeKey="k" title="t" />)
    const close = screen.getByRole('button', { name: /close trailer/i })
    const iframe = document.querySelector('iframe')
    // from the last focusable (iframe) Tab wraps to first (close)
    iframe.focus()
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(close).toHaveFocus()
    // from the first (close) Shift+Tab wraps to last (iframe)
    close.focus()
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(iframe).toHaveFocus()
  })

  it('50/51/52. focus restores to the exact opener on close', async () => {
    render(<Controlled />)
    const opener = screen.getByText('Open trailer')
    opener.focus()
    fireEvent.click(opener)                       // opens → effect captures the opener
    await screen.findByRole('dialog')
    fireEvent.keyDown(window, { key: 'Escape' })  // closes
    await waitFor(() => expect(opener).toHaveFocus())
  })

  it('53. body scroll locks while open and restores on close', () => {
    const { rerender } = render(<AccessibleMediaDialog open onClose={() => {}} youtubeKey="k" title="t" />)
    expect(document.body.style.overflow).toBe('hidden')
    rerender(<AccessibleMediaDialog open={false} onClose={() => {}} youtubeKey="k" title="t" />)
    expect(document.body.style.overflow).toBe('')
  })

  it('55. the iframe is removed after close (no duplicate player)', () => {
    const { rerender } = render(<AccessibleMediaDialog open onClose={() => {}} youtubeKey="k" title="t" />)
    expect(document.querySelectorAll('iframe').length).toBe(1)
    rerender(<AccessibleMediaDialog open={false} onClose={() => {}} youtubeKey="k" title="t" />)
    expect(document.querySelectorAll('iframe').length).toBe(0)
  })

  it('56. the iframe title honestly names the film + video, with the expected URL params', () => {
    render(<AccessibleMediaDialog open onClose={() => {}} youtubeKey="xyz" title="Parasite · Behind the scenes" />)
    const iframe = document.querySelector('iframe')
    expect(iframe).toHaveAttribute('title', 'Parasite · Behind the scenes')
    expect(iframe.getAttribute('src')).toBe('https://www.youtube.com/embed/xyz?autoplay=1&rel=0&modestbranding=1&playsinline=1')
  })

  it('57/58. decorative curtains are hidden + only ONE accessible Close exists', () => {
    render(<AccessibleMediaDialog open onClose={() => {}} youtubeKey="k" title="t" />)
    document.querySelectorAll('.ff-media-dialog__curtain-l, .ff-media-dialog__curtain-r').forEach(
      (c) => expect(c).toHaveAttribute('aria-hidden', 'true'),
    )
    expect(screen.getAllByRole('button', { name: /close/i }).length).toBe(1)
  })

  it('renders nothing when closed or keyless', () => {
    const { container, rerender } = render(<AccessibleMediaDialog open={false} onClose={() => {}} youtubeKey="k" title="t" />)
    expect(container).toBeEmptyDOMElement()
    expect(document.querySelector('.ff-media-dialog')).toBeNull()
    rerender(<AccessibleMediaDialog open onClose={() => {}} youtubeKey={null} title="t" />)
    expect(document.querySelector('.ff-media-dialog')).toBeNull()
  })
})
