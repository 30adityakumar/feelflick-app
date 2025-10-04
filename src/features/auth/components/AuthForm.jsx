// src/features/auth/components/AuthForm.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { ChevronLeft, LogIn } from 'lucide-react'

export default function AuthForm() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  // If already authed, bounce to home
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) navigate('/home', { replace: true })
    })
  }, [navigate])

  async function handleGoogle() {
    try {
      setSubmitting(true)
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/home',
          queryParams: { prompt: 'select_account' },
        },
      })
      // Supabase will redirect; if popup blocked or error, we re-enable button below.
    } catch {
      setSubmitting(false)
    }
  }

  return (
    /* Gradient border wrapper for a subtle premium feel */
    <div
      className="
        w-[min(92vw,520px)]
        rounded-[22px] p-[1px]
        bg-[linear-gradient(135deg,rgba(254,146,69,.65),rgba(235,66,59,.65),rgba(45,119,255,.55),rgba(0,209,255,.55))]
        shadow-[0_40px_120px_rgba(0,0,0,.55)]
        backdrop-blur-[2px]
      "
    >
      {/* Card */}
      <div className="
          relative rounded-[20px]
          bg-black/45 backdrop-blur-md
          ring-1 ring-white/10
          px-5 py-6 sm:px-7 sm:py-8
        "
      >
        {/* Top row: back only (removed shield + text) */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/85 hover:bg-white/10 focus:outline-none"
            aria-label="Go back"
            title="Back"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          {/* empty right side to keep layout balanced */}
          <span className="inline-block w-9" />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-[clamp(1.05rem,2.2vw,1.35rem)] font-extrabold tracking-tight text-white">
            Sign in or create account
          </h1>
          <p className="mt-1 text-[12.5px] leading-relaxed text-white/75">
            One tap with Google — fast, secure, no passwords.
          </p>
        </div>

        {/* Primary action */}
        <div className="mt-6">
          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogle}
            className="
              inline-flex w-full items-center justify-center gap-3
              rounded-full border border-white/10 bg-white/6
              py-3.5 px-4 text-[0.95rem] font-semibold text-white/95
              hover:bg-white/10 active:scale-[.99]
              focus:outline-none disabled:opacity-60
            "
            aria-label="Continue with Google"
          >
            {/* Minimal Google 'G' */}
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="opacity-95">
              <path fill="currentColor" d="M21.35 11.1H12v2.9h5.3c-.23 1.46-1.6 4.2-5.3 4.2a6.1 6.1 0 1 1 0-12.2c1.74 0 2.9.74 3.57 1.38l2.43-2.35C16.64 3.64 14.53 2.7 12 2.7a9.3 9.3 0 1 0 0 18.6c5.35 0 8.9 3.73 8.9-9.2 0-.62-.06-1.07-.15-1.6Z"/>
            </svg>
            {submitting ? 'Opening Google…' : 'Continue with Google'}
          </button>
        </div>

        {/* Tiny reassurance & legal copy */}
        <div className="mt-4 text-center text-[11.5px] text-white/55">
          We never post or share without your permission.
        </div>

        {/* Divider & fallback email hint (optional, keep minimal) */}
        <div className="pointer-events-none mt-6 h-px w-full bg-white/10" />

        {/* Sign-in hint for edge cases */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-white/65">
          <LogIn className="h-3.5 w-3.5" />
          Use your Google account to sign in or create a new one.
        </div>
      </div>
    </div>
  )
}