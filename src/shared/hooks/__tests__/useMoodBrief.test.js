import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import { useMoodBrief } from '../useMoodBrief'

describe('useMoodBrief', () => {
  it('starts on the first question with no answers', () => {
    const { result } = renderHook(() => useMoodBrief())
    expect(result.current.brief.activeQuestionId).toBe('vibe')
    expect(result.current.progress).toEqual({ answered: 0, total: 4 })
    expect(result.current.isComplete).toBe(false)
  })

  it('answer() sets value and auto-advances to the next question', () => {
    const { result } = renderHook(() => useMoodBrief())

    act(() => result.current.answer('vibe', 'cozy_warm'))

    expect(result.current.answers.vibe).toBe('cozy_warm')
    expect(result.current.brief.activeQuestionId).toBe('attention')
    expect(result.current.progress.answered).toBe(1)
  })

  it('answering all 4 questions sets isComplete and activeQuestionId to null', () => {
    const { result } = renderHook(() => useMoodBrief())

    act(() => {
      result.current.answer('vibe', 'curious_sharp')
      result.current.answer('attention', 'lean_in')
      result.current.answer('time', 'medium')
      result.current.answer('company', 'alone')
    })

    expect(result.current.isComplete).toBe(true)
    expect(result.current.brief.activeQuestionId).toBe(null)
    expect(result.current.progress).toEqual({ answered: 4, total: 4 })
  })

  it('editAnswer() re-activates question and clears answers after it', () => {
    const { result } = renderHook(() => useMoodBrief())

    // Answer all 4 questions
    act(() => {
      result.current.answer('vibe', 'cozy_warm')
      result.current.answer('attention', 'lean_back')
      result.current.answer('time', 'short')
      result.current.answer('company', 'friends')
    })

    expect(result.current.progress.answered).toBe(4)

    // Edit question 2 (attention) — should clear time (3), company (4)
    act(() => result.current.editAnswer('attention'))

    expect(result.current.brief.activeQuestionId).toBe('attention')
    expect(result.current.brief.editingFromPin).toBe(true)
    expect(result.current.answers.vibe).toBe('cozy_warm')          // preserved
    expect(result.current.answers.attention).toBe('lean_back')      // still has old value
    expect(result.current.answers.time).toBeUndefined()             // cleared
    expect(result.current.answers.company).toBeUndefined()          // cleared
    expect(result.current.progress.answered).toBe(2) // vibe + attention
  })

  it('notes persist across editAnswer calls', () => {
    const { result } = renderHook(() => useMoodBrief())

    act(() => {
      result.current.addNote('nothing too sad')
      result.current.answer('vibe', 'cozy_warm')
      result.current.answer('attention', 'lean_in')
    })

    act(() => result.current.editAnswer('vibe'))

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
      result.current.answer('vibe', 'dark_sharp')
      result.current.answer('attention', 'lean_in')
      result.current.addNote('a note')
      result.current.setAnchor({ id: 1, title: 'Test', year: '2020' })
    })

    act(() => result.current.reset())

    expect(result.current.brief.activeQuestionId).toBe('vibe')
    expect(result.current.answers).toEqual({})
    expect(result.current.notes).toEqual([])
    expect(result.current.anchor).toBe(null)
    expect(result.current.anchorSkipped).toBe(false)
    expect(result.current.isComplete).toBe(false)
  })
})
