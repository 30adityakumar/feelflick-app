import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function AuthPage() {
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (isSigningUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      background: '#101015'
    }}>
      {/* --- Background Video --- */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/background-poster.jpg"
        style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: 0,
          filter: "brightness(0.32) blur(2px)"
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
        {/* Optionally add <source src="/background.webm" type="video/webm" /> */}
        Your browser does not support the video tag.
      </video>

      {/* --- Overlay for readability --- */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(115deg, #18406d99 50%, #fe9245aa 100%)',
        zIndex: 1,
        pointerEvents: "none"
      }} />

      {/* --- LOGO, TITLE, TAGLINE (top left, mobile wraps) --- */}
      <div style={{
        position: 'absolute', top: 38, left: 38, zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/logo.png" alt="FeelFlick" style={{ height: 58, width: 58, borderRadius: 14, boxShadow: "0 2px 16px #0003" }} />
          <span style={{
            fontSize: 38, fontWeight: 900, color: "#18406d",
            letterSpacing: "-2px", textShadow: "0 1px 10px #fff1, 0 1px 20px #18406d24"
          }}>FeelFlick</span>
        </div>
        <div style={{
          color: "#fdaf41",
          fontSize: "1.0rem",
          marginLeft: 6,
          letterSpacing: "0.01em",
          fontWeight: 600,
          textShadow: "0 1px 7px #19191e70",
          marginBottom: 8,
          marginTop: 6
        }}>
          Movies that match your mood.
        </div>
      </div>

      {/* --- Centered Auth Form with glassmorphism --- */}
      <form
        onSubmit={handleAuth}
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 400,
          margin: '0 auto',
          marginTop: '10vh',
          borderRadius: 20,
          background: 'rgba(24, 22, 36, 0.77)',
          boxShadow: '0 8px 48px 0 #0007',
          backdropFilter: 'blur(6px) saturate(1.2)',
          padding: '46px 38px 32px 38px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          minHeight: 370
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', marginBottom: 18, textAlign: 'center' }}>
          {isSigningUp ? "Sign Up" : "Sign In"}
        </div>
        {isSigningUp && (
          <input
            type="text"
            required
            placeholder="Your Name"
            autoComplete="name"
            style={inputStyle}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}
        <input
          type="email"
          required
          placeholder="Email address"
          autoComplete="email"
          style={inputStyle}
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          placeholder="Password"
          autoComplete="current-password"
          style={inputStyle}
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <div style={{ color: '#eb423b', margin: '7px 0 1px 0', fontSize: 15, textAlign: 'center' }}>{error}</div>}
        <button
          type="submit"
          style={{
            marginTop: 20,
            background: "linear-gradient(100deg,#fe9245 10%,#eb423b 95%)",
            color: "#fff",
            border: 'none',
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 20,
            padding: '12px 0',
            boxShadow: '0 2px 12px 0 #fe924522',
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.15s"
          }}
          disabled={loading}
        >
          {loading ? (isSigningUp ? "Signing up..." : "Signing in...") : (isSigningUp ? "Sign Up" : "Sign In")}
        </button>
        <div style={{ color: "#aaa", margin: '19px 0 5px 0', textAlign: 'center', fontSize: 15 }}>
          {isSigningUp
            ? <>Already have an account? <span
                style={{ color: "#fe9245", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}
                onClick={() => setIsSigningUp(false)}
              >Sign In</span></>
            : <>New to FeelFlick? <span
                style={{ color: "#fe9245", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}
                onClick={() => setIsSigningUp(true)}
              >Sign up now.</span></>}
        </div>
      </form>

      {/* --- Subtle Footer --- */}
      <div style={{
        position: "absolute",
        left: 0, right: 0, bottom: 20,
        width: "100vw",
        zIndex: 3,
        color: "#fff",
        fontSize: 14,
        textAlign: "center",
        opacity: 0.28,
        letterSpacing: "0.01em",
        pointerEvents: "none"
      }}>
        © {new Date().getFullYear()} FeelFlick — Movies that match your mood.
      </div>
    </div>
  )
}

const inputStyle = {
  margin: "10px 0",
  padding: "14px 12px",
  borderRadius: 8,
  border: "none",
  fontSize: 16,
  background: "#232330",
  color: "#fff",
  fontWeight: 500,
  letterSpacing: "-0.02em",
  outline: "none",
  boxShadow: "0 1.5px 8px 0 #0004",
  transition: "box-shadow 0.14s, border 0.14s"
}
