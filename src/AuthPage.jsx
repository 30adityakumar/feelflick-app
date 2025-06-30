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

  // --- Styles ---
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

  // --- Responsive Layout ---
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        overflow: 'hidden',
        background: '#101015',
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      {/* Background Video */}
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
          filter: "brightness(0.44) blur(1px)",
          transition: "filter 0.22s"
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Softer, lighter overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(115deg, #18406dbc 45%, #fe9245b7 115%)',
        zIndex: 1,
        pointerEvents: "none"
      }} />

      {/* Logo + Title top left */}
      <div style={{
        position: 'absolute', top: 34, left: 40, zIndex: 3,
        display: 'flex', alignItems: 'center', gap: 18
      }}>
        <img
          src="/logo.png"
          alt="FeelFlick"
          style={{
            height: 54, width: 54,
            borderRadius: 12,
            boxShadow: "0 2px 12px #0004"
          }}
        />
        <span style={{
          fontSize: 36, fontWeight: 900,
          color: "#fff",
          letterSpacing: "-1.5px",
          textShadow: "0 1px 10px #0008, 0 1px 20px #fff1"
        }}>
          FeelFlick
        </span>
      </div>

      {/* Main content: login + about */}
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 2
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: window.innerWidth < 900 ? "column" : "row",
            gap: window.innerWidth < 900 ? 32 : 64,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {/* About box (Letterboxd-style) */}
          <div style={{
            background: "rgba(19,23,34,0.82)",
            borderRadius: 16,
            padding: window.innerWidth < 600 ? "28px 18px 16px 18px" : "38px 36px 22px 32px",
            minWidth: window.innerWidth < 600 ? "90vw" : 330,
            maxWidth: 370,
            marginBottom: window.innerWidth < 900 ? 10 : 0,
            boxShadow: "0 8px 36px 0 #0005",
            color: "#fff",
            fontSize: 18,
            fontWeight: 500,
            lineHeight: 1.44,
            textAlign: window.innerWidth < 900 ? "center" : "left",
            backdropFilter: "blur(3px)",
          }}>
            <div style={{
              fontWeight: 800,
              fontSize: 22,
              marginBottom: 10,
              letterSpacing: "-0.5px",
              color: "#fdaf41"
            }}>
              Track. Discover. Feel.
            </div>
            Your personal movie diary and watchlist, designed to match your moods.<br /><br />
            Keep a history, explore new favorites, and get custom recommendations—beautifully simple, always private.
          </div>

          {/* Sign-in/up box */}
          <form
            onSubmit={handleAuth}
            style={{
              background: "rgba(23,24,29,0.97)",
              borderRadius: 20,
              boxShadow: '0 8px 48px 0 #0008',
              padding: window.innerWidth < 600 ? '38px 12vw 28px 12vw' : '46px 42px 34px 42px',
              minWidth: window.innerWidth < 600 ? "90vw" : 380,
              maxWidth: 410,
              minHeight: 340,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch'
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 18, textAlign: 'center' }}>
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
                background: "linear-gradient(90deg,#fe9245 10%,#eb423b 95%)",
                color: "#fff",
                border: 'none',
                borderRadius: 9,
                fontWeight: 800,
                fontSize: 20,
                padding: '13px 0',
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
                    style={{ color: "#fdaf41", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}
                    onClick={() => setIsSigningUp(false)}
                  >Sign In</span></>
                : <>New to FeelFlick? <span
                    style={{ color: "#fdaf41", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}
                    onClick={() => setIsSigningUp(true)}
                  >Sign up now.</span></>}
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute",
        left: 0, right: 0, bottom: 20,
        width: "100vw",
        zIndex: 4,
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
