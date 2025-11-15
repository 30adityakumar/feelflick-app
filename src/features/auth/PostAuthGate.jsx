// src/features/auth/PostAuthGate.jsx
import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Loader2 } from 'lucide-react'

/**
 * PostAuthGate: Ensures user completes onboarding before accessing app
 * Checks if user has preferences set, redirects to onboarding if not
 */
export default function PostAuthGate() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let isMounted = true

    async function checkOnboardingStatus() {
      try {
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError
        if (!user) {
          navigate('/', { replace: true })
          return
        }

        // Check if user has completed onboarding
        const { data: preferences, error: prefError } = await supabase
          .from('user_preferences')
          .select('genres')
          .eq('user_id', user.id)
          .maybeSingle()

        if (prefError && prefError.code !== 'PGRST116') throw prefError

        // If no preferences, redirect to onboarding
        if (!preferences || !preferences.genres || preferences.genres.length === 0) {
          if (isMounted) {
            navigate('/onboarding', {
              replace: true,
              state: { from: location.pathname },
            })
          }
          return
        }

        // User is good to go
        if (isMounted) {
          setLoading(false)
        }
      } catch (err) {
        console.error('PostAuthGate error:', err)
        if (isMounted) {
          setError(err.message || 'Failed to verify account status')
          setLoading(false)
        }
      }
    }

    checkOnboardingStatus()

    return () => {
      isMounted = false
    }
  }, [navigate, location])

  // Loading State
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <Loader2 className="h-12 w-12 animate-spin text-transparent bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full border-4 border-transparent border-t-[#FF9245] border-r-[#EB423B] border-b-[#E03C9E] animate-spin" />
            </div>
          </div>
          <p className="text-white/60 text-sm">Loading your profile...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 text-center">
          <div className="text-red-400 mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-white/60 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-[#FF9245] to-[#EB423B] hover:from-[#FF9245] hover:to-[#E03C9E] transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Success - render child routes
  return <Outlet />
}
