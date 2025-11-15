// src/features/landing/components/LandingHero.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Play, ArrowRight, Loader2 } from 'lucide-react'

export default function LandingHero() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [session, setSession] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
        },
      })

      if (signInError) throw signInError

      // Success - show confirmation
      alert('✨ Check your email for the magic link!')
      setEmail('')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGetStarted = () => {
    if (session) {
      navigate('/home')
    } else {
      document.getElementById('email-signup')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          poster="/background-poster.jpg"
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 sm:mb-8">
            <span className="text-white">Movies that match</span>
            <br />
            <span className="bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent">
              your mood
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/80 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            Discover films through emotion, not endless scrolling. Build watchlists, track history,
            and share with friends.
          </p>

          {/* CTA Section */}
          {session ? (
            <button
              onClick={() => navigate('/home')}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-[#FF9245] to-[#EB423B] hover:from-[#FF9245] hover:to-[#E03C9E] transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl"
            >
              <Play className="h-6 w-6 fill-current" />
              <span>Go to App</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="max-w-md mx-auto space-y-4">
              {/* Email Signup Form */}
              <form onSubmit={handleSubmit} id="email-signup" className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={loading}
                    className="flex-1 px-5 py-4 rounded-lg bg-white/10 backdrop-blur border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FF9245] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-4 rounded-lg font-bold text-white bg-gradient-to-r from-[#FF9245] to-[#EB423B] hover:from-[#FF9245] hover:to-[#E03C9E] transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 inline-flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Get Started</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                    {error}
                  </p>
                )}
              </form>

              <p className="text-sm text-white/60">
                Free forever. No credit card required.
              </p>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-16 sm:mt-20 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl mb-2">🎭</div>
              <h3 className="font-bold text-white mb-1">Mood-Based</h3>
              <p className="text-sm text-white/60">
                Find movies by how you feel, not just genre
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-bold text-white mb-1">Lightning Fast</h3>
              <p className="text-sm text-white/60">No endless scrolling, instant results</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎬</div>
              <h3 className="font-bold text-white mb-1">Your Library</h3>
              <p className="text-sm text-white/60">
                Track, share, and organize your movie journey
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
