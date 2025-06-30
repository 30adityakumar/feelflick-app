import { useState } from 'react'
import { supabase } from './supabaseClient'

// --- Replace with your brand colors if needed
const COLORS = {
  primary: "#18406d",
  accent: "#fe9245",
  accent2: "#eb423b",
  dark: "#101015",
  surface: "#232330",
  blueBg: "linear-gradient(90deg, #18406d 0%, #eb423b 120%)",
  mutedBg: "linear-gradient(120deg, #18406d 0%, #191925 70%, #fe9245 120%)"
}

export default function AuthPage() {
  // --- Auth State
  const [showSignIn, setShowSignIn] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // --- Auth handler
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

  // --- Shared input style
  const inputStyle = {
    margin: "10px 0",
    padding: "14px 12px",
    borderRadius: 8,
    border: "none",
    fontSize: 16,
    background: COLORS.surface,
    color: "#fff",
    fontWeight: 500,
    letterSpacing: "-0.02em",
    outline: "none",
    boxShadow: "0 1.5px 8px 0 #0004",
    transition: "box-shadow 0.14s, border 0.14s"
  }

  // --- LANDING PAGE (not signed in) ---
  if (!showSignIn) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          fontFamily: "Inter, system-ui, sans-serif",
          background: COLORS.dark,
          overflowX: "hidden"
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
            width: "100vw", height: "100vh",
            objectFit: "cover",
            zIndex: 0,
            filter: "brightness(0.54) blur(0.6px)"
          }}
          onEnded={e => e.currentTarget.pause()}
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        {/* Overlay */}
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(20,24,35,0.42)',
          zIndex: 1
        }} />

        {/* --- Top NavBar --- */}
        <div style={{
          position: 'sticky', // always at the top
          top: 0, left: 0, right: 0,
          width: "100vw",
          zIndex: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(18,18,24,0.75)",
          backdropFilter: "blur(7px)",
          padding: "12px 38px 11px 32px",
          boxShadow: "0 2px 18px #0001"
        }}>
          {/* Logo + FeelFlick (left) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <img
              src="/logo.png"
              alt="FeelFlick"
              style={{
                height: 48, width: 48,
                borderRadius: 12,
                boxShadow: "0 2px 12px #0002"
              }}
            />
            <span style={{
              fontSize: 31, fontWeight: 900,
              color: "#fff",
              letterSpacing: "-1.3px",
              textShadow: "0 1px 9px #19194028"
            }}>
              FeelFlick
            </span>
          </div>
          {/* SIGN IN (right) */}
          <button
            onClick={() => setShowSignIn(true)}
            style={{
              background: `linear-gradient(90deg, ${COLORS.accent} 10%, ${COLORS.accent2} 90%)`,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              padding: "7px 23px",
              boxShadow: "0 2px 8px #fe924532",
              cursor: "pointer"
            }}
          >SIGN IN</button>
        </div>

        {/* --- Scrollable Content --- */}
        <div style={{ position: "relative", zIndex: 2 }}>
          {/* HERO SECTION */}
          <section style={{
            minHeight: "68vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "90px 0 30px 0"
          }}>
            <div style={{
              fontWeight: 900,
              fontSize: "clamp(2.0rem, 5vw, 3.1rem)",
              color: "#fff",
              letterSpacing: "-1.1px",
              marginBottom: 10,
              textShadow: "0 2px 18px #000c, 0 4px 40px #000b"
            }}>
              Movies that match your mood.
            </div>
            <div style={{
              fontWeight: 400,
              fontSize: "clamp(1rem,2vw,1.1rem)",
              color: "#fff",
              opacity: 0.89,
              marginBottom: 20,
              marginTop: 7,
              lineHeight: 1.7,
              maxWidth: 480
            }}>
              Get the perfect recommendation based on your taste and how you feel.<br />
              Fast, private, and always free.
            </div>
            <button
              onClick={() => setShowSignIn(true)}
              style={{
                background: `linear-gradient(90deg,${COLORS.accent} 20%,${COLORS.accent2} 90%)`,
                color: "#fff",
                border: "none",
                borderRadius: 7,
                fontWeight: 900,
                fontSize: 19,
                padding: "14px 34px",
                marginTop: 5,
                boxShadow: "0 2px 16px 0 #0006",
                cursor: "pointer",
                transition: "opacity 0.14s, background 0.22s"
              }}
            >
              GET STARTED
            </button>
          </section>

          {/* --- Why FeelFlick (Features Grid) --- */}
          <section style={{
            margin: "0 auto 18px auto",
            maxWidth: 1020,
            width: "100%",
            padding: "10px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10
          }}>
            <h2 style={{
              fontWeight: 900,
              fontSize: "clamp(1.35rem,2.7vw,1.75rem)",
              color: "#fdaf41",
              letterSpacing: "-1px",
              marginBottom: 14,
              marginTop: 0
            }}>Why FeelFlick?</h2>
            {/* 5-point features grid */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "18px",
                justifyContent: "center",
                width: "100%"
              }}>
              {[
                { icon: "✨", label: "Personalized, mood-based picks", desc: "Get suggestions tailored to your mood, taste, and history." },
                { icon: "🔒", label: "Private & Secure", desc: "Your data is never sold or shared. You're always in control." },
                { icon: "⚡️", label: "Blazing Fast", desc: "Super-quick search and recommendations. No clutter, no wait." },
                { icon: "🎬", label: "Track Everything", desc: "Keep a clean, beautiful log of all movies you’ve watched." },
                { icon: "🆓", label: "Always Free", desc: "No subscriptions, no ads, no catch. 100% free forever." },
              ].map((f, i) => (
                <div key={f.label}
                  style={{
                    background: i % 2 === 0
                      ? "rgba(24, 64, 109, 0.88)"
                      : "rgba(254, 146, 69, 0.20)",
                    color: "#fff",
                    borderRadius: 13,
                    padding: "22px 28px",
                    minWidth: 200,
                    maxWidth: 240,
                    boxShadow: "0 2px 20px 0 #0003",
                    flex: "1 1 170px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 7,
                    textAlign: "center"
                  }}>
                  <div style={{ fontSize: 32, marginBottom: 5 }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{f.label}</div>
                  <div style={{
                    fontWeight: 400, fontSize: 15,
                    color: "#fff", opacity: 0.89, marginTop: 2
                  }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* --- Trending Movies ("Today" only) --- */}
          <section style={{
            maxWidth: 1060,
            margin: "10px auto 36px auto",
            width: "100%",
            padding: "0 4vw"
          }}>
            <h2 style={{
              fontWeight: 900,
              fontSize: "clamp(1.24rem,2.2vw,1.45rem)",
              color: "#fff",
              letterSpacing: "-1px",
              marginBottom: 15
            }}>Trending Today</h2>
            {/* Placeholder for carousel (replace with TMDb if you want) */}
            <div
              style={{
                display: "flex",
                gap: 16,
                overflowX: "auto",
                paddingBottom: 10
              }}>
              {["Thunderbolts*", "Squid Game", "Revenged Love", "F1 The Movie", "Jurassic World", "Sinners", "Flourished Peony"]
                .map((title, idx) => (
                  <div key={title}
                    style={{
                      minWidth: 140,
                      background: idx % 2 === 0
                        ? "rgba(24, 64, 109, 0.77)"
                        : "rgba(254, 146, 69, 0.19)",
                      borderRadius: 13,
                      boxShadow: "0 2px 16px 0 #0002",
                      padding: 12,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center"
                    }}>
                    <div style={{
                      width: 100, height: 148,
                      background: "#222 url(/posters/inception.jpg) center/cover no-repeat",
                      borderRadius: 8,
                      marginBottom: 10
                    }} />
                    <div style={{
                      fontWeight: 600,
                      color: "#fff",
                      fontSize: 15,
                      marginBottom: 2
                    }}>{title}</div>
                    <div style={{
                      color: "#fdaf41",
                      fontSize: 13,
                      fontWeight: 400
                    }}>Today</div>
                  </div>
                ))}
            </div>
          </section>

          {/* --- Call to Action: Sign Up --- */}
          <section style={{
            margin: "0 auto 22px auto",
            textAlign: "center"
          }}>
            <div style={{
              fontWeight: 900,
              fontSize: "clamp(1.18rem,2vw,1.5rem)",
              color: "#fff",
              letterSpacing: "-1px",
              marginBottom: 7,
              textShadow: "0 2px 7px #1919400c"
            }}>Ready to get started?</div>
            <button
              onClick={() => setShowSignIn(true)}
              style={{
                background: `linear-gradient(90deg,${COLORS.accent} 18%,${COLORS.accent2} 90%)`,
                color: "#fff",
                border: "none",
                borderRadius: 7,
                fontWeight: 800,
                fontSize: 17,
                padding: "12px 28px",
                marginTop: 3,
                boxShadow: "0 2px 16px 0 #0002",
                cursor: "pointer"
              }}
            >
              Create your free account
            </button>
          </section>

          {/* --- Footer --- */}
          <footer style={{
            width: "100%",
            background: "#191929",
            borderRadius: 0,
            padding: "38px 0 24px 0",
            marginTop: 16,
            color: "#fff",
            opacity: 1
          }}>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              maxWidth: 1060,
              margin: "0 auto",
              justifyContent: "space-between",
              gap: 28
            }}>
              {/* LOGO + NAME */}
              <div style={{
                flex: "0 0 180px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
              }}>
                <img src="/logo.png" alt="FeelFlick" style={{
                  width: 44, height: 44, borderRadius: 11, marginBottom: 12
                }} />
                <span style={{
                  fontWeight: 800,
                  fontSize: 25,
                  letterSpacing: "-0.9px",
                  color: "#fff"
                }}>FeelFlick</span>
                <div style={{
                  color: "#fdaf41",
                  fontSize: 13,
                  marginTop: 3
                }}>Movies that match your mood.</div>
              </div>
              {/* COLUMNS */}
              <div style={{ flex: "1 1 110px" }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>The Basics</div>
                <div style={footerLinkStyle}>About</div>
                <div style={footerLinkStyle}>Contact</div>
                <div style={footerLinkStyle}>Careers</div>
              </div>
              <div style={{ flex: "1 1 120px" }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Legal</div>
                <div style={footerLinkStyle}>Privacy Policy</div>
                <div style={footerLinkStyle}>Terms of Use</div>
              </div>
              <div style={{ flex: "1 1 120px" }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Social</div>
                <div style={footerLinkStyle}>Instagram</div>
                <div style={footerLinkStyle}>TikTok</div>
                <div style={footerLinkStyle}>Facebook</div>
                <div style={footerLinkStyle}>LinkedIn</div>
              </div>
            </div>
            <div style={{
              textAlign: "center",
              color: "#fff",
              fontSize: 13,
              opacity: 0.3,
              marginTop: 28
            }}>
              © {new Date().getFullYear()} FeelFlick — Movies that match your mood.
            </div>
          </footer>
        </div>

        {/* Enable full page scroll */}
        <style>{`
          html, body, #root { height: 100%; width: 100%; margin: 0; }
          body { overflow-y: auto; }
        `}</style>
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
        background: COLORS.dark,
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
      </video>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(18,22,30,0.32)',
        zIndex: 1
      }} />

      {/* Top left: logo + title */}
      <div style={{
        position: 'absolute', top: 34, left: 40, zIndex: 3,
        display: 'flex', alignItems: 'center', gap: 13
      }}>
        <img
          src="/logo.png"
          alt="FeelFlick"
          style={{
            height: 48, width: 48,
            borderRadius: 12,
            boxShadow: "0 2px 12px #0003"
          }}
        />
        <span style={{
          fontSize: 31, fontWeight: 900,
          color: "#fff",
          letterSpacing: "-1.3px",
          textShadow: "0 1px 9px #19194028"
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
          borderRadius: 18,
          boxShadow: "0 8px 48px 0 #0007",
          padding: '43px 34px 30px 34px',
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          minHeight: 345
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 18, textAlign: 'center' }}>
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
        {error && <div style={{ color: COLORS.accent2, margin: '7px 0 1px 0', fontSize: 15, textAlign: 'center' }}>{error}</div>}
        <button
          type="submit"
          style={{
            marginTop: 16,
            background: `linear-gradient(90deg,${COLORS.accent} 15%,${COLORS.accent2} 90%)`,
            color: "#fff",
            border: 'none',
            borderRadius: 8,
            fontWeight: 800,
            fontSize: 18,
            padding: '11px 0',
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
      <footer style={{
        width: "100%",
        background: "#191929",
        borderRadius: 0,
        padding: "38px 0 24px 0",
        marginTop: 18,
        color: "#fff",
        opacity: 1,
        position: "absolute",
        left: 0, right: 0, bottom: 0
      }}>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          maxWidth: 1060,
          margin: "0 auto",
          justifyContent: "space-between",
          gap: 28
        }}>
          <div style={{
            flex: "0 0 180px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start"
          }}>
            <img src="/logo.png" alt="FeelFlick" style={{
              width: 44, height: 44, borderRadius: 11, marginBottom: 12
            }} />
            <span style={{
              fontWeight: 800,
              fontSize: 25,
              letterSpacing: "-0.9px",
              color: "#fff"
            }}>FeelFlick</span>
            <div style={{
              color: "#fdaf41",
              fontSize: 13,
              marginTop: 3
            }}>Movies that match your mood.</div>
          </div>
          <div style={{ flex: "1 1 110px" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>The Basics</div>
            <div style={footerLinkStyle}>About</div>
            <div style={footerLinkStyle}>Contact</div>
            <div style={footerLinkStyle}>Careers</div>
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Legal</div>
            <div style={footerLinkStyle}>Privacy Policy</div>
            <div style={footerLinkStyle}>Terms of Use</div>
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Social</div>
            <div style={footerLinkStyle}>Instagram</div>
            <div style={footerLinkStyle}>TikTok</div>
            <div style={footerLinkStyle}>Facebook</div>
            <div style={footerLinkStyle}>LinkedIn</div>
          </div>
        </div>
        <div style={{
          textAlign: "center",
          color: "#fff",
          fontSize: 13,
          opacity: 0.3,
          marginTop: 28
        }}>
          © {new Date().getFullYear()} FeelFlick — Movies that match your mood.
        </div>
      </footer>
    </div>
  )
}

// --- Shared link style for footer ---
const footerLinkStyle = {
  color: "#fff",
  opacity: 0.85,
  fontWeight: 400,
  marginBottom: 6,
  cursor: "pointer",
  textDecoration: "none",
  fontSize: 15,
  letterSpacing: "0"
}
