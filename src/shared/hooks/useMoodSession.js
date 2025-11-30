import { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase/client';

export function useMoodSession() {
  const [sessionId, setSessionId] = useState(null);

  const createMoodSession = async (moodId, viewingContextId, experienceTypeId, energyLevel = 5, intensityOpenness = 5) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase
        .from('mood_sessions')
        .insert({
          user_id: user.id,
          mood_id: moodId,
          viewing_context_id: viewingContextId,
          experience_type_id: experienceTypeId,
          energy_level: energyLevel,
          intensity_openness: intensityOpenness,
          time_of_day: getTimeOfDay(),
          day_of_week: getDayOfWeek(),
          device_type: getDeviceType()
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating mood session:', error);
      return null;
    }
  };

  const endMoodSession = async () => {
    if (!sessionId) return;

    try {
      await supabase
        .from('mood_sessions')
        .update({ session_ended_at: new Date().toISOString() })
        .eq('id', sessionId);

      setSessionId(null);
    } catch (error) {
      console.error('Error ending mood session:', error);
    }
  };

  return { sessionId, createMoodSession, endMoodSession };
}

// Helper functions
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'night';
}

function getDayOfWeek() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function getDeviceType() {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}