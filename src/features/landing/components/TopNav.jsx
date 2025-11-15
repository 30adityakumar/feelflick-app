// src/features/landing/components/TopNav.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'

export default function TopNav({ hideAuthCta }) {
  const [showSignIn, setShowSignIn] = useState(false)

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10"
        style={{ height: 'var(--topnav-h, 72px)' }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl sm:text-2xl font-black tracking-tight transition-transform hover:scale-105 active:scale-95"
          >
            <span className="bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent">
              FEELFLICK
            </span>
          </Link>

          {/* Auth CTAs */}
          {!hideAuthCta && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSignIn(true)}
                className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-white/90 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF9245] to-[#EB423B] px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Sign In Modal */}
      {showSignIn && (
        <SignInModal onClose={() => setShowSignIn(false)} />
      )}
    </>
  )
}

function SignInModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
        },
      })

      if (authError) throw authError
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-neutral-900 to-black border border-white/10 p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="text-center">
            <div className="mb-4 mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
            <p className="text-white/70 text-sm">
              We sent a magic link to <span className="font-semibold text-white">{email}</span>
            </p>
            <p className="text-white/60 text-xs mt-4">
              Click the link in the email to sign in
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-white/70 text-sm mb-6">
              Enter your email to receive a magic link
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF9245] transition-all"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-[#FF9245] to-[#EB423B] px-4 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>

            <p className="text-center text-xs text-white/50 mt-6">
              Don't have an account?{' '}
              <Link
                to="/onboarding"
                className="text-[#FF9245] hover:text-[#EB423B] font-semibold transition-colors"
                onClick={onClose}
              >
                Get Started
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
