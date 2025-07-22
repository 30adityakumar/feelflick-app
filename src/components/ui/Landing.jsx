import { useNavigate } from "react-router-dom";
import TopNav from './TopNav'
import LandingHero from './LandingHero'
import WhyFeelFlick from './WhyFeelFlick'
import TrendingToday from './TrendingToday'
import CallToAction from './CallToAction'
import Footer from './Footer'

export default function Landing() {
  const navigate = useNavigate();

  const handleSignIn = () => navigate("/auth/sign-in");
  const handleSignUp = () => navigate("/auth/sign-up");

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

      {/* TopNav - keep it fixed and on top */}
      <div style={{ position: "relative", zIndex: 50 }}>
        <TopNav onSignIn={handleSignIn} />
      </div>

      {/* Hero Section - account for nav height */}
      <div style={{ position: "relative", zIndex: 5 }}>
        <LandingHero onGetStarted={handleSignUp} />
      </div>

      {/* The rest of your site */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <WhyFeelFlick />
        <TrendingToday onSignUp={handleSignUp} />
        <CallToAction onSignUp={handleSignUp} />
        <Footer />
      </div>
    </div>
  );
}
