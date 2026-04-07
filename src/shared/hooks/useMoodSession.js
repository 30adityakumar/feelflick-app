import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'

export function useMoodSession() {
  const { userId } = useAuthSession()
  const [sessionId, setSessionId] = useState(null)
  const sessionIdRef = useRef(null)

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  const endMoodSession = useCallback(async (sessionIdOverride = sessionIdRef.current) => {
    if (!sessionIdOverride) return

    try {
      await supabase
        .from('mood_sessions')
        .update({ session_ended_at: new Date().toISOString() })
        .eq('id', sessionIdOverride)
    } catch (error) {
      console.error('Error ending mood session:', error)
    } finally {
      if (sessionIdRef.current === sessionIdOverride) {
        sessionIdRef.current = null
        setSessionId(null)
      }
    }
  }, [])

  const createMoodSession = useCallback(
    async (
      moodId,
      viewingContextId,
      experienceTypeId,
      energyLevel = 5,
      intensityOpenness = 5,
    ) => {
      try {
        if (!userId) return null

        if (sessionIdRef.current) {
          await endMoodSession(sessionIdRef.current)
        }

        const { data, error } = await supabase
          .from('mood_sessions')
          .insert({
            user_id: userId,
            mood_id: moodId,
            viewing_context_id: viewingContextId,
            experience_type_id: experienceTypeId,
            energy_level: energyLevel,
            intensity_openness: intensityOpenness,
            time_of_day: getTimeOfDay(),
            day_of_week: getDayOfWeek(),
            device_type: getDeviceType(),
          })
          .select()
          .single()

        if (error) throw error

        sessionIdRef.current = data.id
        setSessionId(data.id)
        return data.id
      } catch (error) {
        console.error('Error creating mood session:', error)
        return null
      }
    },
    [endMoodSession, userId],
  )

  return { sessionId, createMoodSession, endMoodSession }
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 6) return 'night'
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  if (hour < 22) return 'evening'
  return 'night'
}

function getDayOfWeek() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}

function getDeviceType() {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}
