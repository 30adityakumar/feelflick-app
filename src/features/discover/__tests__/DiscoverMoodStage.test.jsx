import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DiscoverMoodStage from '../sections/DiscoverMoodStage'

function Harness({ onNext = vi.fn() }) {
  const [selected, setSelected] = useState([])
  return <DiscoverMoodStage selected={selected} setSelected={setSelected} onNext={onNext} />
}
const pressed = () => screen.queryAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true')

describe('DiscoverMoodStage', () => {
  it('has one heading and the locked copy', () => {
    render(<Harness />)
    expect(screen.getByRole('heading', { level: 1, name: 'How should tonight feel?' })).toBeTruthy()
    expect(screen.getByText(/Choose up to three moods/i)).toBeTruthy()
  })

  it('selects one to three moods; a fourth is ignored', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /^Tender/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Tense/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Slow-burn/ }))
    expect(pressed()).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: /^Cozy/ }))
    expect(pressed()).toHaveLength(3) // fourth rejected
  })

  it('deselects a chosen mood', () => {
    render(<Harness />)
    const tender = screen.getByRole('button', { name: /^Tender/ })
    fireEvent.click(tender)
    expect(pressed()).toHaveLength(1)
    fireEvent.click(tender)
    expect(pressed()).toHaveLength(0)
  })

  it('shows each chosen mood description accessibly (text, not title-only)', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /^Tender/ }))
    // description rendered as visible text in the summary (works on mobile)
    expect(screen.getByText('Nights that ache softly.')).toBeTruthy()
  })

  it('gates Continue until at least one mood is chosen', () => {
    const onNext = vi.fn()
    render(<Harness onNext={onNext} />)
    const cont = screen.getByRole('button', { name: 'Continue' })
    expect(cont.disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /^Cerebral/ }))
    expect(cont.disabled).toBe(false)
    fireEvent.click(cont)
    expect(onNext).toHaveBeenCalled()
  })
})
