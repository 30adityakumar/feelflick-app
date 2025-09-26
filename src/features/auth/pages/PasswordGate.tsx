// src/features/auth/pages/PasswordGate.tsx
import { useState, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { supabase } from "@/shared/lib/supabase/client"

export default function PasswordGate() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const emailFromQuery = params.get("email") || ""
  const [email, setEmail] = useState(emailFromQuery)
  const [password, setPassword] = useState("")
  const [err, setErr] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = useMemo(() => email && password && !submitting, [email, password, submitting])

  const signIn = async () => {
    setSubmitting(true); setErr("")
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (data?.session) return navigate("/home", { replace: true })
    // Could be wrong pw OR no such user; keep it generic
    setErr("Invalid email or password.")
  }

  const signUp = async () => {
    setSubmitting(true); setErr("")
    const { data, error } = await supabase.auth.signUp({ email, password })
    setSubmitting(false)
    if (error?.message?.includes("already registered")) {
      setErr("This email is already registered. Try resetting your password.")
      return
    }
    if (error) {
      setErr(error.message)
      return
    }
    // Confirmation email sent if your project requires it
    navigate("/auth/check-your-email", { replace: true })
  }

  const forgot = async () => {
    setSubmitting(true); setErr("")
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`
    })
    setSubmitting(false)
    if (error) setErr(error.message)
    else navigate("/auth/check-your-email", { replace: true })
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Enter your password</h1>
      <label className="block text-sm">Email</label>
      <input className="w-full border rounded p-2" value={email} onChange={e=>setEmail(e.target.value)} />
      <label className="block text-sm">Password</label>
      <input className="w-full border rounded p-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <button className="w-full rounded bg-black text-white p-2 disabled:opacity-50"
              disabled={!canSubmit} onClick={signIn}>
        Continue
      </button>
      <div className="flex items-center justify-between text-sm">
        <button className="underline" onClick={forgot} disabled={submitting}>Forgot password?</button>
        <button className="underline" onClick={signUp} disabled={submitting}>Create an account</button>
      </div>
    </div>
  )
}