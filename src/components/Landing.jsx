// src/components/Landing.jsx

import TopNav from './TopNav'
import LandingHero from './LandingHero'
import WhyFeelFlick from './WhyFeelFlick'
import TrendingToday from './TrendingToday'
import CallToAction from './CallToAction'
import Footer from './Footer'

export default function Landing({ onSignIn, onSignUp }) {
  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: "#101015", overflowX: "hidden" }}>
      {/* Main nav bar at top */}
      <TopNav onSignIn={onSignIn} />
      
      {/* Hero section with Get Started */}
      <LandingHero onGetStarted={onSignUp} />
      
      {/* Why FeelFlick */}
      <WhyFeelFlick />

      {/* Trending Today (can pass onSignIn for modal "Get Started" buttons) */}
      <TrendingToday onSignIn={onSignIn} />
      
      {/* Call To Action section at bottom */}
      <CallToAction onSignUp={onSignUp} />

      {/* Footer */}
      <Footer />
    </div>
  );
}
