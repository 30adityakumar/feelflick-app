import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from './supabaseClient'
import TopNav from './components/TopNav'
import LandingHero from './components/LandingHero'
import WhyFeelFlick from './components/WhyFeelFlick'
import TrendingToday from './components/TrendingToday'
import CallToAction from './components/CallToAction'
import Footer from './components/Footer'
import SignInForm from './components/SignInForm'
import ScrollProgressBar from './components/ScrollProgressBar'
import BackToTopFAB from './components/BackToTopFAB'

const COLORS = {
  primary: "#18406d",
  accent: "#fe9245",
  accent2: "#eb423b",
  dark: "#101015",
  surface: "#232330",
  blueBg: "linear-gradient(90deg, #18406d 0%, #eb423b 120%)",
  mutedBg: "linear-gradient(120deg, #18406d 0%, #191925 70%, #fe9245 120%)",
  gold: "#fdaf41",
  lightText: "#f9f9fa",
  border: "#27335b"
};

const SECTION_IDS = [
  "home",
  "why-feelflick",
  "trending-today",
  "get-started"
];

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Detect sign-up or sign-in route
  const isSignUpPath = location.pathname.endsWith("/sign-up");
  const isSignInPath = location.pathname.endsWith("/sign-in");

  // Auth/UI state
  const [isSigningUp, setIsSigningUp] = useState(isSignUpPath);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Keep mode in sync with URL
  useEffect(() => {
    if (isSignUpPath) setIsSigningUp(true);
    if (isSignInPath) setIsSigningUp(false);
  }, [isSignUpPath, isSignInPath]);

  // Auth handler
  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (isSigningUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  // Scroll helpers
  const handleHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0 }, 600)
  }

  const handleScrollToSection = useCallback((id) => {
    setTimeout(() => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 120)
  }, []);

  useEffect(() => {
    const handleSpy = () => {
      const scrollY = window.scrollY + 86;
      let current = "home";
      for (let id of SECTION_IDS) {
        const el = document.getElementById(id)
        if (el && el.offsetTop - 72 <= scrollY) {
          current = id
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleSpy);
    return () => window.removeEventListener("scroll", handleSpy);
  }, []);

  // ------- RENDER -------
  // If on sign-up or sign-in page, show ONLY the form (no hero/marketing)
  if (isSignUpPath || isSignInPath) {
    return (
      <div style={{
        minHeight: '100vh', width: '100vw', position: 'relative',
        background: COLORS.dark, fontFamily: "Inter, system-ui, sans-serif"
      }}>
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
          onSignIn={() => navigate('/auth/sign-in')}
          onHome={handleHome}
          onScrollToSection={handleScrollToSection}
          activeSection={activeSection}
        />
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <SignInForm
            isSigningUp={isSigningUp}
            setIsSigningUp={setIsSigningUp}
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            name={name} setName={setName}
            error={error} loading={loading} handleAuth={handleAuth} COLORS={COLORS}
          />
          {/* Switch link */}
          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 15 }}>
            {isSigningUp ? (
              <>
                Already have an account?{" "}
                <span
                  style={{ color: "#fe9245", cursor: "pointer", fontWeight: 700 }}
                  onClick={() => { setIsSigningUp(false); navigate('/auth/sign-in'); }}
                >
                  Sign in
                </span>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <span
                  style={{ color: "#fe9245", cursor: "pointer", fontWeight: 700 }}
                  onClick={() => { setIsSigningUp(true); navigate('/auth/sign-up'); }}
                >
                  Sign up
                </span>
              </>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Otherwise show full marketing/landing page
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
        onSignIn={() => navigate('/auth/sign-in')}
        onHome={handleHome}
        onScrollToSection={handleScrollToSection}
        activeSection={activeSection}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        <LandingHero onGetStarted={() => navigate('/auth/sign-up')} />
        <section id="why-feelflick"><WhyFeelFlick /></section>
        <section id="trending-today"><TrendingToday /></section>
        <section id="get-started"><CallToAction onSignUp={() => navigate('/auth/sign-up')} /></section>
        <Footer />
      </div>
    </div>
  );
}
