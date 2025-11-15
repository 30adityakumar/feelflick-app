// src/features/auth/PostAuthGate.jsx
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'

export default function PostAuthGate() {
  const [status, setStatus] = useState('loading') // 'loading' | 'complete' | 'incomplete'
  const [user, setUser] = useState(null)
  const location = useLocation()

  useEffect(() => {
    let active = true

    async function checkOnboarding() {
      try {
        // Get current user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (!active) return

        if (!currentUser) {
          setStatus('incomplete')
          return
        }

        setUser(currentUser)

        // Check if onboarding is complete
        const { data, error } = await supabase
          .from('user_preferences')
          .select('onboarding_complete')
          .eq('user_id', currentUser.id)
          .maybeSingle()

        if (!active) return

        if (error) {
          console.error('Error checking onboarding:', error)
          setStatus('incomplete')
          return
        }

        // If no preferences row or onboarding not complete, redirect
        if (!data || !data.onboarding_complete) {
          setStatus('incomplete')
        } else {
          setStatus('complete')
        }
      } catch (err) {
        if (!active) return
        console.error('Unexpected error:', err)
        setStatus('incomplete')
      }
    }

    checkOnboarding()

    return () => {
      active = false
    }
  }, [])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#FF9245] border-r-transparent mb-4" />
          <p className="text-white/70 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to onboarding if incomplete
  if (status === 'incomplete') {
    return <Navigate to="/onboarding" replace state={{ from: location }} />
  }

  // Onboarding complete, render children
  return <Outlet />
}
