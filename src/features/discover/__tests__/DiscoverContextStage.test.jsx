import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DiscoverContextStage from '../sections/DiscoverContextStage'

function Harness({ onUserEdit = vi.fn(), onNext = vi.fn(), onBack = vi.fn() }) {
  const [time, setTime] = useState('std')
  const [who, setWho] = useState('alone')
  const [energy, setEnergy] = useState('steady')
  const [intention, setIntention] = useState('move')
  return (
    <DiscoverContextStage
      time={time} setTime={setTime} who={who} setWho={setWho} energy={energy} setEnergy={setEnergy} intention={intention} setIntention={setIntention}
      onUserEdit={onUserEdit} onNext={onNext} onBack={onBack}
    />
  )
}

describe('DiscoverContextStage', () => {
  it('shows the locked copy + the current (predicted) values as a starting point', () => {
    render(<Harness />)
    expect(screen.getByRole('heading', { level: 1, name: 'This is tonight.' })).toBeTruthy()
    expect(screen.getByText(/filled in a starting point/i)).toBeTruthy()
    expect(screen.getByText('Move me')).toBeTruthy()   // intention=move
    expect(screen.getByText('~ 2 hrs')).toBeTruthy()    // time=std
  })

  it('opens one accordion group at a time and edits a value', () => {
    const onUserEdit = vi.fn()
    render(<Harness onUserEdit={onUserEdit} />)
    fireEvent.click(screen.getByRole('button', { name: /Intention/ }))
    const intentionRow = screen.getByRole('button', { name: /Intention/ })
    expect(intentionRow.getAttribute('aria-expanded')).toBe('true')
    // pick a different intention (option button label includes the sub-copy)
    fireEvent.click(screen.getByRole('button', { name: /Make me think — I want to chew/i }))
    expect(onUserEdit).toHaveBeenCalled()
    // the summary row now reflects the new value
    expect(screen.getByRole('button', { name: /Intention.*Make me think/ })).toBeTruthy()
    // opening a second group collapses the first
    fireEvent.click(screen.getByRole('button', { name: /Energy/ }))
    expect(screen.getByRole('button', { name: /Energy/ }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: /Intention/ }).getAttribute('aria-expanded')).toBe('false')
  })

  it('wires Back and Find tonight’s film', () => {
    const onNext = vi.fn(); const onBack = vi.fn()
    render(<Harness onNext={onNext} onBack={onBack} />)
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Find tonight’s film/ }))
    expect(onNext).toHaveBeenCalled()
  })
})
