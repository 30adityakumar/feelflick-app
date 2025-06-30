import { useState } from 'react'
import { supabase } from './supabaseClient'

const COLORS = {
  accent: "#fe9245",
  accent2: "#eb423b",
  blue: "#18406d",
  dark: "#1a1d27",
  bg: "#17171f"
}

const trending = [
  { title: "Thunderbolts*", date: "02 May 2025", img: "/posters/thunderbolts.jpg", score: 74 },
  { title: "Squid Game", date: "17 Sep 2021", img: "/posters/squid-game.jpg", score: 79 },
  { title: "Revenged Love", date: "16 Jun 2025", img: "/posters/revenged-love.jpg", score: 69 },
  { title: "F1 The Movie", date: "27 Jun 2025", img: "/posters/f1-movie.jpg", score: 76 },
  { title: "Jurassic World Rebirth", date: "02 Jul 2025", img: "/posters/jurassic.jpg", score: 75 },
  { title: "Sinners", date: "18 Apr 2025", img: "/posters/sinners.jpg", score: 76 },
  { title: "Flourished Peony", date: "07 Jan 2025", img: "/posters/peony.jpg", score: 74 },
]

export default function AuthPage() {
  const [showSignIn, setShowSignIn] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Auth logic
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
    boxShadow: "0 1.5px 8px 0 #0004"
  }

  // ---- LANDING PAGE ----
  if (!showSignIn) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        overflowY: "auto",
        background: COLORS.bg,
        fontFamily: "Inter, system-ui, sans-serif"
      }}>
        {/* --- Video BG --- */}
        <video
          autoPlay loop muted playsInline
          poster="/background-poster.jpg"
          style={{
            position: "fixed", top: 0, left: 0, zIndex: 0,
            width: "100vw", height: "100vh",
            objectFit: "cover",
            filter: "brightness(0.62)"
          }}
          onEnded={e => e.currentTarget.pause()}
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>

        {/* --- Logo, Title, Sign In (absolutely positioned, NOT in black bar) --- */}
        <div style={{
          position: "fixed", top: 36, left: 38, right: 38, zIndex: 3,
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "calc(100vw - 76px)", pointerEvents: "none"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, pointerEvents: "auto" }}>
            <img src="/logo.png" alt="FeelFlick" style={{
              height: 44, width: 44, borderRadius: 12, boxShadow: "0 2px 8px #0003"
            }} />
            <span style={{
              fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-1.2px", textShadow: "0 1px 7px #19194044"
            }}>FeelFlick</span>
          </div>
          <button
            onClick={() => setShowSignIn(true)}
            style={{
              background: `linear-gradient(90deg,${COLORS.accent} 10%,${COLORS.accent2} 90%)`,
              color: "#fff", border: "none", borderRadius: 8,
              fontWeight: 700, fontSize: 18, padding: "9px 30px",
              boxShadow: "0 2px 8px #fe92451a", cursor: "pointer", pointerEvents: "auto"
            }}
          >SIGN IN</button>
        </div>

        {/* --- Hero Section --- */}
        <section style={{
          minHeight: "94vh", width: "100vw",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          zIndex: 1, position: "relative", paddingTop: 120, paddingBottom: 36
        }}>
          <div style={{
            textAlign: "center", maxWidth: 900, margin: "0 auto"
          }}>
            <div style={{
              fontWeight: 900, fontSize: "clamp(2.3rem,5vw,3.7rem)", color: "#fff",
              letterSpacing: "-1.2px", marginBottom: 18, textShadow: "0 2px 16px #000b, 0 4px 30px #000a"
            }}>
              Movies that match your mood.
            </div>
            <div style={{
              fontWeight: 400,
              fontSize: "clamp(1rem,1.2vw,1.2rem)",
              color: "#fff", opacity: 0.95, margin: "0 0 30px 0", lineHeight: 1.6,
              textShadow: "0 2px 8px #0002"
            }}>
              Get the perfect recommendation based on your taste and how you feel.<br />
              Fast, private, and always free.
            </div>
            <button
              onClick={() => setShowSignIn(true)}
              style={{
                background: `linear-gradient(90deg,${COLORS.accent} 10%,${COLORS.accent2} 90%)`,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 900,
                fontSize: 17,
                padding: "10px 28px",
                marginTop: 4,
                boxShadow: "0 2px 9px #0003",
                cursor: "pointer"
              }}
            >
              GET STARTED
            </button>
          </div>
        </section>

        {/* --- Why FeelFlick? (5 colored blocks, responsive row) --- */}
        <section style={{
          width: "100vw", background: "rgba(23,25,38,0.98)", padding: "50px 0 30px 0"
        }}>
          <div style={{
            maxWidth: 1200, margin: "0 auto", padding: "0 22px"
          }}>
            <div style={{
              fontWeight: 800, fontSize: "2.0rem", color: COLORS.accent,
              letterSpacing: "-1px", textAlign: "center", marginBottom: 30
            }}>Why FeelFlick?</div>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-between"
            }}>
              {[
                { icon: "🔒", label: "Private & Secure", desc: "Your data is safe. We never sell or share." },
                { icon: "🤖", label: "Smart Recs", desc: "AI-powered picks based on your taste and mood." },
                { icon: "🧘", label: "Mood Matching", desc: "Discover films that match your current mood." },
                { icon: "🎬", label: "Personal Tracker", desc: "Log everything you watch. Forever free." },
                { icon: "🪄", label: "Clean UI", desc: "Minimal, beautiful, distraction-free design." }
              ].map((f, i) => (
                <div key={i} style={{
                  flex: "1 1 180px", minWidth: 175, maxWidth: 220,
                  background: i === 1 ? COLORS.accent : (i === 2 ? COLORS.accent2 : COLORS.blue),
                  borderRadius: 16,
                  boxShadow: "0 2px 16px #0003",
                  padding: "22px 16px 19px 16px",
                  color: "#fff",
                  textAlign: "center",
                  margin: 0,
                  display: "flex", flexDirection: "column", alignItems: "center"
                }}>
                  <div style={{ fontSize: 34, marginBottom: 8 }}>{f.icon}</div>
                  <div style={{
                    fontWeight: 700, fontSize: "1.09rem", marginBottom: 8,
                    color: "#fff", letterSpacing: "-0.02em"
                  }}>{f.label}</div>
                  <div style={{
                    fontSize: 14, color: "#eef", opacity: 0.91, lineHeight: 1.38
                  }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Trending Today (carousel, posters) --- */}
        <section style={{
          maxWidth: 1160, margin: "35px auto 0 auto", padding: "0 18px"
        }}>
          <div style={{
            fontWeight: 800, fontSize: "1.4rem", color: "#fff",
            marginBottom: 14, letterSpacing: "-0.4px"
          }}>Trending Today</div>
          <div style={{
            display: "flex", gap: 18, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "thin"
          }}>
            {trending.map((m, i) => (
              <div key={i} style={{
                flex: "0 0 135px", display: "flex", flexDirection: "column",
                alignItems: "center", borderRadius: 16,
                background: "#232745", boxShadow: "0 2px 12px #0005",
                padding: "0 0 14px 0", marginBottom: 5
              }}>
                <img src={m.img} alt={m.title} style={{
                  width: 135, height: 196, objectFit: "cover",
                  borderRadius: 15, marginBottom: 6, boxShadow: "0 2px 12px #0009"
                }} />
                <div style={{
                  fontWeight: 800, color: "#fff", fontSize: "1.01rem", textAlign: "center", marginBottom: 2
                }}>{m.title}</div>
                <div style={{
                  color: "#d5d6e5", fontSize: 13, textAlign: "center"
                }}>{m.date}</div>
                <div style={{
                  background: COLORS.accent2, color: "#fff", borderRadius: "50%",
                  fontWeight: 800, width: 33, height: 33,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, marginTop: 7, boxShadow: "0 1.5px 8px #eb423b3d"
                }}>{m.score}</div>
              </div>
            ))}
          </div>
        </section>

        {/* --- Ready to get started band --- */}
        <section style={{
          maxWidth: 540, margin: "38px auto 0 auto",
          background: `linear-gradient(96deg, ${COLORS.accent} 40%, ${COLORS.accent2} 100%)`,
          borderRadius: 15, boxShadow: "0 2px 12px #0002",
          padding: "20px 18px 20px 18px", textAlign: "center"
        }}>
          <div style={{
            fontWeight: 900, color: "#fff", fontSize: 18, marginBottom: 10,
            letterSpacing: "-0.5px"
          }}>
            Ready to get started? <span style={{ color: "#fff" }}>Create your free account.</span>
          </div>
          <button
            onClick={() => setShowSignIn(true)}
            style={{
              marginTop: 3,
              background: "#fff",
              color: COLORS.accent2,
              border: "none",
              borderRadius: 7,
              fontWeight: 900,
              fontSize: 15,
              padding: "7px 18px",
              boxShadow: "0 1.5px 7px #0002",
              cursor: "pointer"
            }}
          >
            Create your free account
          </button>
        </section>

        {/* --- Footer (sticks to bottom, like Chexy/your reference) --- */}
        <footer style={{
          width: "100%", marginTop: 40,
          background: "#14192b", borderRadius: 0,
          padding: "38px 0 24px 0", color: "#fff"
        }}>
          <div style={{
            display: "flex", flexWrap: "wrap", maxWidth: 1040,
            margin: "0 auto", justifyContent: "space-between", gap: 32, padding: "0 10px"
          }}>
            <div style={{
              flex: "0 0 170px", display: "flex", flexDirection: "column", alignItems: "flex-start"
            }}>
              <img src="/logo.png" alt="FeelFlick" style={{
                width: 40, height: 40, borderRadius: 10, marginBottom: 7
              }} />
              <span style={{
                fontWeight: 800, fontSize: 21, letterSpacing: "-0.9px", color: "#fff"
              }}>FeelFlick</span>
              <div style={{
                color: "#fdaf41", fontSize: 13, marginTop: 2
              }}>Movies that match your mood.</div>
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <div style={{ fontWeight: 700, marginBottom: 7 }}>About us</div>
              <div style={footerLinkStyle}>Contact us</div>
              <div style={footerLinkStyle}>Careers</div>
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <div style={{ fontWeight: 700, marginBottom: 7 }}>Legal</div>
              <div style={footerLinkStyle}>Privacy Policy</div>
              <div style={footerLinkStyle}>Terms of use</div>
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <div style={{ fontWeight: 700, marginBottom: 7 }}>Social</div>
              <div style={footerLinkStyle}>Instagram</div>
              <div style={footerLinkStyle}>TikTok</div>
              <div style={footerLinkStyle}>Facebook</div>
              <div style={footerLinkStyle}>LinkedIn</div>
            </div>
          </div>
          <div style={{
            textAlign: "center", color: "#fff", fontSize: 13,
            opacity: 0.25, marginTop: 20
          }}>
            © {new Date().getFullYear()} FeelFlick — Movies that match your mood.
          </div>
        </footer>
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
        background: COLORS.bg,
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      {/* BG Video */}
      <video
        autoPlay loop muted playsInline poster="/background-poster.jpg"
        style={{
          position: "fixed", top: 0, left: 0,
          width: "100vw", height: "100vh",
          objectFit: "cover", zIndex: 0,
          filter: "brightness(0.7)"
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* Logo + Title top left */}
      <div style={{
        position: 'absolute', top: 36, left: 36, zIndex: 3,
        display: 'flex', alignItems: 'center', gap: 13
      }}>
        <img src="/logo.png" alt="FeelFlick" style={{
          height: 44, width: 44, borderRadius: 12, boxShadow: "0 2px 9px #0002"
        }} />
        <span style={{
          fontSize: 32, fontWeight: 900, color: "#fff",
          letterSpacing: "-1.2px", textShadow: "0 1px 7px #19194044"
        }}>FeelFlick</span>
      </div>

      {/* Sign in/up box centered */}
      <form
        onSubmit={handleAuth}
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 390,
          margin: "0 auto",
          marginTop: "10vh",
          background: "rgba(24, 26, 32, 0.78)",
          backdropFilter: "blur(9px)",
          borderRadius: 20,
          boxShadow: "0 8px 48px 0 #0008",
          padding: '42px 30px 27px 30px',
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          minHeight: 350
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 15, textAlign: 'center' }}>
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
            marginTop: 18,
            background: `linear-gradient(90deg,${COLORS.accent} 10%,${COLORS.accent2} 90%)`,
            color: "#fff",
            border: 'none',
            borderRadius: 8,
            fontWeight: 800,
            fontSize: 18,
            padding: '11px 0',
            boxShadow: '0 2px 11px 0 #fe924522',
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
          disabled={loading}
        >
          {loading ? (isSigningUp ? "Signing up..." : "Signing in...") : (isSigningUp ? "Sign Up" : "Sign In")}
        </button>
        <div style={{ color: "#aaa", margin: '15px 0 4px 0', textAlign: 'center', fontSize: 15 }}>
          {isSigningUp
            ? <>Already have an account? <span
                style={{ color: COLORS.accent, cursor: "pointer", fontWeight: 700 }}
                onClick={() => setIsSigningUp(false)}
              >Sign In</span></>
            : <>New to FeelFlick? <span
                style={{ color: COLORS.accent, cursor: "pointer", fontWeight: 700 }}
                onClick={() => setIsSigningUp(true)}
              >Sign up now.</span></>}
        </div>
      </form>
    </div>
  )
}

const footerLinkStyle = {
  color: "#fff",
  opacity: 0.75,
  fontSize: 15,
  cursor: "pointer",
  marginBottom: 7
}
