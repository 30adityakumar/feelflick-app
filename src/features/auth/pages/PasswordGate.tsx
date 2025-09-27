import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { supabase } from "@/shared/lib/supabase/client"

export default function PasswordGate() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const emailFromQuery = (params.get("email") || "").trim().toLowerCase()
  const [email, setEmail] = useState(emailFromQuery)
  const [password, setPassword] = useState("")
  const [err, setErr] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = useMemo(() => !!email && !!password && !submitting, [email, password, submitting])

  useEffect(() => {
    // If we already know this email exists or not, you can optionally pre-route here.
    // Keeping this page generic; main fixes are in the actions below.
  }, [email])

  const signIn = async () => {
    const e = (email || "").trim().toLowerCase()
    if (!e || !password || submitting) return

    setSubmitting(true); setErr("")
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: e, password })
      if (error) {
        const msg = (error.message || "").toLowerCase()
        const unconfirmed = /confirm|verified|not\s*confirmed/.test(msg)
        const providerLinked = !unconfirmed && (msg.includes("oauth") || msg.includes("identity") || msg.includes("provider"))

        if (unconfirmed) {
          setErr("Please confirm your email. We can resend the link.")
          navigate(`/confirm-email?email=${encodeURIComponent(e)}`, { state: { email: e } })
          return
        }

        setErr(providerLinked
          ? "This email is linked with Google. Try Continue with Google on the previous screen."
          : "Invalid email or password."
        )
        return
      }
      navigate("/home", { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  const signUp = async () => {
    const e = (email || "").trim().toLowerCase()
    if (!e || !password || submitting) return

    setSubmitting(true); setErr("")
    try {
      // Check first. If exists OR unknown, send to login/password instead of attempting signUp.
      let decision: "exists" | "new" | "unknown" = "unknown"
      try {
        const { data } = await supabase.functions.invoke('check-user-by-email', {
          body: { email: e },
          headers: { 'Content-Type': 'application/json' },
        })
        const ok = data?.ok ?? (typeof data?.exists === "boolean")
        if (ok) {
          decision = data.exists ? "exists" : "new"
        }
      } catch {
        decision = "unknown"
      }

      if (decision !== "new") {
        // existing or unknown → go to login/password to avoid accidental signup + confirm
        navigate(`/auth/log-in/password?email=${encodeURIComponent(e)}`, { replace: true, state: { email: e } })
        return
      }

      // Definitely new → sign up
      const { data, error } = await supabase.auth.signUp({
        email: e,
        password,
        options: { emailRedirectTo: window.location.origin + "/home" },
      })

      if (error) {
        const msg = (error.message || "").toLowerCase()
        if (error.status === 400 || /already|registered|exists|duplicate/.test(msg)) {
          navigate(`/auth/log-in/password?email=${encodeURIComponent(e)}`, { replace: true, state: { email: e } })
          return
        }
        setErr(error.message)
        return
      }

      if (!data.session) {
        navigate(`/confirm-email?email=${encodeURIComponent(e)}`, { replace: true, state: { email: e } })
        return
      }

      navigate("/home", { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  const forgot = async () => {
    const e = (email || "").trim().toLowerCase()
    if (!e || submitting) return
    setSubmitting(true); setErr("")
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        setErr(error.message)
      } else {
        // Keep UX simple; your app may have a dedicated "check your email" screen.
        setErr("If an account exists for this email, a reset link has been sent.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Enter your password</h1>

      <label className="block text-sm">Email</label>
      <input
        className="w-full border rounded p-2"
        value={email}
        onChange={e=>{ setEmail(e.target.value); setErr("") }}
        placeholder="you@example.com"
      />

      <label className="block text-sm">Password</label>
      <input
        className="w-full border rounded p-2"
        type="password"
        value={password}
        onChange={e=>{ setPassword(e.target.value); setErr("") }}
        placeholder="Your password"
      />

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <button
        className="w-full rounded bg-black text-white p-2 disabled:opacity-50"
        disabled={!canSubmit}
        onClick={signIn}
      >
        Continue
      </button>

      <div className="flex items-center justify-between text-sm">
        <button className="underline" onClick={forgot} disabled={submitting}>Forgot password?</button>
        <button className="underline" onClick={signUp} disabled={submitting}>Create an account</button>
      </div>
    </div>
  )
}