// src/features/discover/__tests__/DiscoverNightContext.test.jsx
// F3.6 — StageNightContext: the summary-first night-context checkpoint. The four
// predicted values are shown filled-in, the primary CTA is available immediately
// (no forced taps), and all editing lives behind one optional "Adjust details"
// disclosure. Isolated component tests; no parent, no writes.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import StageNightContext from '../sections/StageNightContext'

const props = (over = {}) => ({
  intention: 'move', setIntention: vi.fn(),
  time: 'std', setTime: vi.fn(),
  who: 'alone', setWho: vi.fn(),
  energy: 'steady', setEnergy: vi.fn(),
  onUserEdit: vi.fn(), onNext: vi.fn(), onBack: vi.fn(),
  blendHex: '#A78BFA', playOptionCue: vi.fn(), playContinueCue: vi.fn(),
  ...over,
})
const toggle = () => screen.getByRole('button', { name: /adjust details|done adjusting/i })
const expand = () => fireEvent.click(toggle())

describe('StageNightContext — summary-first checkpoint', () => {
  it('renders one h1 with the documented heading', () => {
    render(<StageNightContext {...props()} />)
    expect(screen.getByRole('heading', { level: 1, name: 'A few details, already filled in.' })).toBeInTheDocument()
  })
  it('renders the supporting copy', () => {
    render(<StageNightContext {...props()} />)
    expect(screen.getByText('Keep this starting point, or adjust anything that feels off.')).toBeInTheDocument()
  })
  it('renders all four summary labels', () => {
    render(<StageNightContext {...props()} />)
    ;['Intention', 'Time', 'Watching', 'Energy'].forEach(l => expect(screen.getByText(l)).toBeInTheDocument())
  })
  it('renders the current values from the option tables', () => {
    render(<StageNightContext {...props()} />)
    expect(screen.getByText('Move me')).toBeInTheDocument()   // intention move
    expect(screen.getByText('~ 2 hrs')).toBeInTheDocument()   // time std
    expect(screen.getByText('Alone')).toBeInTheDocument()     // who alone
    expect(screen.getByText('Steady')).toBeInTheDocument()    // energy steady
  })
  it('makes the primary CTA available immediately', () => {
    render(<StageNightContext {...props()} />)
    expect(screen.getByRole('button', { name: /find my film/i })).toBeInTheDocument()
  })
  it('does NOT render the old wizard copy', () => {
    render(<StageNightContext {...props()} />)
    expect(screen.queryByText(/1 of 4|2 of 4|3 of 4|4 of 4/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Tap any option to confirm|All set\.|Step 2 of 2|What do you need tonight/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Show me my edition/)).not.toBeInTheDocument()
  })
  it('rerendered prop values update the summary', () => {
    const { rerender } = render(<StageNightContext {...props()} />)
    expect(screen.getByText('Move me')).toBeInTheDocument()
    rerender(<StageNightContext {...props({ intention: 'laugh', who: 'partner' })} />)
    expect(screen.getByText('Make me laugh')).toBeInTheDocument()
    expect(screen.getByText('Partner')).toBeInTheDocument()
    expect(screen.queryByText('Move me')).not.toBeInTheDocument()
  })
})

describe('StageNightContext — optional disclosure', () => {
  it('starts collapsed with aria-expanded=false + aria-controls', () => {
    render(<StageNightContext {...props()} />)
    const t = screen.getByRole('button', { name: /adjust details/i })
    expect(t).toHaveAttribute('aria-expanded', 'false')
    expect(t).toHaveAttribute('aria-controls', 'ff-night-details')
    expect(screen.queryByRole('group')).not.toBeInTheDocument() // no fieldsets yet
  })
  it('Adjust details expands the editor (4 fieldsets, aria-expanded=true)', () => {
    render(<StageNightContext {...props()} />)
    expand()
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /done adjusting/i })).toBeInTheDocument()
    expect(screen.getAllByRole('group')).toHaveLength(4)
  })
  it('each group exposes its options', () => {
    render(<StageNightContext {...props()} />)
    expand()
    ;[/Distract me/, /Move me/, /~ 90 min/, /~ 2 hrs/, /Alone/, /Partner/, /Friends/, /Wiped/, /Steady/, /Wired/]
      .forEach(re => expect(screen.getByRole('button', { name: re })).toBeInTheDocument())
  })
  it('selected options expose aria-pressed=true, unselected false', () => {
    render(<StageNightContext {...props()} />)
    expand()
    expect(screen.getByRole('button', { name: /Move me/ })).toHaveAttribute('aria-pressed', 'true')   // intention move
    expect(screen.getByRole('button', { name: /Steady/ })).toHaveAttribute('aria-pressed', 'true')    // energy steady
    expect(screen.getByRole('button', { name: /Distract me/ })).toHaveAttribute('aria-pressed', 'false')
  })
  it('option controls carry the focus/touch-target contract class', () => {
    render(<StageNightContext {...props()} />)
    expand()
    expect(screen.getByRole('button', { name: /Move me/ })).toHaveClass('ff-night-option')
  })
  it('Done adjusting collapses the editor', () => {
    render(<StageNightContext {...props()} />)
    expand()
    fireEvent.click(screen.getByRole('button', { name: /done adjusting/i }))
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /adjust details/i })).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('StageNightContext — editing + continue', () => {
  it('selecting an option calls onUserEdit + the correct setter + playOptionCue, NOT onNext, and keeps the editor open', () => {
    const p = props()
    render(<StageNightContext {...p} />)
    expand()
    fireEvent.click(screen.getByRole('button', { name: /Make me think/ })) // intention → think
    expect(p.onUserEdit).toHaveBeenCalledTimes(1)
    expect(p.setIntention).toHaveBeenCalledWith('think')
    expect(p.playOptionCue).toHaveBeenCalledTimes(1)
    expect(p.onNext).not.toHaveBeenCalled()
    expect(screen.getAllByRole('group')).toHaveLength(4) // editor still open
  })
  it('updates only its own field', () => {
    const p = props()
    render(<StageNightContext {...p} />)
    expand()
    fireEvent.click(screen.getByRole('button', { name: /Friends/ })) // who → friends
    expect(p.setWho).toHaveBeenCalledWith('friends')
    expect(p.setIntention).not.toHaveBeenCalled()
    expect(p.setTime).not.toHaveBeenCalled()
    expect(p.setEnergy).not.toHaveBeenCalled()
  })
  it('Back calls onBack and not onNext', () => {
    const p = props()
    render(<StageNightContext {...p} />)
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(p.onBack).toHaveBeenCalledTimes(1)
    expect(p.onNext).not.toHaveBeenCalled()
  })
  it('the primary CTA calls playContinueCue then onNext (in that order)', () => {
    const p = props()
    render(<StageNightContext {...p} />)
    fireEvent.click(screen.getByRole('button', { name: /find my film/i }))
    expect(p.playContinueCue).toHaveBeenCalledTimes(1)
    expect(p.onNext).toHaveBeenCalledTimes(1)
    expect(p.playContinueCue.mock.invocationCallOrder[0]).toBeLessThan(p.onNext.mock.invocationCallOrder[0])
  })
  it('the CTA is available in both the collapsed and expanded states', () => {
    render(<StageNightContext {...props()} />)
    expect(screen.getByRole('button', { name: /find my film/i })).toBeInTheDocument()
    expand()
    expect(screen.getByRole('button', { name: /find my film/i })).toBeInTheDocument()
  })
})
