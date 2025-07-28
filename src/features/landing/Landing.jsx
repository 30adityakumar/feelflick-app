import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import TopNav from '@/features/landing/components/TopNav'
import LandingHero from '@/features/landing/components/LandingHero'
import WhyFeelFlick from '@/features/landing/components/WhyFeelFlick'
import TrendingToday from '@/features/landing/components/TrendingToday'
import Footer from '@/features/landing/components/Footer'

export default function Landing() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/app", { replace: true });
      } else {
        setCheckingSession(false);
      }
    });
  }, [navigate]);

  // Use these functions for all navigation actions:
  const handleSignIn = () => navigate("/auth/sign-in");
  const handleSignUp = () => navigate("/auth/sign-up");

  // Optionally show a loader while checking session
  if (checkingSession) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#101015", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: "#101015", overflowX: "hidden", position: "relative" }}>
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/background-poster.jpg"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: 0,
          filter: "brightness(0.54) blur(0.6px)"
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      {/* Overlay for readability */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(20,24,35,0.42)',
          zIndex: 1,
          pointerEvents: "none"
        }}
      />

      {/* The rest of your site */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <TopNav onSignIn={handleSignIn} />
        <LandingHero onGetStarted={handleSignUp} />
        <WhyFeelFlick />
        <TrendingToday onSignUp={handleSignUp} />
        <Footer />
      </div>
    </div>
  );
}
