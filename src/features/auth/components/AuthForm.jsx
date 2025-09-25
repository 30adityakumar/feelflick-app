// src/features/auth/components/AuthForm.jsx
import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../lib/supabaseClient'
import Spinner from './ui/Spinner'

const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/

function PasswordChecklist({ value = '' }) {
  const rules = useMemo(() => ([
    { key: 'len', ok: value.length >= 8, label: '8+ characters' },
    { key: 'num', ok: /\d/.test(value), label: '1+ number' },
    { key: 'sym', ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value), label: '1+ symbol' },
  ]), [value])

  return (
    <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400">
      {rules.map(r => (
        <li key={r.key} className={r.ok ? 'text-emerald-500' : ''}>
          <span className="inline-block w-3">{r.ok ? '✓' : '•'}</span> {r.label}
        </li>
      ))}
    </ul>
  )
}

export default function AuthForm({ mode = 'signin', onSuccess }) {
  const [currentMode, setCurrentMode] = useState(mode)
  const isSignIn = currentMode === 'signin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => setCurrentMode(mode), [mode])

  function validate() {
    setError('')
    if (!emailRegex.test(email)) return setError('Please enter a valid email.'), false
    if (!isSignIn) {
      if (password.length < 8) return setError('Password must be at least 8 characters.'), false
    }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError('')
    setNotice('')

    const client = getSupabase(remember)

    try {
      if (isSignIn) {
        const { data, error: err } = await client.auth.signInWithPassword({ email, password })
        if (err) throw err
        setNotice('Signed in successfully.')
        onSuccess?.(data)
      } else {
        const { data, error: err } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name || null }
          }
        })
        if (err) throw err
        // If email confirmations are enabled, user must confirm before sign-in
        setNotice('Account created. Please check your email to confirm your address.')
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    setError('')
    const client = getSupabase(true) // Google should persist session
    try {
      const { error: err } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (err) throw err
      // Supabase will redirect away; no further action needed
    } catch (err) {
      setError(err?.message || 'Google sign-in failed.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="mb-6 flex items-center justify-center gap-4 text-sm">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-full border transition ${isSignIn ? 'bg-white/10 text-white border-white/20' : 'text-slate-300 border-transparent hover:bg-white/5'}`}
          onClick={() => setCurrentMode('signin')}
          aria-pressed={isSignIn}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-full border transition ${!isSignIn ? 'bg-white/10 text-white border-white/20' : 'text-slate-300 border-transparent hover:bg-white/5'}`}
          onClick={() => setCurrentMode('signup')}
          aria-pressed={!isSignIn}
        >
          Create account
        </button>
      </div>

      {/* OAuth */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        {loading && <Spinner className="mr-2" />}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.826 32.66 29.28 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.153 7.961 3.039l5.657-5.657C34.869 6.053 29.702 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
          <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.294 16.108 18.772 12 24 12c3.059 0 5.842 1.153 7.961 3.039l5.657-5.657C34.869 6.053 29.702 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
          <path fill="#4CAF50" d="M24 44c5.207 0 9.94-1.984 13.521-5.223l-6.238-5.27C29.231 35.091 26.715 36 24 36c-5.251 0-9.81-3.367-11.4-8.05l-6.561 5.054C8.354 39.556 15.627 44 24 44z"/>
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.353 3.66-4.66 6.383-8.303 6.383v.002c5.251 0 9.81-3.367 11.4-8.05l6.561-5.054z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <span className="h-px w-full bg-white/10" />
        <span className="text-xs text-slate-400">or</span>
        <span className="h-px w-full bg-white/10" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isSignIn && (
          <div>
            <label htmlFor="name" className="block text-sm text-slate-200">Full name (optional)</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              placeholder="Rashmi Sen"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm text-slate-200">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm text-slate-200">Password</label>
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-slate-200"
              onClick={() => setShowPw(v => !v)}
              aria-pressed={showPw}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            id="password"
            type={showPw ? 'text' : 'password'}
            autoComplete={isSignIn ? 'current-password' : 'new-password'}
            required
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            placeholder={isSignIn ? 'Your password' : '8+ characters'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {!isSignIn && <PasswordChecklist value={password} />}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-400"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Keep me signed in
          </label>
          {isSignIn && (
            <a href="/reset-password" className="text-sm text-slate-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded">
              Forgot Password?
            </a>
          )}
        </div>

        {error && (
          <div role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 border border-red-500/20">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 border border-emerald-500/20">
            {notice}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          {loading && <Spinner />} {isSignIn ? 'Sign in' : 'Create account'}
        </button>

        <p className="text-center text-xs text-slate-400">
          By continuing, you agree to our <a href="/terms" className="underline hover:text-slate-200">Terms</a> and <a href="/privacy" className="underline hover:text-slate-200">Privacy</a>.
        </p>
      </form>
    </div>
  )
}