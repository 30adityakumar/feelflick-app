// src/features/auth/components/AuthForm.jsx
// src/features/auth/components/AuthForm.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { ChevronLeft, Info, Shield, Loader2 } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'

export default function AuthForm() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Toggle to use Google's recommended white button style
  const USE_GOOGLE_WHITE_BUTTON = true

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
    <div className="relative">
      {/* brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[28px] opacity-70 blur-2xl"
        style={{
          background:
            'radial-gradient(65% 55% at 18% 12%, rgba(254,146,69,.18), transparent 60%), radial-gradient(70% 60% at 85% 20%, rgba(0,209,255,.16), transparent 65%)',
        }}
      />

      {/* Hairline gradient wrapper */}
      <div className="w-[min(92vw,640px)] rounded-[22px] p-[1px] bg-[linear-gradient(135deg,rgba(254,146,69,.45),rgba(235,66,59,.35),rgba(45,119,255,.35),rgba(0,209,255,.35))] shadow-[0_40px_120px_rgba(0,0,0,.55)]">
        {/* Card */}
        <div className="rounded-[21px] bg-black/45 backdrop-blur-md ring-1 ring-white/10">
          {/* top bar */}
          <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/85 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              aria-label="Go back"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="inline-block w-9" />
          </div>

          {/* content */}
          <div className="px-6 pb-6 sm:px-8 sm:pb-8">
            <h1 className="text-center text-[clamp(1.05rem,2.1vw,1.35rem)] font-extrabold tracking-tight text-white">
              Sign in or create account
            </h1>
            <p className="mt-1 text-center text-[12.5px] leading-relaxed text-white/75">
              One tap with Google — fast, secure, no passwords.
            </p>

            {/* Google button */}
            <div className="mt-6">
              <button
                type="button"
                disabled={submitting}
                onClick={handleGoogle}
                className={[
                  'group inline-flex w-full items-center justify-center gap-3 rounded-full py-3.5 px-5 text-[0.98rem] font-semibold transition',
                  USE_GOOGLE_WHITE_BUTTON
                    ? 'bg-white text-black hover:bg-white/95 active:scale-[.99] ring-1 ring-black/10'
                    : 'border border-white/12 bg-white/[.06] text-white/95 hover:bg-white/10 active:scale-[.99]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:opacity-70',
                ].join(' ')}
                aria-label="Continue with Google"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin opacity-80" />
                ) : (
                  <img
                    src={googleSvg}
                    width="18"
                    height="18"
                    alt=""
                    aria-hidden="true"
                    className={USE_GOOGLE_WHITE_BUTTON ? 'opacity-100' : 'opacity-95'}
                  />
                )}
                <span>{submitting ? 'Opening Google…' : 'Continue with Google'}</span>
              </button>
            </div>

            {/* What happens next */}
            <p className="mt-3 text-center text-[11.5px] text-white/65">
              Opens a Google window → choose an account → you’ll come right back here.
            </p>

            {/* reassurance */}
            <div className="mt-5 flex items-start justify-center gap-2 text-[12px] leading-relaxed text-white/70">
              <Shield className="mt-[2px] h-4 w-4 text-brand-100" aria-hidden />
              <span>
                We only receive your <span className="text-white/90">name</span>,{' '}
                <span className="text-white/90">email</span>, and{' '}
                <span className="text-white/90">profile picture</span>. We can’t post or access your contacts.
              </span>
            </div>

            {/* optional details */}
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              className="mt-3 inline-flex items-center gap-2 text-[12px] text-white/60 hover:text-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 rounded"
            >
              <Info className="h-3.5 w-3.5" />
              {showDetails ? 'Hide details' : 'What data do we use?'}
            </button>

            {showDetails && (
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[12px] text-white/65">
                <li>Your Google email to create your FeelFlick account.</li>
                <li>Your display name and avatar to personalize your profile.</li>
                <li>No posting permissions, no calendar/contacts, and no ads.</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}