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

describe('RemoveDiaryEntryDialog — honest, accessible confirmation (F6.5)', () => {
  it('30/31. is a labelled modal dialog whose copy says only the WATCHED ENTRY is removed + rating/review stay', () => {
    setup()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('heading', { name: 'Remove from Diary?' })).toBeInTheDocument()
    expect(screen.getByText(/removes the watched entry for/i)).toBeInTheDocument()
    expect(screen.getByText(/Your rating and review will stay with the film/i)).toBeInTheDocument()
    // not destructive-sounding about the rating/review
    expect(dialog.textContent).not.toMatch(/delete your rating|erase|permanently|lose your review/i)
  })

  it('38. initial focus is on the safe default ("Keep entry")', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Keep entry' })).toHaveFocus()
  })

  it('Escape and "Keep entry" both cancel; "Remove from Diary" confirms', () => {
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
})
