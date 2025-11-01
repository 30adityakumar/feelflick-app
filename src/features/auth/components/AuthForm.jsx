// src/features/auth/components/AuthForm.jsx
// src/features/auth/components/AuthForm.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import googleSvg from '@/assets/icons/google.svg'

export default function AuthForm() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  // If already authed, go home
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
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="
        w-[min(92vw,420px)]
        rounded-2xl
        bg-black/50 backdrop-blur-md
        ring-1 ring-white/10
        shadow-[0_24px_60px_rgba(0,0,0,.5)]
        p-4 sm:p-5
        text-white
      "
    >
      <h1 className="text-center text-[clamp(1rem,2vw,1.25rem)] font-extrabold tracking-tight">
        Sign in or create account
      </h1>

      <div className="mt-4">
        <button
          type="button"
          disabled={submitting}
          onClick={handleGoogle}
          className="
            group inline-flex w-full items-center justify-center gap-3
            rounded-full border border-white/12 bg-white/[.06]
            py-3 px-5 text-[0.95rem] font-semibold text-white/95
            hover:bg-white/10 active:scale-[.99] focus:outline-none disabled:opacity-60
          "
          aria-label="Continue with Google"
        >
          <img
            src={googleSvg}
            width="18"
            height="18"
            alt=""
            aria-hidden="true"
            className="opacity-95"
          />
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  )
}