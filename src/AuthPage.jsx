import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import TopNav from './components/TopNav'
import LandingHero from './components/LandingHero'
import FeelFlickManifesto from './components/FeelFlickManifesto'
import TrendingToday from './components/TrendingToday'
import CallToAction from './components/CallToAction'
import Footer from './components/Footer'
import SignInForm from './components/SignInForm'
import ScrollProgressBar from './components/ScrollProgressBar'
import BackToTopFAB from './components/BackToTopFAB'

const COLORS = {
  primary: "#18406d",   // Deep blue (from your logo)
  accent: "#fe9245",    // Bright orange (logo highlight)
  accent2: "#eb423b",   // Warm red/orange (logo accent)
  dark: "#101015",      // Page background (very dark, slightly blue/neutral)
  surface: "#232330",   // Card/surface background (dark gray, neutral)
  blueBg: "linear-gradient(90deg, #18406d 0%, #eb423b 120%)",   // For gradients
  mutedBg: "linear-gradient(120deg, #18406d 0%, #191925 70%, #fe9245 120%)",
  gold: "#fdaf41",      // For highlight text/subtle accents (from logo shadow)
  lightText: "#f9f9fa", // For text on dark bg
  border: "#27335b"     // For subtle borders, etc.
}


const SECTION_IDS = [
  "home",
  "why-feelflick",
  "trending-today",
  "get-started"
]

export default function AuthPage() {
  // ------- Auth and UI State -------
  const [showSignIn, setShowSignIn] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState("home")

  // ------- Auth handler -------
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

  // ------- Scroll to top and close sign-in -------
  const handleHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setShowSignIn(false)
    setTimeout(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0 }, 600)
  }

  // ------- Scroll to section (nav) -------
  const handleScrollToSection = useCallback((id) => {
    setShowSignIn(false)
    setTimeout(() => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 120)
  }, [])

  // ------- Scrollspy logic -------
  useEffect(() => {
    const handleSpy = () => {
      const scrollY = window.scrollY + 86 // nav height offset
      let current = "home"
      for (let id of SECTION_IDS) {
        const el = document.getElementById(id)
        if (el && el.offsetTop - 72 <= scrollY) {
          current = id
        }
      }
      setActiveSection(current)
    }
    window.addEventListener("scroll", handleSpy)
    return () => window.removeEventListener("scroll", handleSpy)
  }, [])

  // ------- Main render -------
  if (!showSignIn) {
    return (
      <div style={{
        minHeight: '100vh', width: '100vw', background: COLORS.dark,
        fontFamily: "Inter, system-ui, sans-serif", overflowX: "hidden", position: "relative"
      }}>
        <ScrollProgressBar />
        <BackToTopFAB />
        <video
          autoPlay loop muted playsInline poster="/background-poster.jpg"
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            objectFit: "cover", zIndex: 0, filter: "brightness(0.54) blur(0.6px)"
          }}
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        {/* Overlay */}
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(20,24,35,0.42)', zIndex: 1, pointerEvents: "none" 
        }} />

        <TopNav
          onSignIn={() => setShowSignIn(true)}
          onHome={handleHome}
          onScrollToSection={handleScrollToSection}
          activeSection={activeSection}
        />

        <div style={{ position: "relative", zIndex: 2 }}>
          <LandingHero onGetStarted={() => setShowSignIn(true)} />
          <section id="why-feelflick"><WhyFeelFlick /></section>
          <section id="trending-today"><TrendingToday /></section>
          <section id="get-started"><CallToAction onSignUp={() => setShowSignIn(true)} /></section>
          <Footer />
        </div>
      </div>
    )
  }

  // ------- SIGN IN/UP PAGE -------
  return (
    <div style={{
      minHeight: '100vh', width: '100vw', position: 'relative',
      background: COLORS.dark, fontFamily: "Inter, system-ui, sans-serif"
    }}>
      {/* BG Video */}
      <video
        autoPlay loop muted playsInline poster="/background-poster.jpg"
        style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          objectFit: "cover", zIndex: 0, filter: "brightness(0.62) blur(0.24px)"
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(18,22,30,0.32)', zIndex: 1, pointerEvents: "none" 
      }} />
      <TopNav
        onSignIn={() => setShowSignIn(false)}
        onHome={handleHome}
        onScrollToSection={handleScrollToSection}
        activeSection={activeSection}
      />
      <SignInForm
        isSigningUp={isSigningUp} setIsSigningUp={setIsSigningUp}
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        name={name} setName={setName}
        error={error} loading={loading} handleAuth={handleAuth} COLORS={COLORS}
      />
      <Footer />
    </div>
  )
}
