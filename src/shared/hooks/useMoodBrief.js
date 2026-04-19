// src/shared/hooks/useMoodBrief.js
import { useCallback, useMemo, useState } from 'react'

import { QUESTION_SET } from '@/app/pages/discover/questions'

/**
 * State management for the 8-question Mood Brief flow.
 *
 * @returns {{
 *   brief: { answers: Record<string, any>, activeQuestionId: string|null, editingFromPin: boolean },
 *   answer: (questionId: string, value: any) => void,
 *   editAnswer: (questionId: string) => void,
 *   addNote: (text: string) => void,
 *   removeNote: (index: number) => void,
 *   setAnchor: (film: { id: number, title: string, year: string }) => void,
 *   clearAnchor: () => void,
 *   skipAnchor: () => void,
 *   anchorSkipped: boolean,
 *   isComplete: boolean,
 *   progress: { answered: number, total: number },
 *   reset: () => void,
 * }}
 */
export function useMoodBrief() {
  const [answers, setAnswers] = useState({})
  const [activeQuestionId, setActiveQuestionId] = useState(QUESTION_SET[0].id)
  const [editingFromPin, setEditingFromPin] = useState(false)
  const [notes, setNotes] = useState([])
  const [anchor, setAnchorState] = useState(null)
  const [anchorSkipped, setAnchorSkipped] = useState(false)

  const questionIds = useMemo(() => QUESTION_SET.map((q) => q.id), [])

  const answeredCount = useMemo(
    () => questionIds.filter((id) => answers[id] !== undefined).length,
    [questionIds, answers],
  )

  const isComplete = answeredCount === QUESTION_SET.length

  const progress = useMemo(
    () => ({ answered: answeredCount, total: QUESTION_SET.length }),
    [answeredCount],
  )

  /** Set an answer and auto-advance to the next unanswered question. */
  const answer = useCallback(
    (questionId, value) => {
      setEditingFromPin(false)

      setAnswers((prev) => {
        const next = { ...prev, [questionId]: value }

        // Find the first unanswered question after the current one
        const currentIdx = questionIds.indexOf(questionId)
        let nextActiveId = null
        for (let i = currentIdx + 1; i < questionIds.length; i++) {
          if (next[questionIds[i]] === undefined) {
            nextActiveId = questionIds[i]
            break
          }
        }
        // null means all answered → triggers results
        setActiveQuestionId(nextActiveId)
        return next
      })
    },
    [questionIds],
  )

  /** Re-activate a pinned question and clear all answers after it. */
  const editAnswer = useCallback(
    (questionId) => {
      const idx = questionIds.indexOf(questionId)
      if (idx === -1) return

      setActiveQuestionId(questionId)
      setEditingFromPin(true)

      // Clear answers for all questions that come AFTER questionId
      setAnswers((prev) => {
        const next = { ...prev }
        for (let i = idx + 1; i < questionIds.length; i++) {
          delete next[questionIds[i]]
        }
        return next
      })
    },
    [questionIds],
  )

  const addNote = useCallback((text) => {
    if (!text.trim()) return
    setNotes((prev) => [...prev, text.trim()])
  }, [])

  const removeNote = useCallback((index) => {
    setNotes((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const setAnchor = useCallback((film) => {
    setAnchorState(film)
    setAnchorSkipped(false)
  }, [])

  const clearAnchor = useCallback(() => {
    setAnchorState(null)
  }, [])

  const skipAnchor = useCallback(() => {
    setAnchorSkipped(true)
  }, [])

  const reset = useCallback(() => {
    setAnswers({})
    setActiveQuestionId(QUESTION_SET[0].id)
    setEditingFromPin(false)
    setNotes([])
    setAnchorState(null)
    setAnchorSkipped(false)
  }, [])

  return {
    brief: { answers, activeQuestionId, editingFromPin },
    answers,
    notes,
    anchor,
    anchorSkipped,
    answer,
    editAnswer,
    addNote,
    removeNote,
    setAnchor,
    clearAnchor,
    skipAnchor,
    isComplete,
    progress,
    reset,
  }
}
