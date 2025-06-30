import { useState } from 'react'
import { supabase } from './supabaseClient'
import TopNav from './components/TopNav'
import LandingHero from './components/LandingHero'
import WhyFeelFlick from './components/WhyFeelFlick'
import TrendingToday from './components/TrendingToday'
import CallToAction from './components/CallToAction'
import Footer from './components/Footer'
import SignInForm from './components/SignInForm'

const COLORS = {
  primary: "#18406d",
  accent: "#fe9245",
  accent2: "#eb423b",
  dark: "#101015",
  surface: "#232330"
}

export default function AuthPage() {
  const [showSignIn, setShowSignIn] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // --- Always scrolls to top and closes sign-in, even if already on landing
  const handleHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setShowSignIn(false)
    // Fallback for mobile/Safari: force scroll after animation
    setTimeout(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0 }, 500)
  }

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

  // Landing experience
  if (!showSignIn) {
    return (
      <div style={{
        minHeight: '100vh', width: '100vw', background: COLORS.dark,
        fontFamily: "Inter, system-ui, sans-serif", overflowX: "hidden", position: "relative"
      }}>
        {/* BG Video */}
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
        />

        <div style={{ position: "relative", zIndex: 2 }}>
          <LandingHero onGetStarted={() => setShowSignIn(true)} />
          <WhyFeelFlick />
          <TrendingToday />
          <CallToAction onSignUp={() => setShowSignIn(true)} />
          <Footer />
        </div>
      </div>
    )
  }

  // SIGN IN/UP PAGE
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
