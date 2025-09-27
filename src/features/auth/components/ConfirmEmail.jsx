import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Loader2, ArrowLeft } from 'lucide-react'

function parseHash(hash) {
  const h = (hash || '').replace(/^#/, '')
  const p = new URLSearchParams(h)
  const out = {}
  p.forEach((v, k) => (out[k] = v))
  return out
}

function providerQuickLink(email) {
  const domain = (email.split('@')[1] || '').toLowerCase()
  if (domain.endsWith('gmail.com')) return { href: 'https://mail.google.com/mail/u/0/#inbox', label: 'Open Gmail' }
  if (/(outlook|hotmail|live)\.com$/.test(domain)) return { href: 'https://outlook.live.com/mail/', label: 'Open Outlook' }
  if (domain.endsWith('yahoo.com')) return { href: 'https://mail.yahoo.com/', label: 'Open Yahoo Mail' }
  if (/(icloud\.com|me\.com|mac\.com)$/.test(domain)) return { href: 'https://www.icloud.com/mail', label: 'Open iCloud Mail' }
  if (/(proton\.me|protonmail\.com)$/.test(domain)) return { href: 'https://mail.proton.me/u/0/inbox', label: 'Open Proton Mail' }
  return null
}

export default function ConfirmEmail() {
  const navigate = useNavigate()
  const { hash, state, search } = useLocation()
  const email = useMemo(
    () => state?.email || new URLSearchParams(search).get('email') || '',
    [state, search]
  )

  const [view, setView] = useState('checking') // checking | prompt | ok | no-session | expired | error
  const [msg, setMsg] = useState('')
  const quick = email ? providerQuickLink(email) : null
  const [resending, setResending] = useState(false)

  // If the user got redirected here with tokens (rare for this page), handle them.
  useEffect(() => {
    const params = parseHash(hash)
    if (params.error || params.error_code) {
      if ((params.error_code || '').includes('otp_expired')) {
        setView('expired')
        setMsg('This link is expired or already used.')
      } else {
        setView('error')
        setMsg(decodeURIComponent(params.error_description || 'Invalid confirmation link.'))
      }
      return
    }

    // If there are no tokens in the URL, show the "check your email" prompt.
    if (!hash || (!hash.includes('access_token') && !hash.includes('code'))) {
      setView('prompt')
      return
    }

    ;(async () => {
      try {
        // Try to exchange tokens (harmless if invalid)
        const { error } = await supabase.auth.exchangeCodeForSession(hash)
        if (error) console.warn('exchangeCodeForSession:', error.message)

        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setView('ok')
          setTimeout(() => navigate('/onboarding', { replace: true }), 200)
          return
        }
        setView('no-session')
        setMsg('Email confirmed. Please sign in to continue.')
      } catch {
        setView('error')
        setMsg('Something went wrong while confirming your email.')
      }
    })()
  }, [hash, navigate])

  async function onResend() {
    if (!email) return
    setResending(true)
    setMsg('')
    try {
      await supabase.auth.resend({ type: 'signup', email })
      setMsg('Confirmation email sent. It may take a minute to arrive.')
    } catch {
      setMsg('Email sent (if the address is valid).')
    } finally {
      setResending(false)
    }
  }

  return (
    <section
      className="relative overflow-hidden"
      style={{ marginTop: 'var(--topnav-h, 72px)' }}
    >
      <div className="feelflick-landing-bg" aria-hidden />

      {/* same multi-color background as the hero */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
        <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
        <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(45,119,255,0.35),rgba(45,119,255,0)_70%)]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-var(--topnav-h,72px))] place-items-center px-4 md:px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <Link
              to="/"
              aria-label="Back"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/85 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-sm font-extrabold tracking-tight text-brand-100">FEELFLICK</span>
          </div>

          {/* Checking state (when handling token flows) */}
          {view === 'checking' && (
            <div className="flex flex-col items-center py-10 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-white/80" />
              <p className="mt-3 text-sm text-white/80">Confirming your email…</p>
            </div>
          )}

          {/* Friendly "check your email" prompt (most common after sign-up) */}
          {view === 'prompt' && (
            <div className="py-6 text-center">
              <p className="text-lg font-semibold text-white">Check your email</p>
              <p className="mt-1 text-sm text-white/70">
                We sent a confirmation link to {email ? <strong className="text-white/90">{email}</strong> : 'your email'}.
                Click the link to activate your account.
              </p>

              {quick && (
                <a
                  href={quick.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2.5 text-[0.9rem] font-semibold text-white hover:bg-white/10 focus:outline-none"
                >
                  {quick.label}
                </a>
              )}

              <button
                type="button"
                onClick={onResend}
                disabled={resending}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fe9245] to-[#eb423b] py-2.5 text-[0.9rem] font-semibold text-white disabled:opacity-60 focus:outline-none"
              >
                {resending && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                Resend confirmation email
              </button>

              {msg && <p className="mt-3 text-center text-[12px] text-white/70">{msg}</p>}

              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/auth/log-in-or-create-account', { state: { email } })}
                  className="text-[12px] font-semibold text-white/80 hover:text-white focus:outline-none"
                >
                  Wrong email? Edit
                </button>
                <a
                  href="mailto:"
                  className="text-[12px] font-semibold text-white/80 hover:text-white focus:outline-none"
                >
                  Open mail app
                </a>
              </div>
            </div>
          )}

          {view === 'ok' && (
            <div className="py-8 text-center">
              <p className="text-lg font-semibold text-white">You’re all set!</p>
              <p className="mt-1 text-sm text-white/70">Redirecting to onboarding…</p>
            </div>
          )}

          {view === 'no-session' && (
            <div className="py-6 text-center">
              <p className="text-base font-semibold text-white">{msg}</p>
              <Link
                to="/auth/log-in-or-create-account"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                Go to sign in
              </Link>
            </div>
          )}

          {(view === 'expired' || view === 'error') && (
            <div className="py-6 text-center">
              <p className="text-base font-semibold text-white">
                {msg || 'This confirmation link is invalid or expired.'}
              </p>
              <Link
                to="/auth/log-in-or-create-account"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                Request a new link
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}