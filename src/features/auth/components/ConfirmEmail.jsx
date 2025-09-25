// src/features/auth/components/ConfirmEmail.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Spinner from '../components/ui/Spinner'

export default function ConfirmEmail() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('We just sent a confirmation link to your email. Open it to activate your account.')
  const [err, setErr] = useState('')

  async function resend() {
    setLoading(true)
    setErr('')
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) throw error
      setMsg('Confirmation email re-sent. Check your inbox (and spam).')
    } catch (e) {
      setErr(e?.message || 'Could not resend email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        <h1 className="text-xl font-semibold">Confirm your email</h1>
        <p className="mt-2 text-sm text-slate-300">{msg}</p>
        <div className="mt-6 space-y-3">
          <label htmlFor="email" className="block text-sm text-slate-200">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" />
          {err && <div role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 border border-red-500/20">{err}</div>}
          <button onClick={resend} disabled={loading || !email} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
            {loading && <Spinner />} Resend confirmation
          </button>
        </div>
      </div>
    </div>
  )
}

