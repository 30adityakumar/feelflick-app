// src/AuthPage.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function AuthPage() {
  // ─── Local state ────────────────────────────
  const [showSignIn, setShowSignIn] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [name,        setName]        = useState('')
  const [error,       setError]       = useState(null)
  const [loading,     setLoading]     = useState(false)

  // ─── Trending state ──────────────────────────
  const [timeWindow,  setTimeWindow]  = useState('day')    // 'day' or 'week'
  const [trending,    setTrending]    = useState([])

  // ─── Search state ───────────────────────────
  const [searchTerm,  setSearchTerm]  = useState('')

  // ─── Fetch trending movies whenever timeWindow changes ─────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/movie/${timeWindow}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
        )
        const json = await res.json()
        setTrending(json.results.slice(0,12))
      } catch (e) {
        console.error('Failed to fetch trending', e)
      }
    }
    load()
  }, [timeWindow])

  // ─── Handlers ────────────────────────────────────
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

  const handleSearch = e => {
    e.preventDefault()
    // TODO: wire up to actual search results
    alert(`Search: ${searchTerm}`)
  }

  // ─── Shared styles ─────────────────────────────
  const inputStyle = {
    padding: '10px 12px',
    borderRadius: 6,
    border: 'none',
    fontSize: '1rem',
    outline: 'none',
    margin: '8px 0',
  }
  const buttonStyle = {
    background: 'linear-gradient(to right,#fe9245,#eb423b)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 0',
    fontWeight: 700,
    cursor: 'pointer',
  }
  const linkStyle = {
    color: '#fe9245',
    cursor: 'pointer',
    textDecoration: 'underline',
  }
  const toggleBtn = {
    padding: '6px 14px',
    borderRadius: 999,
    border: '1px solid #003366',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginRight: 8
  }

  // ─── If user has clicked “Sign In / Get Started” ─────────────
  if (showSignIn) {
    return (
      <div style={wrapperStyle}>
        <VideoBg />
        <div style={overlayStyle} />

        {/* Logo */}
        <div style={logoStyle}>
          <Logo />
        </div>

        {/* Sign In / Sign Up Form */}
        <form onSubmit={handleAuth} style={formStyle}>
          <h2 style={formHeaderStyle}>{isSigningUp ? 'Sign Up' : 'Sign In'}</h2>
          {isSigningUp && (
            <input
              type="text" placeholder="Your Name"
              value={name} onChange={e => setName(e.target.value)}
              style={inputStyle} required
            />
          )}
          <input
            type="email" placeholder="Email address"
            value={email} onChange={e => setEmail(e.target.value)}
            style={inputStyle} required
          />
          <input
            type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)}
            style={inputStyle} required
          />
          {error && <div style={{ color:'#f66', textAlign:'center' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            ...buttonStyle,
            fontSize: 18,
            marginTop: 12,
            opacity: loading ? 0.6 : 1
          }}>
            {loading
              ? isSigningUp ? 'Signing up…' : 'Signing in…'
              : isSigningUp ? 'Sign Up'      : 'Sign In'
            }
          </button>
          <p style={{ fontSize:'0.9rem', textAlign:'center', marginTop:14 }}>
            {isSigningUp
              ? <>Already have an account? <span style={linkStyle} onClick={()=>setIsSigningUp(false)}>Sign In</span></>
              : <>New here? <span style={linkStyle} onClick={()=>setIsSigningUp(true)}>Create Account</span></>
            }
          </p>
        </form>

        <Footer />
      </div>
    )
  }

  // ─── Landing page (scrollable) ─────────────────────────────
  return (
    <div style={{ ...wrapperStyle, overflowY: 'auto', scrollSnapType: 'y mandatory' }}>

      {/* Hero (full‐screen) */}
      <section style={sectionSnap}>
        <VideoBg />
        <div style={overlayStyle} />

        <div style={topBarStyle}>
          <Logo />
          <button onClick={()=>setShowSignIn(true)} style={topSignInStyle}>SIGN IN</button>
        </div>

        <div style={heroContentStyle}>
          <h1 style={heroTitleStyle}>Movies that match your mood.</h1>
          <p style={heroSubtitleStyle}>
            Get the perfect recommendation based on your taste and how you feel.<br/>
            Fast, private, and always free.
          </p>
          <button onClick={()=>setShowSignIn(true)} style={{ ...buttonStyle, fontSize:18, padding:'14px 32px' }}>
            GET STARTED
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ ...sectionSnap, padding:'80px 24px', background:'#fff', color:'#111', textAlign:'center' }}>
        <h2 style={{ fontSize:'2rem', marginBottom:24 }}>Why FeelFlick?</h2>
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',
          gap:24,
          maxWidth:800,
          margin:'0 auto'
        }}>
          {[
            ['🎯','Personalized Picks','Movies & shows you’ll actually love.'],
            ['📊','Track Your Watch','Log everything you’ve seen.'],
            ['🔒','Private & Clean','We never sell your data.'],
            ['💸','Always Free','No ads, no subscription.']
          ].map(([icon, title, desc], i) => (
            <div key={i} style={{padding:24, borderRadius:12, boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
              <div style={{fontSize:'2rem', marginBottom:12}}>{icon}</div>
              <h3 style={{fontSize:'1.2rem', margin:'0 0 8px'}}>{title}</h3>
              <p style={{fontSize:'0.95rem', color:'#555', lineHeight:1.3}}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section style={{ ...sectionSnap, padding:'60px 24px', background:'#f9f9f9' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <h2 style={{fontSize:'1.8rem', marginBottom:16}}>Trending</h2>
          <div style={{ marginBottom:16 }}>
            {['day','week'].map(w => (
              <button key={w}
                onClick={()=>setTimeWindow(w)}
                style={{
                  ...toggleBtn,
                  background: timeWindow===w?'#003366':'#fff',
                  color:       timeWindow===w?'#0f9':'#003366'
                }}
              >
                {w==='day'?'Today':'This Week'}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', overflowX:'auto', gap:16, paddingBottom:8 }}>
            {trending.map(m => (
              <div key={m.id} style={{ flex:'0 0 auto', width:140, borderRadius:8, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', position:'relative' }}>
                <img
                  src={m.poster_path ? `https://image.tmdb.org/t/p/w300${m.poster_path}` : '/no-image.png'}
                  alt={m.title}
                  style={{ width:'100%', display:'block' }}
                />
                <div style={{
                  position:'absolute', top:6, right:6,
                  background:'rgba(0,0,0,0.6)', color:'#fff',
                  borderRadius:'50%', width:32, height:32,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'0.8rem'
                }}>
                  {Math.round(m.vote_average*10)}%
                </div>
                <div style={{ background:'#fff', padding:6 }}>
                  <p style={{ margin:0, fontSize:'0.9rem', fontWeight:600, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {m.title}
                  </p>
                  <p style={{ margin:0, fontSize:'0.75rem', color:'#666' }}>
                    {new Date(m.release_date).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search */}
      <section style={{ ...sectionSnap, position:'relative', height:360, background:`url(/search-bg.jpg) center/cover no-repeat` }}>
        <div style={{position:'absolute',inset:0,background:'rgba(0,0,50,0.4)'}}/>
        <div style={{position:'relative',zIndex:1,top:'30%',textAlign:'center',color:'#fff',padding:'0 24px'}}>
          <h2 style={{fontSize:'2.4rem',marginBottom:12}}>
            Millions of movies, TV shows & people to discover.
          </h2>
          <form onSubmit={handleSearch} style={{display:'flex',justifyContent:'center',gap:8,marginTop:16}}>
            <input
              type="text" placeholder="Search for a movie, TV show or person…"
              value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
              style={{
                flex:1,maxWidth:600,padding:'12px 16px',
                borderRadius:999,border:'none',fontSize:'1rem',outline:'none'
              }}
            />
            <button type="submit" style={{
              ...buttonStyle,background:'linear-gradient(to right,#00cc99,#0066cc)',
              padding:'12px 24px'
            }}>Search</button>
          </form>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ ...sectionSnap, padding:'60px 24px', textAlign:'center' }}>
        <h2 style={{fontSize:'2rem',marginBottom:16}}>Ready to get started?</h2>
        <button onClick={()=>setShowSignIn(true)} style={{...buttonStyle,fontSize:'1.2rem',padding:'14px 28px'}}>
          Create Your Account
        </button>
      </section>

      <Footer />
    </div>
  )
}

// ─── LOW-LEVEL / REUSABLE ──────────────────────────────────

const wrapperStyle = {
  minHeight:'100vh',
  width:'100vw',
  position:'relative',
  background:'#101015',
  fontFamily: 'Inter,system-ui,sans-serif',
}

const sectionSnap = {
  scrollSnapAlign: 'start'
}

const overlayStyle = {
  position:'fixed', inset:0,
  background:'rgba(18,22,30,0.34)',
  zIndex:1,
  pointerEvents:'none'
}

const VideoBg = () => (
  <video
    autoPlay muted playsInline
    poster="/background-poster.jpg"
    style={{
      position:'fixed', top:0, left:0, width:'100vw', height:'100vh',
      objectFit:'cover', zIndex:0,
      filter:'brightness(0.6) blur(0.35px)'
    }}
    onEnded={e=>e.currentTarget.pause()}
  >
    <source src="/background.mp4" type="video/mp4" />
  </video>
)

const Logo = () => (
  <>
    <img src="/logo.png" alt="FeelFlick" style={{
      height:54,width:54,borderRadius:12,boxShadow:'0 2px 12px #0004'
    }}/>
    <span style={{
      fontSize:36, fontWeight:900, color:'#fff',
      letterSpacing:'-1.5px', textShadow:'0 1px 10px #000a'
    }}>
      FeelFlick
    </span>
  </>
)

const Footer = () => (
  <footer style={{
    textAlign:'center',fontSize:'0.85rem',color:'#888',
    padding:'24px'
  }}>
    © {new Date().getFullYear()} FeelFlick — All rights reserved.
  </footer>
)

const topBarStyle = {
  position:'absolute', top:34, left:40, right:40, zIndex:3,
  display:'flex',alignItems:'center',justifyContent:'space-between'
}

const topSignInStyle = {
  background:'linear-gradient(90deg,#fe9245 30%,#eb423b 90%)',
  color:'#fff',border:'none',borderRadius:8,
  fontWeight:700,fontSize:18,padding:'9px 30px',
  boxShadow:'0 2px 8px #fe924522',cursor:'pointer'
}

const formStyle = {
  position:'relative',zIndex:2,
  maxWidth:400, margin:'0 auto', marginTop:'11vh',
  background:'rgba(24,26,32,0.74)',backdropFilter:'blur(9px)',
  borderRadius:20,boxShadow:'0 8px 48px 0 #0008',
  padding:'46px 38px 32px', display:'flex',
  flexDirection:'column',alignItems:'stretch',
  minHeight:370
}

const formHeaderStyle = {
  fontSize:30, fontWeight:900, color:'#fff', marginBottom:18, textAlign:'center'
}

const logoStyle = {
  position:'absolute', top:34, left:40, zIndex:3,
  display:'flex',alignItems:'center',gap:18
}

const heroContentStyle = {
  position:'relative', zIndex:2,
  display:'flex',flexDirection:'column',
  alignItems:'center',justifyContent:'center',
  height:'100vh'
}

const heroTitleStyle = {
  fontWeight:900,
  fontSize:'clamp(1.7rem,4vw,3rem)',
  lineHeight:1.15,
  color:'#fff',
  letterSpacing:'-1.1px',
  marginBottom:10,
  textShadow:'0 2px 18px #000b,0 4px 40px #000a',
  textAlign:'center',
}

const heroSubtitleStyle = {
  fontWeight:400,
  fontSize:'clamp(0.9rem,2vw,1.1rem)',
  color:'#fff',
  opacity:0.93,
  margin:'8px 0 28px',
  lineHeight:1.6,
  textAlign:'center'
}
