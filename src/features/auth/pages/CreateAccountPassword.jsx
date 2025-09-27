import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { track as _track } from '@/shared/lib/analytics'
const track = _track || (() => {})

export default function CreateAccountPassword() {
  const nav = useNavigate()
  const loc = useLocation()
  const email = useMemo(
    () => (loc.state?.email || new URLSearchParams(loc.search).get('email') || '').trim().toLowerCase(),
    [loc]
  )
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    track('auth_view', { page: 'create-account/password' })
    if (!email) {
      nav('/auth/log-in-or-create-account', { replace: true })
      return
    }

    // Safety net: if email already exists, go to login/password immediately.
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-user-by-email', {
          body: { email },
          headers: { 'Content-Type': 'application/json' },
        })
        if (cancelled) return
        if (!error && data?.exists === true) {
          track('auth_route_decision', { exists: true })
          nav('/auth/log-in/password', { replace: true, state: { email } })
        }
      } catch {
        // ignore—user can still submit; we'll check again on submit
      }
    })()
    return () => { cancelled = true }
  }, [email, nav])

  async function onSubmit(e) {
    e.preventDefault()
    if (!pw || busy) return
    setBusy(true)
    setErr('')

    try {
      // Check AGAIN right before signUp to avoid race/misroute
      const { data: existsData, error: existsErr } = await supabase.functions.invoke('check-user-by-email', {
        body: { email },
        headers: { 'Content-Type': 'application/json' },
      })
      if (!existsErr && existsData?.exists === true) {
        nav('/auth/log-in/password', { replace: true, state: { email } })
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: pw,
        options: { emailRedirectTo: window.location.origin + '/home' },
      })

      // If Supabase says "already registered", route to login/password instead of confirm.
      if (error) {
        const msg = (error.message || '').toLowerCase()
        if (error.status === 400 || /already|registered|exists|duplicate/.test(msg)) {
          nav('/auth/log-in/password', { replace: true, state: { email } })
          return
        }
        throw error
      }

      if (!data.session) {
        track('auth_password_submit', { success: true })
        nav('/confirm-email', { replace: true, state: { email } })
        return
      }

      track('auth_password_submit', { success: true })
      nav('/home', { replace: true })
    } catch (_e) {
      setErr('Something went wrong. Please try again.')
      track('auth_password_submit', { success: false, reason: 'bad_password' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="w-full max-w-[400px] sm:max-w-[420px] rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm shadow-[0_30px_120px_rgba(0,0,0,.55)] max-h-[calc(100svh-var(--topnav-h,72px)-var(--footer-h,0px)-12px)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 text-white/80 mx-auto">
          <ShieldCheck className="h-4 w-4 text-brand-100" />
          <span className="text-xs font-semibold tracking-wide">FEELFLICK</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="px-4 pb-4 sm:px-5 sm:pb-5 overflow-y-auto" style={{ maxHeight: 'calc(100% - 44px)' }}>
        <h1 className="text-center text-[clamp(1rem,1.6vw,1.25rem)] font-bold text-white">Create your account</h1>
        <p className="mt-1 text-center text-[12px] text-white/70">Set your password to continue</p>

        {/* Read-only email with Edit */}
        <label className="mt-3 block text-[10.5px] font-medium text-white/70">Email address</label>
        <div className="mt-1 flex items-center justify-between gap-2">
          <input
            readOnly
            value={email}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-[13.5px] text-white placeholder-white/40 focus:outline-none"
            aria-readonly="true"
          />
          <button
            type="button"
            onClick={() => nav('/auth/log-in-or-create-account', { state: { email } })}
            className="text-[12px] font-semibold text-white/80 hover:text-white focus:outline-none"
            aria-label="Edit email"
          >
            Edit
          </button>
        </div>

        {/* Password */}
        <label className="mt-3 block text-[10.5px] font-medium text-white/70">Password</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr('') }}
            required
            minLength={8}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-3 pr-9 text-[13.5px] text-white placeholder-white/40 focus:outline-none"
            placeholder="Minimum 8 characters"
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/75 hover:bg-white/10 focus:outline-none"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {err && <p className="mt-3 text-[12px] text-center text-red-400">{err}</p>}

        <button
          type="submit"
          disabled={!pw || pw.length < 8 || busy}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fe9245] to-[#eb423b] py-2.5 text-[0.9rem] font-semibold text-white disabled:opacity-60 focus:outline-none"
          aria-label="Continue"
        >
          {busy && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          <span>Continue</span>
        </button>
      </form>
    </div>
  )
}