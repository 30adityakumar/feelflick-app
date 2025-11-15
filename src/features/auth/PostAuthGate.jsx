// src/features/auth/PostAuthGate.jsx
import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { X, Mail, Lock, Sparkles } from 'lucide-react'

export default function PostAuthGate() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    checkUser()
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    return () => data?.subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    if (location.state?.showAuth) {
      setShowModal(true)
    }
  }, [location])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user || null)
    setLoading(false)
  }

  async function handleEmailAuth(e) {
    e.preventDefault()
    setError('')
    setAuthLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Check your email to confirm your account!')
        setShowModal(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setShowModal(false)
        navigate('/onboarding')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleGoogleAuth() {
    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/onboarding` }
      })
      if (error) throw error
    } catch (err) {
      setError(err.message || 'Google sign-in failed')
      setAuthLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-black">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-[#FF9245]" />
          <span className="text-white/80">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        {/* Auth Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl overflow-hidden">
              {/* Gradient Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E]" />

              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 rounded-full p-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-[#FF9245]" />
                    <span className="text-lg font-black bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent">
                      FEELFLICK
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {mode === 'signin' ? 'Welcome Back' : 'Start Your Journey'}
                  </h2>
                  <p className="text-sm text-white/60">
                    {mode === 'signin' 
                      ? 'Find movies that match your mood' 
                      : 'Discover your perfect movie match'}
                  </p>
                </div>

                {/* Benefits */}
                <div className="mb-6 space-y-2">
                  {['✨ Personalized mood recommendations', '🎬 Track your favorites', '🚀 Share with friends'].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2 text-sm text-white/70">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#FF9245]" />
                      {benefit}
                    </div>
                  ))}
                </div>

                {/* Google Button */}
                <button
                  onClick={handleGoogleAuth}
                  disabled={authLoading}
                  className="w-full mb-4 rounded-xl bg-white hover:bg-gray-100 px-4 py-3 text-sm font-bold text-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-neutral-900 px-2 text-white/40">or continue with email</span>
                  </div>
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-lg bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#FF9245] focus:outline-none focus:ring-1 focus:ring-[#FF9245]"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-lg bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#FF9245] focus:outline-none focus:ring-1 focus:ring-[#FF9245]"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-[#FF9245] to-[#EB423B] hover:to-[#E03C9E] px-4 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    {authLoading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </button>
                </form>

                {/* Toggle Mode */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                    <span className="font-semibold text-[#FF9245]">
                      {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Outlet />
      </>
    )
  }

  return <Outlet />
}
