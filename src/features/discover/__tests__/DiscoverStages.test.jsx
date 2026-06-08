// src/features/discover/__tests__/DiscoverStages.test.jsx
// F3.3 — isolated component tests for the extracted pre-result Discover stages.
// These lock the render + interaction + timer + audio-callback contracts so the
// later UX redesign is reviewable. No live Discover mount, no Supabase, no
// impressions, no real Web Audio — every callback (FFAudio adapters included) is
// mocked. NOTE (deferred per F3.3): we do NOT assert aria-pressed / single-h1 /
// announcements here — those are F3.1 findings fixed in later phases.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

import StageMood from '../sections/StageMood'
import StageNightContext from '../sections/StageNightContext'
import StageBreath from '../sections/StageBreath'
import StageReveal from '../sections/StageReveal'
import StageTitleCard from '../sections/StageTitleCard'

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

// ── Timed ceremony stages ─────────────────────────────────────────────────────
describe('StageBreath (2200ms)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  it('calls onDone exactly once at 2200ms, not before', () => {
    const onDone = vi.fn()
    render(<StageBreath onDone={onDone} />)
    vi.advanceTimersByTime(2199)
    expect(onDone).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onDone).toHaveBeenCalledTimes(1)
  })
  it('clears the timer on unmount', () => {
    const onDone = vi.fn()
    const { unmount } = render(<StageBreath onDone={onDone} />)
    unmount()
    vi.advanceTimersByTime(5000)
    expect(onDone).not.toHaveBeenCalled()
  })
})

describe('StageReveal (2600ms)', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0.5) })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })
  it('calls onDone exactly once at 2600ms, not before', () => {
    const onDone = vi.fn()
    render(<StageReveal selected={['tender']} onDone={onDone} />)
    vi.advanceTimersByTime(2599)
    expect(onDone).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onDone).toHaveBeenCalledTimes(1)
  })
  it('clears the timer on unmount', () => {
    const onDone = vi.fn()
    const { unmount } = render(<StageReveal selected={['tender']} onDone={onDone} />)
    unmount()
    vi.advanceTimersByTime(5000)
    expect(onDone).not.toHaveBeenCalled()
  })
  it('renders 24 decorative burst points', () => {
    const { container } = render(<StageReveal selected={['tender']} onDone={() => {}} />)
    expect(container.querySelectorAll('span')).toHaveLength(24)
  })
  it('renders for one and three moods without failing', () => {
    expect(() => render(<StageReveal selected={['tender']} onDone={() => {}} />)).not.toThrow()
    expect(() => render(<StageReveal selected={['tender', 'tense', 'slow']} onDone={() => {}} />)).not.toThrow()
  })
})

describe('StageTitleCard (1400ms)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  it('plays the title cue once and renders the title', () => {
    const playTitleCue = vi.fn()
    render(<StageTitleCard title="Parasite" onDone={() => {}} playTitleCue={playTitleCue} />)
    expect(playTitleCue).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Parasite')).toBeInTheDocument()
  })
  it('calls onDone exactly once at 1400ms, not before', () => {
    const onDone = vi.fn()
    render(<StageTitleCard title="X" onDone={onDone} playTitleCue={() => {}} />)
    vi.advanceTimersByTime(1399)
    expect(onDone).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onDone).toHaveBeenCalledTimes(1)
  })
  it('clears the timer on unmount', () => {
    const onDone = vi.fn()
    const { unmount } = render(<StageTitleCard title="X" onDone={onDone} playTitleCue={() => {}} />)
    unmount()
    vi.advanceTimersByTime(5000)
    expect(onDone).not.toHaveBeenCalled()
  })
})
