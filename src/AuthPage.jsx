// src/AuthPage.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function AuthPage() {
  // ─── Local state ──────────────────────────────
  const [showSignIn, setShowSignIn] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [email,       setEmail]    = useState('')
  const [password,    setPassword] = useState('')
  const [name,        setName]     = useState('')
  const [error,       setError]    = useState(null)
  const [loading,     setLoading]  = useState(false)

  // ─── Trending state ────────────────────────────
  const [timeWindow,  setTimeWindow] = useState('day')    // 'day' | 'week'
  const [trending,    setTrending]   = useState([])

  // ─── Search term ───────────────────────────────
  const [searchTerm,  setSearchTerm]  = useState('')

  // ─── Fetch trending movies on mount & when timeWindow changes ───
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/movie/${timeWindow}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
        )
        const json = await res.json()
        setTrending(json.results.slice(0,12))
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [timeWindow])

  // ─── Handlers ─────────────────────────────────────
  const handleAuth = async e => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (isSigningUp) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name } }
      })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  const handleSearch = e => {
    e.preventDefault()
    alert(`Searching for “${searchTerm}”…`)
  }

  // ─── Shared Styles & Components ──────────────────
  const BRAND_DARK   = '#101015'
  const BRAND_LIGHT  = '#fff'
  const ACCENT_GRAD  = 'linear-gradient(90deg,#fe9245 30%,#eb423b 90%)'

  const wrapperStyle = {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    background: BRAND_DARK,
    color: BRAND_LIGHT,
    overflow: 'hidden',
    fontFamily: 'Inter, system-ui, sans-serif'
  }

  const topBarStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    padding: '16px 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 4,
    backdropFilter: 'blur(8px)',
    background: 'rgba(16,16,21,0.6)'
  }

  const scrollContainer = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    overflowY: 'auto'
  }

  const videoStyle = {
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw', height: '100vh',
    objectFit: 'cover',
    filter: 'brightness(0.6) blur(0.35px)',
    zIndex: 0
  }
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(18,22,30,0.34)',
    zIndex: 1,
    pointerEvents: 'none'
  }

  const Logo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <img src="/logo.png" alt="FeelFlick" style={{
        height: 48, width: 48,
        borderRadius: 10,
        boxShadow: '0 2px 12px #0004'
      }} />
      <span style={{
        fontSize: 24, fontWeight: 900,
        color: BRAND_LIGHT
      }}>FeelFlick</span>
    </div>
  )

  const button = {
    background: ACCENT_GRAD,
    color: BRAND_LIGHT,
    border: 'none',
    borderRadius: 8,
    padding: '8px 24px',
    fontWeight: 700,
    cursor: 'pointer'
  }

  const inputStyle = {
    padding: '12px 14px',
    borderRadius: 6,
    border: 'none',
    fontSize: '1rem',
    margin: '8px 0',
    outline: 'none'
  }

  const Footer = () => (
    <footer style={{
      padding: 24,
      textAlign: 'center',
      fontSize: 13,
      color: '#888'
    }}>
      © {new Date().getFullYear()} FeelFlick — Movies that match your mood.
    </footer>
  )

  // ─── If user clicked GET STARTED / SIGN IN → show your form ───
  if (showSignIn) {
    return (
      <div style={wrapperStyle}>
        <video
          autoPlay muted playsInline loop
          poster="/background-poster.jpg"
          style={videoStyle}
          onEnded={e => e.currentTarget.pause()}
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div style={overlayStyle} />

        <div style={topBarStyle}>
          <Logo />
        </div>

        <form onSubmit={handleAuth} style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 380,
          margin: '8vh auto',
          padding: 32,
          background: 'rgba(24,26,32,0.8)',
          backdropFilter: 'blur(6px)',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{ color: BRAND_LIGHT, textAlign: 'center', marginBottom:16 }}>
            {isSigningUp ? 'Sign Up' : 'Sign In'}
          </h2>

          {isSigningUp && (
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ ...inputStyle, background: '#232330', color: '#fff' }}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ ...inputStyle, background: '#232330', color: '#fff' }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ ...inputStyle, background: '#232330', color: '#fff' }}
            required
          />

          {error && (
            <div style={{ color: '#f66', marginTop:8, textAlign:'center' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...button,
              marginTop: 16,
              fontSize: 18,
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading
              ? isSigningUp ? 'Signing up…' : 'Signing in…'
              : isSigningUp ? 'Sign Up'     : 'Sign In'
            }
          </button>

          <p style={{ textAlign:'center', marginTop:14, fontSize: 14, color:'#aaa' }}>
            {isSigningUp
              ? <>Already have an account? <span onClick={()=>setIsSigningUp(false)} style={{ color:'#fe9245', cursor:'pointer' }}>Sign In</span></>
              : <>New here? <span onClick={()=>setIsSigningUp(true)} style={{ color:'#fe9245', cursor:'pointer' }}>Create account</span></>
            }
          </p>
        </form>

        <Footer />
      </div>
    )
  }

  // ─── FULL LANDING PAGE ─────────────────────────────
  return (
    <div style={wrapperStyle}>
      <video
        autoPlay muted playsInline loop
        poster="/background-poster.jpg"
        style={videoStyle}
        onEnded={e => e.currentTarget.pause()}
      >
        <source src="/background.mp4" type="video/mp4"/>
      </video>
      <div style={overlayStyle} />

      {/* Sticky Top Bar */}
      <div style={topBarStyle}>
        <Logo />
        <button onClick={()=>setShowSignIn(true)} style={button}>
          SIGN IN
        </button>
      </div>

      {/* Scrollable Content */}
      <div style={scrollContainer}>

        {/* Hero (100vh) */}
        <section style={{
          height: '100vh',
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          justifyContent:'center',
          textAlign:'center',
          padding:'0 24px'
        }}>
          <h1 style={{
            fontSize:'clamp(2rem,6vw,3rem)',
            fontWeight:900,
            marginBottom:12,
            color: BRAND_LIGHT,
            textShadow:'0 2px 18px #000b'
          }}>
            Movies that match your mood.
          </h1>
          <p style={{
            fontSize:'clamp(0.9rem,2vw,1.2rem)',
            color: BRAND_LIGHT,
            opacity:0.9,
            lineHeight:1.5,
            marginBottom:24,
          }}>
            Get the perfect recommendation based on your taste and how you feel.<br/>
            Fast, private, and always free.
          </p>
          <button
            onClick={()=>setShowSignIn(true)}
            style={{ ...button, fontSize:18, padding:'12px 32px' }}
          >
            GET STARTED
          </button>
        </section>

        {/* Features */}
        <section style={{
          background: BRAND_DARK,
          color: BRAND_LIGHT,
          padding:'60px 24px',
          textAlign:'center'
        }}>
          <h2 style={{ fontSize:'1.8rem', marginBottom:24 }}>Why FeelFlick?</h2>
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
            gap:24,
            maxWidth:800,
            margin:'0 auto'
          }}>
            {[
              ['🎯','Personalized Picks','Movies & shows you’ll actually love.'],
              ['📊','Track Your Watch','Log everything you’ve seen.'],
              ['🔒','Private & Secure','We never sell your data.'],
              ['💸','Always Free','No ads, no subscription.']
            ].map(([icon, title, desc], i) => (
              <div key={i} style={{
                background:'#232330',
                borderRadius:12,
                padding:20,
                minHeight:140,
                display:'flex',
                flexDirection:'column',
                alignItems:'center',
                justifyContent:'center'
              }}>
                <div style={{ fontSize:'1.8rem', marginBottom:12 }}>{icon}</div>
                <h3 style={{ fontSize:'1rem', margin:'0 0 6px' }}>{title}</h3>
                <p style={{ fontSize:'0.85rem', color:'#aaa', lineHeight:1.3 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trending */}
        <section style={{
          background: BRAND_DARK,
          color: BRAND_LIGHT,
          padding:'60px 24px'
        }}>
          <h2 style={{ fontSize:'1.8rem', marginBottom:16 }}>Trending</h2>
          <div style={{ marginBottom:16 }}>
            {['day','week'].map(w => (
              <button
                key={w}
                onClick={()=>setTimeWindow(w)}
                style={{
                  marginRight:8,
                  padding:'6px 14px',
                  borderRadius:999,
                  border: timeWindow===w ? 'none' : '1px solid #444',
                  background: timeWindow===w ? '#fe9245' : 'transparent',
                  color: timeWindow===w ? '#101015' : '#ccc',
                  cursor:'pointer',
                  fontSize:'0.9rem'
                }}
              >
                {w==='day'? 'Today':'This Week'}
              </button>
            ))}
          </div>
          <div style={{
            display:'flex',
            overflowX:'auto',
            gap:16,
            paddingBottom:8
          }}>
            {trending.map(m => (
              <div key={m.id} style={{
                flex:'0 0 auto',
                width:140,
                borderRadius:8,
                overflow:'hidden',
                background:'#232330',
                boxShadow:'0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <img
                  src={m.poster_path
                    ? `https://image.tmdb.org/t/p/w300${m.poster_path}`
                    : '/no-image.png'
                  }
                  alt={m.title}
                  style={{ width:'100%', display:'block' }}
                />
                <div style={{ padding:8 }}>
                  <p style={{
                    margin:0,
                    fontSize:'0.9rem',
                    fontWeight:600,
                    lineHeight:1.2,
                    whiteSpace:'nowrap',
                    overflow:'hidden',
                    textOverflow:'ellipsis'
                  }}>
                    {m.title}
                  </p>
                  <p style={{
                    margin:0,
                    fontSize:'0.75rem',
                    color:'#bbb'
                  }}>
                    {new Date(m.release_date)
                      .toLocaleDateString(undefined,{
                        year:'numeric',month:'short',day:'numeric'
                      })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Search Promo */}
        <section style={{
          background:'#18181b',
          color:BRAND_LIGHT,
          padding:'60px 24px',
          textAlign:'center'
        }}>
          <h2 style={{ fontSize:'1.8rem', marginBottom:16 }}>
            Search millions of titles
          </h2>
          <form onSubmit={handleSearch} style={{
            display:'flex',
            justifyContent:'center',
            alignItems:'center',
            gap:8,
            flexWrap:'wrap'
          }}>
            <input
              type="text"
              placeholder="Search for a movie, TV show, or person…"
              value={searchTerm}
              onChange={e=>setSearchTerm(e.target.value)}
              style={{
                flex:'1 1 300px',
                maxWidth:600,
                ...inputStyle,
                background:'#232330',
                color:'#fff'
              }}
            />
            <button type="submit" style={{
              ...button,
              background:'linear-gradient(to right,#00cc99,#0066cc)'
            }}>
              Search
            </button>
          </form>
        </section>

        {/* Final CTA */}
        <section style={{
          background:BRAND_DARK,
          color:BRAND_LIGHT,
          padding:'60px 24px',
          textAlign:'center'
        }}>
          <h2 style={{ fontSize:'1.8rem', marginBottom:16 }}>
            Ready to get started?
          </h2>
          <button
            onClick={()=>setShowSignIn(true)}
            style={{ ...button, fontSize:'1rem', padding:'12px 24px' }}
          >
            Create Your Account
          </button>
        </section>

        <Footer />
      </div>
    </div>
  )
}
