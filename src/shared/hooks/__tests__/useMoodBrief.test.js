import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import { useMoodBrief } from '../useMoodBrief'

describe('useMoodBrief', () => {
  it('starts on the first question with no answers', () => {
    const { result } = renderHook(() => useMoodBrief())
    expect(result.current.brief.activeQuestionId).toBe('feeling')
    expect(result.current.progress).toEqual({ answered: 0, total: 8 })
    expect(result.current.isComplete).toBe(false)
  })

  it('answer() sets value and auto-advances to the next question', () => {
    const { result } = renderHook(() => useMoodBrief())

    act(() => result.current.answer('feeling', 3))

    expect(result.current.answers.feeling).toBe(3)
    expect(result.current.brief.activeQuestionId).toBe('energy')
    expect(result.current.progress.answered).toBe(1)
  })

  it('answering all 8 questions sets isComplete and activeQuestionId to null', () => {
    const { result } = renderHook(() => useMoodBrief())

    act(() => {
      result.current.answer('feeling', 1)
      result.current.answer('energy', 3)
      result.current.answer('attention', 'lean-back')
      result.current.answer('tone', 'warm')
      result.current.answer('company', 'alone')
      result.current.answer('time', 'standard')
      result.current.answer('familiarity', 'comfort')
      result.current.answer('era', 'any')
    })

    expect(result.current.isComplete).toBe(true)
    expect(result.current.brief.activeQuestionId).toBe(null)
    expect(result.current.progress).toEqual({ answered: 8, total: 8 })
  })

  it('editAnswer() re-activates question and clears answers after it', () => {
    const { result } = renderHook(() => useMoodBrief())

    // Answer questions 1-5
    act(() => {
      result.current.answer('feeling', 1)
      result.current.answer('energy', 3)
      result.current.answer('attention', 'lean-in')
      result.current.answer('tone', 'sharp')
      result.current.answer('company', 'alone')
    })

    expect(result.current.progress.answered).toBe(5)

    // Edit question 3 (attention) — should clear tone (4), company (5)
    act(() => result.current.editAnswer('attention'))

    expect(result.current.brief.activeQuestionId).toBe('attention')
    expect(result.current.brief.editingFromPin).toBe(true)
    expect(result.current.answers.feeling).toBe(1)    // preserved
    expect(result.current.answers.energy).toBe(3)     // preserved
    expect(result.current.answers.attention).toBe('lean-in') // still has old value
    expect(result.current.answers.tone).toBeUndefined()      // cleared
    expect(result.current.answers.company).toBeUndefined()   // cleared
    expect(result.current.progress.answered).toBe(3) // feeling + energy + attention
  })

  it('notes persist across editAnswer calls', () => {
    const { result } = renderHook(() => useMoodBrief())

    act(() => {
      result.current.addNote('nothing too sad')
      result.current.answer('feeling', 1)
      result.current.answer('energy', 3)
    })

    act(() => result.current.editAnswer('feeling'))

    expect(result.current.notes).toEqual(['nothing too sad'])
  })

  it('addNote and removeNote work correctly', () => {
    const { result } = renderHook(() => useMoodBrief())

    act(() => {
      result.current.addNote('first note')
      result.current.addNote('second note')
    })

    expect(result.current.notes).toEqual(['first note', 'second note'])

    act(() => result.current.removeNote(0))

    expect(result.current.notes).toEqual(['second note'])
  })

  it('addNote ignores empty/whitespace strings', () => {
    const { result } = renderHook(() => useMoodBrief())

    act(() => {
      result.current.addNote('')
      result.current.addNote('   ')
    })

    expect(result.current.notes).toEqual([])
  })

  it('setAnchor and clearAnchor work', () => {
    const { result } = renderHook(() => useMoodBrief())

    act(() => result.current.setAnchor({ id: 550, title: 'Fight Club', year: '1999' }))

    expect(result.current.anchor).toEqual({ id: 550, title: 'Fight Club', year: '1999' })

    act(() => result.current.clearAnchor())

    expect(result.current.anchor).toBe(null)
  })

  it('skipAnchor sets anchorSkipped flag', () => {
    const { result } = renderHook(() => useMoodBrief())

    expect(result.current.anchorSkipped).toBe(false)

    act(() => result.current.skipAnchor())

    expect(result.current.anchorSkipped).toBe(true)
  })

  it('reset() returns everything to initial state', () => {
    const { result } = renderHook(() => useMoodBrief())

    act(() => {
      result.current.answer('feeling', 5)
      result.current.answer('energy', 5)
      result.current.addNote('a note')
      result.current.setAnchor({ id: 1, title: 'Test', year: '2020' })
    })

    act(() => result.current.reset())

    expect(result.current.brief.activeQuestionId).toBe('feeling')
    expect(result.current.answers).toEqual({})
    expect(result.current.notes).toEqual([])
    expect(result.current.anchor).toBe(null)
    expect(result.current.anchorSkipped).toBe(false)
    expect(result.current.isComplete).toBe(false)
  })
})
