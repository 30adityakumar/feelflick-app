// AuthPage.jsx
import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function AuthPage() {
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Optionally, change these TMDb poster paths or use your own movie collage
  const bgImages = [
    "/posters/inception.jpg",
    "/posters/interstellar.jpg",
    "/posters/godfather.jpg",
    "/posters/parasite.jpg"
    // Add more or use a cool movie bg from Unsplash/TMDb
  ]

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
      {/* --- BG movie collage/fallback gradient --- */}
      <div
        style={{
          position: 'absolute',
          zIndex: 0,
          inset: 0,
          width: '100%',
          height: '100%',
          background: `linear-gradient(120deg,#18406d 0%, #191925 60%, #fe9245 120%)`,
          // If using images:
          // background: `url(/collage.jpg) center/cover no-repeat`
          filter: 'brightness(0.46) blur(2px)',
          opacity: 0.8
        }}
      ></div>
      {/* --- LOGO top left --- */}
      <div style={{
        position: 'absolute',
        top: 38, left: 38, zIndex: 1,
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <img src="/logo.png" alt="FeelFlick" style={{ height: 58, width: 58, borderRadius: 12 }} />
        <span style={{
          fontSize: 38, fontWeight: 900,
          color: "#18406d",
          letterSpacing: "-2px",
          textShadow: "0 1px 10px #fff2, 0 1px 20px #18406d44"
        }}>
          FeelFlick
        </span>
      </div>
      {/* --- Form Box --- */}
      <form
        onSubmit={handleAuth}
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 380,
          margin: '0 auto',
          marginTop: '9vh',
          background: 'rgba(24, 22, 36, 0.89)',
          borderRadius: 16,
          boxShadow: '0 6px 36px 0 #0008',
          padding: '38px 32px 26px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          minHeight: 350,
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: "-1px", textAlign: 'center' }}>
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
        {error && <div style={{ color: '#eb423b', margin: '6px 0 2px 0', fontSize: 15, textAlign: 'center' }}>{error}</div>}
        <button
          type="submit"
          style={{
            marginTop: 16,
            background: "#fe9245",
            color: "#18406d",
            border: 'none',
            borderRadius: 8,
            fontWeight: 800,
            fontSize: 19,
            padding: '11px 0',
            boxShadow: '0 1.5px 12px 0 #fe924522',
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.15s"
          }}
          disabled={loading}
        >
          {loading ? (isSigningUp ? "Signing up..." : "Signing in...") : (isSigningUp ? "Sign Up" : "Sign In")}
        </button>
        <div style={{ color: "#aaa", margin: '18px 0 5px 0', textAlign: 'center', fontSize: 15 }}>
          {isSigningUp
            ? <>Already have an account? <span
                style={{ color: "#fe9245", cursor: "pointer", fontWeight: 700 }}
                onClick={() => setIsSigningUp(false)}
              >Sign In</span></>
            : <>New to FeelFlick? <span
                style={{ color: "#fe9245", cursor: "pointer", fontWeight: 700 }}
                onClick={() => setIsSigningUp(true)}
              >Sign up now.</span></>}
        </div>
      </form>
    </div>
  )
}

const inputStyle = {
  margin: "8px 0",
  padding: "13px 12px",
  borderRadius: 7,
  border: "none",
  fontSize: 16,
  background: "#232330",
  color: "#fff",
  outline: "none",
  boxShadow: "0 1.5px 8px 0 #0004",
  fontWeight: 500,
  letterSpacing: "-0.02em"
};
