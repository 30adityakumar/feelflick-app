import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import RemoveDiaryEntryDialog from '../RemoveDiaryEntryDialog'

afterEach(() => cleanup())

function setup(over = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(<RemoveDiaryEntryDialog title="Past Lives" onConfirm={onConfirm} onCancel={onCancel} {...over} />)
  return { onConfirm, onCancel }
}

describe('RemoveDiaryEntryDialog — honest, accessible, hardened confirmation', () => {
  it('is a labelled modal whose copy truthfully says the FILM leaves watched history + rating/review remain', () => {
    setup()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('heading', { name: 'Remove from Diary?' })).toBeInTheDocument()
    expect(screen.getByText(/from your watched history/i)).toBeInTheDocument()
    expect(screen.getByText(/Your rating and review remain attached to the film/i)).toBeInTheDocument()
    // truthful: never claims a single watch-date, never claims the rating/review is destroyed
    expect(dialog.textContent).not.toMatch(/this watch date|this viewing|delete your rating|erase|permanently|lose your review/i)
  })

  it('initial focus is on the safe default ("Keep entry")', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Keep entry' })).toHaveFocus()
  })

  it('Escape and "Keep entry" cancel (idle); "Remove from Diary" confirms', () => {
    const a = setup()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(a.onCancel).toHaveBeenCalledTimes(1)
    cleanup()

    const b = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Keep entry' }))
    expect(b.onCancel).toHaveBeenCalledTimes(1)
    expect(b.onConfirm).not.toHaveBeenCalled()
    cleanup()

    const c = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Remove from Diary' }))
    expect(c.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('both actions are ≥44px tall', () => {
    setup()
    for (const name of ['Keep entry', 'Remove from Diary']) {
      expect(screen.getByRole('button', { name }).style.minHeight).toBe('44px')
    }
  })

  it('locks body scroll while open and restores it on unmount', () => {
    document.body.style.overflow = 'auto'
    setup()
    expect(document.body.style.overflow).toBe('hidden')
    cleanup()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('the removing state: aria-busy, both actions disabled, "Removing…", Escape inert', () => {
    const a = setup({ status: 'removing' })
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Keep entry' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Removing…' })).toBeDisabled()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(a.onCancel).not.toHaveBeenCalled() // Escape inert while removing
  })

  it('the error state: persistent inline alert + a "Try again" action that re-confirms', () => {
    const a = setup({ status: 'error' })
    expect(screen.getByRole('alert')).toHaveTextContent(/try again/i)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(a.onConfirm).toHaveBeenCalledTimes(1)
    // Keep entry still cancels in the error state
    fireEvent.click(screen.getByRole('button', { name: 'Keep entry' }))
    expect(a.onCancel).toHaveBeenCalledTimes(1)
  })
})
