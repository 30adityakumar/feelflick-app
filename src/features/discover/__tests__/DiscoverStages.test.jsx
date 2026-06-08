// src/features/discover/__tests__/DiscoverStages.test.jsx
// F3.3 — isolated component tests for the extracted pre-result Discover stages.
// These lock the render + interaction + timer + audio-callback contracts so the
// later UX redesign is reviewable. No live Discover mount, no Supabase, no
// impressions, no real Web Audio — every callback (FFAudio adapters included) is
// mocked. NOTE (deferred per F3.3): we do NOT assert aria-pressed / single-h1 /
// announcements here — those are F3.1 findings fixed in later phases.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

import StageMood from '../sections/StageMood'
import StageNightContext from '../sections/StageNightContext'
import StageResolve from '../sections/StageResolve'

// ── StageMood ─────────────────────────────────────────────────────────────────
// (StageHero was removed in F3.5 — /discover now opens directly on StageMood.)
const MOOD_LABELS = ['Tender', 'Tense', 'Slow-burn', 'Cerebral', 'Cozy', 'Bittersweet', 'Mythic', 'Restless']
const moodBtn = (label) => screen.getByText(label, { selector: '.ff-mood-label' }).closest('button')
const moodProps = (over = {}) => ({
  selected: [], setSelected: vi.fn(), onNext: vi.fn(),
  blendHex: '#A78BFA', bursts: [], fireBurst: vi.fn(),
  audioToggle: <div data-testid="audio-toggle" />, playMoodCue: vi.fn(), playContinueCue: vi.fn(),
  ...over,
})

describe('StageMood', () => {
  it('renders all eight mood buttons + the passed audio toggle', () => {
    render(<StageMood {...moodProps()} />)
    MOOD_LABELS.forEach(l => expect(moodBtn(l)).toBeInTheDocument())
    expect(screen.getByTestId('audio-toggle')).toBeInTheDocument()
  })
  it('Continue is disabled with zero moods, enabled with one', () => {
    const { rerender } = render(<StageMood {...moodProps({ selected: [] })} />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    rerender(<StageMood {...moodProps({ selected: ['tender'] })} />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
  })
  it('selecting a new mood calls setSelected + fireBurst + playMoodCue', () => {
    const p = moodProps({ selected: [] })
    render(<StageMood {...p} />)
    fireEvent.click(moodBtn('Cozy'))
    expect(p.setSelected).toHaveBeenCalledWith(['cozy'])
    expect(p.fireBurst).toHaveBeenCalledWith('cozy', '#FBBF24')
    expect(p.playMoodCue).toHaveBeenCalledWith('cozy')
  })
  it('unselecting a mood does NOT fire a burst or cue', () => {
    const p = moodProps({ selected: ['cozy'] })
    render(<StageMood {...p} />)
    fireEvent.click(moodBtn('Cozy'))
    expect(p.setSelected).toHaveBeenCalledWith([]) // removed
    expect(p.fireBurst).not.toHaveBeenCalled()
    expect(p.playMoodCue).not.toHaveBeenCalled()
  })
  it('rejects a fourth selection when three are already selected', () => {
    const p = moodProps({ selected: ['tender', 'tense', 'slow'] })
    render(<StageMood {...p} />)
    fireEvent.click(moodBtn('Cozy')) // a 4th, unselected mood
    expect(p.setSelected).not.toHaveBeenCalled()
    expect(p.fireBurst).not.toHaveBeenCalled()
  })
  it('preserves selected-order badges', () => {
    render(<StageMood {...moodProps({ selected: ['tense', 'tender'] })} />)
    expect(within(moodBtn('Tense')).getByText('1')).toBeInTheDocument()
    expect(within(moodBtn('Tender')).getByText('2')).toBeInTheDocument()
  })
  it('renders the constellation name for the selection', () => {
    render(<StageMood {...moodProps({ selected: ['tender'] })} />)
    expect(screen.getByText(/Soft Focus/)).toBeInTheDocument()
  })
  it('has no Back button (MoodStage is the front door)', () => {
    render(<StageMood {...moodProps()} />)
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  })
  it('exposes selection state via aria-pressed (F3.5 a11y)', () => {
    render(<StageMood {...moodProps({ selected: ['tender', 'cozy'] })} />)
    expect(moodBtn('Tender')).toHaveAttribute('aria-pressed', 'true')
    expect(moodBtn('Cozy')).toHaveAttribute('aria-pressed', 'true')
    expect(moodBtn('Tense')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('group', { name: /choose one to three moods/i })).toBeInTheDocument()
  })
  it('Continue calls playContinueCue then onNext (in that order)', () => {
    const p = moodProps({ selected: ['tender'] })
    render(<StageMood {...p} />)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(p.playContinueCue).toHaveBeenCalledTimes(1)
    expect(p.onNext).toHaveBeenCalledTimes(1)
    expect(p.playContinueCue.mock.invocationCallOrder[0]).toBeLessThan(p.onNext.mock.invocationCallOrder[0])
  })
})

// ── StageNightContext (smoke — detailed coverage in DiscoverNightContext.test.jsx) ─
describe('StageNightContext (smoke)', () => {
  const nightProps = {
    intention: 'move', setIntention: () => {}, time: 'std', setTime: () => {},
    who: 'alone', setWho: () => {}, energy: 'steady', setEnergy: () => {},
    onUserEdit: () => {}, onNext: () => {}, onBack: () => {}, blendHex: '#A78BFA',
    playOptionCue: () => {}, playContinueCue: () => {},
  }
  it('renders the summary-first checkpoint with the CTA available immediately + editor collapsed', () => {
    render(<StageNightContext {...nightProps} />)
    expect(screen.getByRole('heading', { level: 1, name: 'A few details, already filled in.' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /find my film/i })).toBeInTheDocument()
    expect(screen.queryByRole('group')).not.toBeInTheDocument() // editor collapsed by default
  })
})

// ── StageResolve (smoke — detailed coverage in DiscoverResolve.test.jsx) ───────
// (The old Breath/Reveal/TitleCard ceremony stages were removed in F3.7.)
describe('StageResolve (smoke)', () => {
  it('renders the single resolve status without an h1 or interactive controls', () => {
    render(<StageResolve blendHex="#A78BFA" onDone={() => {}} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Bringing tonight into focus.')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
