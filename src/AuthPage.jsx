import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function AuthPage() {
  const [showSignIn, setShowSignIn] = useState(false)
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

  // --- LANDING PAGE (HERO) ---
  if (!showSignIn) {
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
            filter: "brightness(0.60) blur(0.35px)"
          }}
          onEnded={e => e.currentTarget.pause()}  // freezes at last frame
        >
          <source src="/background.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Less black overlay */}
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(18,22,30,0.34)',
          zIndex: 1,
          pointerEvents: "none"
        }} />

        {/* Top Bar: logo + signin */}
        <div style={{
          position: 'absolute', top: 34, left: 40, right: 40, zIndex: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          {/* Logo + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
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
              textShadow: "0 1px 10px #000a"
            }}>
              FeelFlick
            </span>
          </div>
          {/* Sign In button */}
          <button
            onClick={() => setShowSignIn(true)}
            style={{
              background: "linear-gradient(90deg, #fe9245 30%, #eb423b 90%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 18,
              padding: "9px 30px",
              boxShadow: "0 2px 8px #fe924522",
              cursor: "pointer",
              transition: "opacity 0.14s, background 0.2s"
            }}
          >
            SIGN IN
          </button>
        </div>

        {/* Centered Hero Content */}
        <div
          style={{
            minHeight: '100vh',
            width: '100vw',
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: 1000,
              minWidth: 400,
              margin: "0 auto"
            }}
          >
            <div style={{
              fontWeight: 900,
              fontSize: "clamp(1.7rem, 4vw, 3rem)", // responsive and big!
              lineHeight: 1.15,
              color: "#fff",
              letterSpacing: "-1.1px",
              marginBottom: 10,
              textShadow: "0 2px 18px #000b, 0 4px 40px #000a",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              Movies that match your mood.
            </div>
            <div style={{
              fontWeight: 400,
              fontSize: window.innerWidth < 600 ? 13 : 17,
              color: "#fff",
              opacity: 0.93,
              marginTop: 8,
              marginBottom: 28,
              lineHeight: 1.7
            }}>
              Get the perfect recommendation based on your taste and how you feel.<br />
              Fast, private, and always free.
            </div>
            <button
              onClick={() => setShowSignIn(true)}
              style={{
                background: "linear-gradient(90deg,#fe9245 18%,#eb423b 82%)",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                fontWeight: 900,
                fontSize: 22,
                padding: "18px 56px",
                boxShadow: "0 2px 16px 0 #0006",
                cursor: "pointer",
                marginTop: 8,
                transition: "opacity 0.16s, background 0.2s"
              }}
            >
              GET STARTED
            </button>
          </div>
        </div>

        {/* (Optional) Subtle colored edge at bottom */}
        <div style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0, height: 16,
          zIndex: 2,
          background: "linear-gradient(to top, #fe9245 0%, transparent 100%)",
          opacity: 0.14,
          pointerEvents: "none"
        }} />

        {/* Footer */}
        <div style={{
          position: "absolute",
          left: 0, right: 0, bottom: 18,
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

  // --- SIGN IN / SIGN UP PAGE ---
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
          filter: "brightness(0.64) blur(0.2px)"
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(18,22,30,0.34)',
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
          textShadow: "0 1px 10px #000a"
        }}>
          FeelFlick
        </span>
      </div>

      {/* Sign in box centered */}
      <form
        onSubmit={handleAuth}
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 400,
          margin: "0 auto",
          marginTop: "11vh",
          background: "rgba(24, 26, 32, 0.74)",
          backdropFilter: "blur(9px)",
          borderRadius: 20,
          boxShadow: "0 8px 48px 0 #0008",
          padding: '46px 38px 32px 38px',
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
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
            background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
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
                style={{ color: "#fdaf41", cursor: "pointer", fontWeight: 700 }}
                onClick={() => setIsSigningUp(false)}
              >Sign In</span></>
            : <>New to FeelFlick? <span
                style={{ color: "#fdaf41", cursor: "pointer", fontWeight: 700 }}
                onClick={() => setIsSigningUp(true)}
              >Sign up now.</span></>}
        </div>
      </form>

      {/* Footer */}
      <div style={{
        position: "absolute",
        left: 0, right: 0, bottom: 18,
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
