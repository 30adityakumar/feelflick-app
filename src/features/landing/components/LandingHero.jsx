// src/features/landing/components/LandingHero.jsx
import { useState } from 'react'
import { Sparkles, Heart, TrendingUp, Loader2 } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

// Brand gradient constant
const BRAND_GRADIENT = 'from-[#FF9245] via-[#EB423B] to-[#E03C9E]'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Mood-Based Discovery',
    description: 'Find movies that match exactly how you feel right now.',
  },
  {
    icon: Heart,
    title: 'Personal Watchlists',
    description: 'Save and organize movies you want to watch.',
  },
  {
    icon: TrendingUp,
    title: 'Track Your Journey',
    description: 'Keep a history of everything you've watched.',
  },
]

export default function LandingHero() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      })
      
      if (error) throw error
    } catch (err) {
      console.error('Sign in error:', err)
      setError('Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative flex min-h-[calc(100vh-var(--topnav-h,72px)-var(--footer-h,80px))] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Content */}
      <div className="w-full max-w-4xl text-center">
        {/* Main Heading */}
        <h1 className="mb-6 text-balance text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className={`bg-gradient-to-r ${BRAND_GRADIENT} bg-clip-text text-transparent`}>
            Movies
          </span>{' '}
          that match
          <br />
          your{' '}
          <span className={`bg-gradient-to-r ${BRAND_GRADIENT} bg-clip-text text-transparent`}>
            mood
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-8 max-w-2xl text-balance text-base text-white/80 sm:text-lg md:text-xl lg:text-2xl">
          Discover, track, and share movies based on how you feel. Fast, simple, and free.
        </p>

        {/* CTA */}
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`group relative w-full rounded-xl bg-gradient-to-r ${BRAND_GRADIENT} px-8 py-4 text-lg font-bold text-white shadow-2xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,146,69,0.4)] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-4 focus:ring-white/30`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </span>
            )}
          </button>

          {error && (
            <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1 duration-300">
              {error}
            </p>
          )}

          <p className="text-xs text-white/50">
            No credit card required · Free forever
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="mt-16 sm:mt-20 md:mt-24 w-full max-w-6xl">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:shadow-2xl hover:shadow-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${BRAND_GRADIENT} shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/70">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
