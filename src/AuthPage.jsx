import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const COLORS = {
  accent: "#fe9245",
  accent2: "#eb423b",
  blue: "#18406d",
  bg: "#191929"
}

export default function AuthPage() {
  const [showSignIn, setShowSignIn] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  // Demo trending movies (replace with TMDb fetch later)
  const trending = [
    { title: "Thunderbolts*", date: "02 May 2025", img: "/posters/thunderbolts.jpg", score: 74 },
    { title: "Squid Game", date: "17 Sep 2021", img: "/posters/squid-game.jpg", score: 79 },
    { title: "Revenged Love", date: "16 Jun 2025", img: "/posters/revenged-love.jpg", score: 69 },
    { title: "F1 The Movie", date: "27 Jun 2025", img: "/posters/f1-movie.jpg", score: 76 },
    { title: "Jurassic World Rebirth", date: "02 Jul 2025", img: "/posters/jurassic.jpg", score: 75 },
    { title: "Sinners", date: "18 Apr 2025", img: "/posters/sinners.jpg", score: 76 },
    { title: "Flourished Peony", date: "07 Jan 2025", img: "/posters/peony.jpg", score: 74 },
  ]

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

  // --- HERO + LANDING ---
  if (!showSignIn) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          background: COLORS.bg,
          overflow: 'auto'
        }}
      >
        {/* --- Background Video --- */}
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/background-poster.jpg"
          style={{
            position: "fixed",
            top: 0, left: 0, zIndex: 0,
            width: "100vw", height: "100vh",
            objectFit: "cover",
            filter: "brightness(0.63)"
          }}
          onEnded={e => e.currentTarget.pause()}
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>

        {/* --- Top Logo + Title + SIGN IN (no black bar) --- */}
        <div style={{
          position: "absolute", top: 36, left: 36, right: 40, zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.png" alt="FeelFlick" style={{
              height: 44, width: 44, borderRadius: 12, boxShadow: "0 2px 9px #0002"
            }} />
            <span style={{
              fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-1.2px", textShadow: "0 1px 7px #19194034"
            }}>FeelFlick</span>
          </div>
          <button
            onClick={() => setShowSignIn(true)}
            style={{
              background: `linear-gradient(90deg,${COLORS.accent} 10%,${COLORS.accent2} 90%)`,
              color: "#fff", border: "none", borderRadius: 9,
              fontWeight: 700, fontSize: 18, padding: "10px 30px",
              boxShadow: "0 2px 8px #fe92451a", cursor: "pointer"
            }}
          >SIGN IN</button>
        </div>

        {/* --- Hero Section (centered text, scrolls with page) --- */}
        <section style={{
          minHeight: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          position: "relative",
          zIndex: 1
        }}>
          <div style={{
            textAlign: "center",
            maxWidth: 900,
            margin: "0 auto",
            paddingTop: 70,
            paddingBottom: 20
          }}>
            <div style={{
              fontWeight: 900,
              fontSize: "clamp(2.4rem,6vw,3.9rem)",
              color: "#fff",
              letterSpacing: "-1.2px",
              marginBottom: 18,
              textShadow: "0 2px 18px #000b, 0 4px 40px #000a"
            }}>
              Movies that match your mood.
            </div>
            <div style={{
              fontWeight: 400,
              fontSize: "clamp(1.08rem,1.8vw,1.32rem)",
              color: "#fff",
              opacity: 0.94,
              marginTop: 8,
              marginBottom: 34,
              lineHeight: 1.5,
              textShadow: "0 2px 8px #0003"
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
                borderRadius: 7,
                fontWeight: 900,
                fontSize: 18,
                padding: "13px 34px",
                marginTop: 8,
                boxShadow: "0 2px 13px 0 #0004",
                cursor: "pointer"
              }}
            >
              GET STARTED
            </button>
          </div>
        </section>

        {/* --- Why FeelFlick (5 points in one row, shows after scroll) --- */}
        <section style={{
          width: "100vw", background: "rgba(20,22,36,0.96)",
          padding: "60px 0 40px 0", margin: 0
        }}>
          <div id="whyfeelflick" style={{
            maxWidth: 1080, margin: "0 auto", padding: "0 24px"
          }}>
            <div style={{
              fontWeight: 800, fontSize: "2.2rem", color: COLORS.accent,
              letterSpacing: "-1px", textAlign: "center", marginBottom: 32,
            }}>Why FeelFlick?</div>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 22,
              justifyContent: "space-between", alignItems: "stretch"
            }}>
              {[
                { icon: "🔒", label: "Private & Secure", desc: "Your data is safe. We never sell or share." },
                { icon: "🤖", label: "Smart Recs", desc: "AI-powered picks based on your taste and mood." },
                { icon: "🧘", label: "Mood Matching", desc: "Discover films that match your current mood." },
                { icon: "🎬", label: "Personal Tracker", desc: "Log everything you watch. Forever free." },
                { icon: "🪄", label: "Clean UI", desc: "Minimal, beautiful, distraction-free design." }
              ].map((f, i) => (
                <div key={i} style={{
                  flex: "1 1 180px", minWidth: 180,
                  background: "rgba(25,35,55,0.97)",
                  borderRadius: 17,
                  boxShadow: "0 2px 16px #0002",
                  padding: "24px 18px 20px 18px",
                  color: "#fff",
                  textAlign: "center",
                  margin: 0
                }}>
                  <div style={{ fontSize: 38, marginBottom: 8 }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: "1.18rem", marginBottom: 8, color: COLORS.accent }}>{f.label}</div>
                  <div style={{ fontSize: 15, color: "#eef", opacity: 0.86 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Trending Carousel (posters, as before) --- */}
        <section style={{
          maxWidth: 1120, margin: "46px auto 0 auto", padding: "0 20px"
        }}>
          <div style={{
            fontWeight: 800, fontSize: "1.6rem", color: "#fff",
            marginBottom: 17, letterSpacing: "-0.4px"
          }}>
            Trending Today
          </div>
          <div style={{
            display: "flex", gap: 18, overflowX: "auto",
            paddingBottom: 8, scrollbarWidth: "thin"
          }}>
            {trending.map((m, i) => (
              <div key={i} style={{
                flex: "0 0 155px", display: "flex", flexDirection: "column",
                alignItems: "center", borderRadius: 18,
                background: "#262748", boxShadow: "0 2px 16px #0003",
                padding: "0 0 16px 0", marginBottom: 6
              }}>
                <img src={m.img} alt={m.title} style={{
                  width: 155, height: 232, objectFit: "cover",
                  borderRadius: 17, marginBottom: 7,
                  boxShadow: "0 2px 12px #0008"
                }} />
                <div style={{
                  fontWeight: 800, color: "#fff", fontSize: "1.03rem", textAlign: "center", marginBottom: 2
                }}>{m.title}</div>
                <div style={{
                  color: "#d5d6e5", fontSize: 13, textAlign: "center"
                }}>{m.date}</div>
                <div style={{
                  background: COLORS.accent2, color: "#fff", borderRadius: "50%",
                  fontWeight: 800, width: 37, height: 37,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, marginTop: 7, boxShadow: "0 1.5px 8px #eb423b4d"
                }}>{m.score}</div>
              </div>
            ))}
          </div>
        </section>

        {/* --- Ready to get started band (highlight) --- */}
        <section style={{
          maxWidth: 620,
          margin: "40px auto 0 auto",
          background: `linear-gradient(96deg, ${COLORS.accent} 40%, ${COLORS.accent2} 100%)`,
          borderRadius: 16,
          boxShadow: "0 2px 16px #0002",
          padding: "30px 20px 28px 20px",
          textAlign: "center"
        }}>
          <div style={{
            fontWeight: 900, color: "#fff", fontSize: 21, marginBottom: 12, letterSpacing: "-0.5px"
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
              fontSize: 17,
              padding: "9px 28px",
              boxShadow: "0 1.5px 9px #0002",
              cursor: "pointer"
            }}
          >
            Create your free account
          </button>
        </section>

        {/* --- Footer like the reference, all links for marketing (non-working) --- */}
        <footer style={{
          width: "100%", marginTop: 38,
          background: "#14192b",
          borderRadius: 0,
          padding: "38px 0 28px 0",
          color: "#fff"
        }}>
          <div style={{
            display: "flex", flexWrap: "wrap", maxWidth: 1050, margin: "0 auto", justifyContent: "space-between", gap: 32
          }}>
            <div style={{
              flex: "0 0 180px", display: "flex", flexDirection: "column", alignItems: "flex-start"
            }}>
              <img src="/logo.png" alt="FeelFlick" style={{
                width: 41, height: 41, borderRadius: 11, marginBottom: 10
              }} />
              <span style={{
                fontWeight: 800, fontSize: 22, letterSpacing: "-0.9px", color: "#fff"
              }}>FeelFlick</span>
              <div style={{
                color: "#fdaf41", fontSize: 13, marginTop: 3
              }}>Movies that match your mood.</div>
            </div>
            <div style={{ flex: "1 1 110px" }}>
              <div style={{ fontWeight: 700, marginBottom: 7 }}>The Basics</div>
              <div style={footerLinkStyle}>About</div>
              <div style={footerLinkStyle}>Contact</div>
              <div style={footerLinkStyle}>Careers</div>
            </div>
            <div style={{ flex: "1 1 110px" }}>
              <div style={{ fontWeight: 700, marginBottom: 7 }}>Legal</div>
              <div style={footerLinkStyle}>Privacy Policy</div>
              <div style={footerLinkStyle}>Terms of Use</div>
            </div>
            <div style={{ flex: "1 1 110px" }}>
              <div style={{ fontWeight: 700, marginBottom: 7 }}>Social</div>
              <div style={footerLinkStyle}>Instagram</div>
              <div style={footerLinkStyle}>TikTok</div>
              <div style={footerLinkStyle}>Facebook</div>
              <div style={footerLinkStyle}>LinkedIn</div>
            </div>
          </div>
          <div style={{
            textAlign: "center", color: "#fff", fontSize: 13,
            opacity: 0.3, marginTop: 25
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
          filter: "brightness(0.68)"
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* Logo + Title top left (NO bar) */}
      <div style={{
        position: 'absolute', top: 36, left: 36, zIndex: 3,
        display: 'flex', alignItems: 'center', gap: 13
      }}>
        <img
          src="/logo.png"
          alt="FeelFlick"
          style={{
            height: 44, width: 44,
            borderRadius: 12,
            boxShadow: "0 2px 9px #0002"
          }}
        />
        <span style={{
          fontSize: 32, fontWeight: 900,
          color: "#fff",
          letterSpacing: "-1.2px",
          textShadow: "0 1px 7px #19194034"
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
            background: `linear-gradient(90deg,${COLORS.accent} 10%,${COLORS.accent2} 90%)`,
            color: "#fff",
            border: 'none',
            borderRadius: 9,
            fontWeight: 800,
            fontSize: 20,
            padding: '13px 0',
            boxShadow: '0 2px 12px 0 #fe924522',
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
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
        width: "100%", marginTop: 38,
        background: "#14192b",
        borderRadius: 0,
        padding: "38px 0 28px 0",
        color: "#fff",
        position: "absolute",
        bottom: 0
      }}>
        <div style={{
          display: "flex", flexWrap: "wrap", maxWidth: 1050, margin: "0 auto", justifyContent: "space-between", gap: 32
        }}>
          <div style={{
            flex: "0 0 180px", display: "flex", flexDirection: "column", alignItems: "flex-start"
          }}>
            <img src="/logo.png" alt="FeelFlick" style={{
              width: 41, height: 41, borderRadius: 11, marginBottom: 10
            }} />
            <span style={{
              fontWeight: 800, fontSize: 22, letterSpacing: "-0.9px", color: "#fff"
            }}>FeelFlick</span>
            <div style={{
              color: "#fdaf41", fontSize: 13, marginTop: 3
            }}>Movies that match your mood.</div>
          </div>
          <div style={{ flex: "1 1 110px" }}>
            <div style={{ fontWeight: 700, marginBottom: 7 }}>The Basics</div>
            <div style={footerLinkStyle}>About</div>
            <div style={footerLinkStyle}>Contact</div>
            <div style={footerLinkStyle}>Careers</div>
          </div>
          <div style={{ flex: "1 1 110px" }}>
            <div style={{ fontWeight: 700, marginBottom: 7 }}>Legal</div>
            <div style={footerLinkStyle}>Privacy Policy</div>
            <div style={footerLinkStyle}>Terms of Use</div>
          </div>
          <div style={{ flex: "1 1 110px" }}>
            <div style={{ fontWeight: 700, marginBottom: 7 }}>Social</div>
            <div style={footerLinkStyle}>Instagram</div>
            <div style={footerLinkStyle}>TikTok</div>
            <div style={footerLinkStyle}>Facebook</div>
            <div style={footerLinkStyle}>LinkedIn</div>
          </div>
        </div>
        <div style={{
          textAlign: "center", color: "#fff", fontSize: 13,
          opacity: 0.3, marginTop: 25
        }}>
          © {new Date().getFullYear()} FeelFlick — Movies that match your mood.
        </div>
      </footer>
    </div>
  )
}

const footerLinkStyle = {
  color: "#fff",
  opacity: 0.7,
  fontSize: 15,
  cursor: "pointer",
  marginBottom: 7
}
