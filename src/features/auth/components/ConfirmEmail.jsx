import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'

export default function ConfirmEmail() {
  const { state } = useLocation()
  const [email, setEmail] = useState(state?.email ?? '')
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  async function resend() {
    setStatus(null); setError(null)
    try {
      if (!email) throw new Error('Enter your email to resend.')
      const origin = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')
      const { error: err } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${origin}/auth/confirm` },
      })
      if (err) throw err
      setStatus('Confirmation email resent. Check your inbox.')
    } catch (e) {
      setError(e.message || 'Could not resend email.')
    }
  }

  return (
    <main
      className="relative mx-auto grid max-w-7xl grid-cols-1 px-4 py-16 md:px-6"
      style={{ marginTop: 'var(--topnav-h,72px)' }}
    >
      <div className="mx-auto w-full max-w-md text-center">
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Check your email</h1>
        <p className="mt-3 text-white/75">
          We’ve sent a confirmation link to {email || 'your inbox'}. Click it to finish setting up your account.
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => (window.location.href = 'mailto:')}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-white/15 bg-black/30 px-5 font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
          >
            Open email app
          </button>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              className="h-11 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-white outline-none focus:ring-2 focus:ring-brand/60"
            />
            <button
              onClick={resend}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
            >
              Resend
            </button>
          </div>
          {status && <p className="text-sm text-emerald-300/90">{status}</p>}
          {error && <p className="text-sm text-rose-300/90">{error}</p>}
        </div>

        <p className="mt-8 text-sm text-white/70">
          Already confirmed?{' '}
          <Link className="text-white hover:underline" to="/auth/sign-in">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}