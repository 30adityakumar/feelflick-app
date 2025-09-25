// src/features/auth/AuthPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthForm from '../components/AuthForm'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export default function AuthPage() {
  const q = useQuery()
  const navigate = useNavigate()
  const [mode, setMode] = useState(q.get('mode') === 'signup' ? 'signup' : 'signin')

  useEffect(() => {
    const m = q.get('mode')
    if (m === 'signup' || m === 'signin') setMode(m)
  }, [q])

  function handleSuccess() {
    // After auth, send to app/home
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col">
        {/* Topbar (minimal) */}
        <header className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-emerald-500" />
            <span className="text-sm font-semibold tracking-wide">FeelFlick</span>
          </a>
          <nav className="flex items-center gap-3 text-sm">
            <a href="/auth?mode=signin" className="rounded px-3 py-1.5 text-slate-300 hover:text-white">Sign in</a>
            <a href="/auth?mode=signup" className="rounded bg-white/10 px-3 py-1.5 hover:bg-white/15">Get started</a>
          </nav>
        </header>

        {/* Main */}
        <main className="grid flex-1 place-items-center px-4 py-8">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="mb-6 text-center">
              <h1 className="text-xl font-semibold">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
              <p className="mt-1 text-sm text-slate-400">Sign {mode === 'signin' ? 'in to continue' : 'up to get started'}.</p>
            </div>
            <AuthForm mode={mode} onSuccess={handleSuccess} />
          </div>
        </main>

        {/* Footer mini */}
        <footer className="px-4 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} FeelFlick · <a className="underline hover:text-slate-300" href="/status">Status</a>
        </footer>
      </div>
    </div>
  )
}
