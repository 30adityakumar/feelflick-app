// src/features/auth/PostAuthGate.jsx
import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { hasCompletedOnboarding } from '@/features/onboarding/Onboarding'
import { Loader2 } from 'lucide-react'

export default function PostAuthGate() {
  const [status, setStatus] = useState('checking') // 'checking' | 'ready' | 'redirect'
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true

    async function checkOnboarding() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError

        if (!user) {
          if (mounted) {
            setStatus('redirect')
            navigate('/', { replace: true })
          }
          return
        }

        const completed = await hasCompletedOnboarding(user.id)

        if (!mounted) return

        if (!completed) {
          setStatus('redirect')
          navigate('/onboarding', { replace: true })
        } else {
          setStatus('ready')
        }
      } catch (err) {
        console.error('PostAuthGate error:', err)
        if (mounted) {
          setError(err.message)
          setStatus('ready') // Allow through on error to avoid blocking
        }
      }
    }

    checkOnboarding()

    return () => {
      mounted = false
    }
  }, [navigate])

  // Loading State
  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          {/* FeelFlick Branded Spinner */}
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-white/10" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
            <div
              className="absolute inset-2 rounded-full border-4 border-transparent border-t-pink-500 animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '1s' }}
            />
          </div>
          <p className="text-white/60 text-sm font-medium">
            Loading your experience...
          </p>
        </div>
      </div>
    )
  }

  // Error State (Still render children but show error)
  if (error) {
    console.warn('PostAuthGate error (allowing through):', error)
  }

  // Ready State
  return <Outlet />
}
