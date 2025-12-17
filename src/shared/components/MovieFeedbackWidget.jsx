/**
 * MovieFeedbackWidget
 * Thumbs up/down for recommendation feedback
 */

import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown, X, Loader2 } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

export default function MovieFeedbackWidget({ 
  user, 
  movieInternalId, 
  source = 'unknown',
  variant = 'inline' // 'inline' | 'overlay' | 'compact'
}) {
  const [feedback, setFeedback] = useState(null) // -1, 0, 1, or null
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load existing feedback
  useEffect(() => {
    if (!user?.id || !movieInternalId) return

    async function loadFeedback() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('user_movie_feedback')
          .select('feedback_value')
          .eq('user_id', user.id)
          .eq('movie_id', movieInternalId)
          .eq('feedback_type', 'recommendation')
          .maybeSingle()

        if (error) throw error
        setFeedback(data?.feedback_value ?? null)
        console.log('[Feedback] Loaded:', data?.feedback_value)
      } catch (err) {
        console.error('[Feedback] Load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadFeedback()
  }, [user?.id, movieInternalId])

  // Save feedback
  const handleFeedback = async (value) => {
    if (!user?.id || !movieInternalId || saving) return

    setSaving(true)
    const previousValue = feedback

    // Optimistic update
    setFeedback(value)

    try {
      if (value === null || value === 0) {
        // Remove feedback
        const { error } = await supabase
          .from('user_movie_feedback')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movieInternalId)
          .eq('feedback_type', 'recommendation')

        if (error) throw error
        console.log('[Feedback] ✅ Removed feedback')
      } else {
        // Upsert feedback
        const { error } = await supabase
          .from('user_movie_feedback')
          .upsert({
            user_id: user.id,
            movie_id: movieInternalId,
            feedback_type: 'recommendation',
            feedback_value: value,
            source: source,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,movie_id,feedback_type'
          })

        if (error) throw error
        console.log(`[Feedback] ✅ Saved: ${value === 1 ? '👍' : '👎'}`)
      }
    } catch (err) {
      console.error('[Feedback] Save error:', err)
      // Revert optimistic update
      setFeedback(previousValue)
    } finally {
      setSaving(false)
    }
  }

  // Not logged in
  if (!user) return null

  // Loading
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/40">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs">Loading...</span>
      </div>
    )
  }

  // Compact variant (just icons)
  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 p-1">
        <button
          onClick={() => handleFeedback(feedback === 1 ? null : 1)}
          disabled={saving}
          className={`p-1.5 rounded transition-colors ${
            feedback === 1
              ? 'bg-green-500/20 text-green-400'
              : 'hover:bg-white/10 text-white/60 hover:text-white'
          }`}
          title="Like this recommendation"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => handleFeedback(feedback === -1 ? null : -1)}
          disabled={saving}
          className={`p-1.5 rounded transition-colors ${
            feedback === -1
              ? 'bg-red-500/20 text-red-400'
              : 'hover:bg-white/10 text-white/60 hover:text-white'
          }`}
          title="Dislike this recommendation"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  // Inline variant (with text)
  return (
    <div className="space-y-2">
      <p className="text-xs text-white/60">Was this recommendation helpful?</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleFeedback(feedback === 1 ? null : 1)}
          disabled={saving}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            feedback === 1
              ? 'bg-green-500/20 border border-green-500/40 text-green-300'
              : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {feedback === 1 ? 'Liked' : 'Yes'}
        </button>

        <button
          onClick={() => handleFeedback(feedback === -1 ? null : -1)}
          disabled={saving}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            feedback === -1
              ? 'bg-red-500/20 border border-red-500/40 text-red-300'
              : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          {feedback === -1 ? 'Disliked' : 'No'}
        </button>

        {feedback !== null && (
          <button
            onClick={() => handleFeedback(null)}
            disabled={saving}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
            title="Clear feedback"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {saving && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />
        )}
      </div>
    </div>
  )
}
