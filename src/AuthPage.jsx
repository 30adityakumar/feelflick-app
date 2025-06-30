import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function AuthPage() {
  // Auth state
  const [showSignIn, setShowSignIn] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  // Trending
  const [trending, setTrending] = useState([])

  // Trending from TMDB (only today)
  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${import.meta.env.VITE_TMDB_API_KEY}`)
      .then(r => r.json()).then(({ results }) => setTrending(results.slice(0, 12)))
      .catch(console.error)
  }, [])

  // Auth handler
  const handleAuth = async e => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (isSigningUp) {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { name } }
      })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  // --- Shared colors from logo ---
  const BLUE_BG = "linear-gradient(120deg, #18406d 0%, #232330 100%)"
  const ORANGE = "#fe9245"
  const RED = "#eb423b"
  const LIGHT = "#fff"
  const ACCENT_GRAD = `linear-gradient(90deg,${ORANGE},${RED})`

  // --- Input shared style ---
  const inputStyle = {
    padding: "12px 14px",
    borderRadius: 8,
    border: "none",
    fontSize: 17,
    margin: "9px 0",
    background: "#232330",
    color: LIGHT,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    outline: "none",
    boxShadow: "0 1.5px 8px 0 #0004"
  }

  // -- Sign In / Up Modal
  if (showSignIn) {
    return (
      <div style={{
        minHeight: '100vh', width: '100vw', background: BLUE_BG,
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Hero BG video */}
        <video
          autoPlay muted playsInline loop
          poster="/background-poster.jpg"
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            objectFit: "cover", filter: "brightness(0.63) blur(0.2px)", zIndex: 0
          }}
          onEnded={e => e.currentTarget.pause()}
        >
          <source src="/background.mp4" type="video/mp4"/>
        </video>
        <div style={{
          position: "fixed", inset: 0, background: "rgba(24,30,45,0.32)", zIndex: 1
        }} />
        {/* Floating header, logo left, sign in right */}
        <div style={{
          position: "fixed", top: 32, left: 44, right: 44, zIndex: 3,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <img src="/logo.png" alt="FeelFlick" style={{
              height: 46, width: 46, borderRadius: 12, boxShadow: "0 2px 12px #0003"
            }} />
            <span style={{
              fontWeight: 900, fontSize: 28, color: LIGHT, letterSpacing: "-1.1px"
            }}>FeelFlick</span>
          </div>
        </div>
        {/* Sign in form */}
        <form
          onSubmit={handleAuth}
          style={{
            zIndex: 2,
            maxWidth: 410,
            margin: "0 auto",
            marginTop: "13vh",
            background: "rgba(24, 22, 36, 0.88)",
            borderRadius: 20,
            boxShadow: "0 8px 48px 0 #0009",
            padding: '46px 38px 32px 38px',
            display: "flex", flexDirection: "column", alignItems: "stretch", minHeight: 370
          }}>
          <div style={{
            fontSize: 31, fontWeight: 900, color: LIGHT,
            marginBottom: 18, textAlign: 'center'
          }}>
            {isSigningUp ? "Sign Up" : "Sign In"}
          </div>
          {isSigningUp && (
            <input
              type="text" required placeholder="Your Name" autoComplete="name"
              style={inputStyle} value={name} onChange={e => setName(e.target.value)}
            />
          )}
          <input
            type="email" required placeholder="Email address" autoComplete="email"
            style={inputStyle} value={email} onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password" required placeholder="Password" autoComplete="current-password"
            style={inputStyle} value={password} onChange={e => setPassword(e.target.value)}
          />
          {error && <div style={{ color: '#eb423b', margin: '7px 0 1px 0', fontSize: 15, textAlign: 'center' }}>{error}</div>}
          <button
            type="submit"
            style={{
              marginTop: 20,
              background: ACCENT_GRAD,
              color: LIGHT,
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
              ? <>Already have an account? <span style={{ color: ORANGE, cursor: "pointer", fontWeight: 700 }} onClick={() => setIsSigningUp(false)}>Sign In</span></>
              : <>New to FeelFlick? <span style={{ color: ORANGE, cursor: "pointer", fontWeight: 700 }} onClick={() => setIsSigningUp(true)}>Sign up now.</span></>}
          </div>
        </form>
        <Footer />
      </div>
    )
  }

  // --- Landing Page (Scrollable) ---
  return (
    <div style={{
      minHeight: "100vh", width: "100vw", background: BLUE_BG,
      position: "relative", overflow: "hidden"
    }}>
      {/* Hero background video */}
      <video
        autoPlay muted playsInline loop
        poster="/background-poster.jpg"
        style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          objectFit: "cover", filter: "brightness(0.62) blur(0.15px)", zIndex: 0
        }}
        onEnded={e => e.currentTarget.pause()}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      {/* Overlay */}
      <div style={{
        position: "fixed", inset: 0, background: "rgba(24,30,45,0.19)", zIndex: 1
      }} />
      {/* Top bar with logo/title, sign in */}
      <div style={{
        position: "fixed", top: 30, left: 42, right: 42, zIndex: 3,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <img src="/logo.png" alt="FeelFlick" style={{
            height: 44, width: 44, borderRadius: 12, boxShadow: "0 2px 12px #0003"
          }} />
          <span style={{
            fontWeight: 900, fontSize: 27, color: LIGHT, letterSpacing: "-1.1px"
          }}>FeelFlick</span>
        </div>
        <button
          onClick={() => setShowSignIn(true)}
          style={{
            background: ACCENT_GRAD,
            color: LIGHT,
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 17,
            padding: "8px 24px",
            boxShadow: "0 2px 8px #fe924522",
            cursor: "pointer",
            transition: "opacity 0.14s, background 0.2s"
          }}
        >
          SIGN IN
        </button>
      </div>
      {/* Main content (scrollable) */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        paddingTop: 110
      }}>
        {/* Hero section */}
        <section style={{
          minHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center"
        }}>
          <h1 style={{
            fontWeight: 900,
            fontSize: "clamp(2.0rem, 6vw, 3.3rem)",
            color: "#fff",
            letterSpacing: "-2px",
            marginBottom: 18,
            textShadow: "0 2px 18px #000a"
          }}>
            Movies that match your mood.
          </h1>
          <div style={{
            fontWeight: 400,
            fontSize: "clamp(1.08rem,2.3vw,1.3rem)",
            color: "#fff",
            opacity: 0.96,
            margin: "0 auto 28px auto",
            lineHeight: 1.56,
            maxWidth: 540
          }}>
            Get the perfect recommendation based on your taste and how you feel.<br />
            Fast, private, and always free.
          </div>
          <button
            onClick={() => setShowSignIn(true)}
            style={{
              background: ACCENT_GRAD,
              color: "#fff",
              border: "none",
              borderRadius: 9,
              fontWeight: 900,
              fontSize: 21,
              padding: "14px 46px",
              boxShadow: "0 2px 14px 0 #0004",
              cursor: "pointer",
              marginTop: 12,
              transition: "opacity 0.18s, background 0.23s"
            }}
          >
            GET STARTED
          </button>
        </section>

        {/* Features Section */}
        <section style={{
          background: "rgba(36,52,72,0.82)",
          margin: "0 auto 0 auto",
          borderRadius: 30,
          maxWidth: 990,
          boxShadow: "0 2px 32px #0d1e3f19",
          padding: "40px 12vw 40px 12vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <h2 style={{
            fontSize: "clamp(1.25rem,2vw,1.7rem)",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-1px",
            marginBottom: 23
          }}>
            Why FeelFlick?
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px,1fr))",
            gap: 22,
            width: "100%",
            maxWidth: 850
          }}>
            {/* Feature Cards */}
            {[
              ['🎯', "Personalized Picks", "Get recommendations you’ll actually love."],
              ['📊', "Track Your Watch", "Log everything you’ve seen, all in one place."],
              ['🔒', "Private & Secure", "Your data stays with you. No ads, no selling."],
              ['💸', "Always Free", "No subscription, no paywall, ever."],
              ['🎭', "Mood-Based", "Tell us your mood and get perfect-for-now picks!"],
            ].map(([icon, title, desc], i) => (
              <div key={i} style={{
                background: "#223249",
                borderRadius: 18,
                padding: "27px 18px",
                textAlign: "center",
                boxShadow: "0 2px 16px #0002",
                display: "flex", flexDirection: "column", alignItems: "center",
                minHeight: 170
              }}>
                <div style={{ fontSize: 34, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontWeight: 700, color: ORANGE, fontSize: 18, marginBottom: 4 }}>
                  {title}
                </div>
                <div style={{ fontSize: 15.2, color: "#ccd9e7", opacity: 0.92 }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Movies */}
        <section style={{
          background: "none",
          margin: "42px auto 0 auto",
          maxWidth: 1110,
          width: "97%",
        }}>
          <h2 style={{
            fontWeight: 900,
            fontSize: "clamp(1.15rem,2vw,1.5rem)",
            color: "#fff",
            marginBottom: 17,
            letterSpacing: "-0.6px"
          }}>
            Trending Today
          </h2>
          <div style={{
            display: "flex",
            overflowX: "auto",
            gap: 18,
            paddingBottom: 10
          }}>
            {trending.map(m => (
              <div key={m.id} style={{
                flex: '0 0 auto',
                width: 142,
                background: "#232330",
                borderRadius: 13,
                overflow: "hidden",
                boxShadow: "0 2px 10px #0001"
              }}>
                <img
                  src={m.poster_path
                    ? `https://image.tmdb.org/t/p/w300${m.poster_path}`
                    : '/no-image.png'}
                  alt={m.title}
                  style={{ width: "100%", display: "block" }}
                />
                <div style={{ padding: "10px 10px 7px 10px" }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "#fff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {m.title}
                  </div>
                  <div style={{
                    fontSize: ".84rem",
                    color: "#bcd",
                    marginTop: 2
                  }}>
                    {m.release_date
                      ? new Date(m.release_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
                      : "Coming soon"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section style={{
          background: "none",
          margin: "38px auto 0 auto",
          maxWidth: 420,
          textAlign: "center"
        }}>
          <h2 style={{
            fontSize: "clamp(1.15rem,2vw,1.45rem)",
            color: "#fff",
            fontWeight: 800,
            marginBottom: 14
          }}>
            Ready to get started?
          </h2>
          <button
            onClick={() => setShowSignIn(true)}
            style={{
              background: ACCENT_GRAD,
              color: "#fff",
              border: "none",
              borderRadius: 9,
              fontWeight: 900,
              fontSize: 19,
              padding: "13px 48px",
              boxShadow: "0 2px 10px 0 #0003",
              cursor: "pointer",
              marginTop: 8
            }}
          >
            Create Your Free Account
          </button>
        </section>
        <Footer />
      </div>
    </div>
  )
}

// --- Footer component ---
function Footer() {
  return (
    <footer style={{
      width: "100vw",
      background: "linear-gradient(90deg,#18406d 20%,#fe9245 100%)",
      padding: "0.5rem 0 0.7rem 0",
      marginTop: 36,
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <div style={{
        color: "#fff",
        fontSize: 14,
        opacity: 0.88,
        display: "flex",
        gap: "1.1rem",
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        <a href="/about" style={footerLinkStyle}>About</a>
        <a href="/faq" style={footerLinkStyle}>FAQs</a>
        <a href="/privacy" style={footerLinkStyle}>Privacy</a>
        <a href="/careers" style={footerLinkStyle}>Careers</a>
        <a href="/contact" style={footerLinkStyle}>Contact</a>
        <a href="#" style={footerLinkStyle}>Sign Up</a>
      </div>
      <div style={{
        color: "#fff", opacity: 0.23, fontSize: 13, marginTop: 4, letterSpacing: "0.02em"
      }}>
        © {new Date().getFullYear()} FeelFlick — Movies that match your mood.
      </div>
    </footer>
  )
}

const footerLinkStyle = {
  color: "#fff",
  textDecoration: "none",
  fontWeight: 500,
  opacity: 0.96,
  transition: "opacity 0.19s",
  fontSize: 15,
  padding: "0 0.22em"
}
