import { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase/client';

export function useRecommendations(moodId, viewingContextId = 1, experienceTypeId = 1, limit = 20) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRecommendations() {
      if (!moodId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error: rpcError } = await supabase.rpc('get_mood_recommendations', {
          p_mood_id: moodId,
          p_viewing_context_id: viewingContextId,
          p_experience_type_id: experienceTypeId,
          p_energy_level: 5,
          p_intensity_openness: 5,
          p_limit: limit,
          p_user_id: user?.id || null  // Pass user ID if logged in
        });

        if (rpcError) throw rpcError;

        setRecommendations(data || []);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [moodId, viewingContextId, experienceTypeId, limit]);

  return { recommendations, loading, error };
}