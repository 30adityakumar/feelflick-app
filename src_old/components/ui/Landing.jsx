import { useNavigate } from "react-router-dom";
import TopNav from './TopNav';
import LandingHero from './LandingHero';
import WhyFeelFlick from './WhyFeelFlick';
import TrendingToday from './TrendingToday';
import CallToAction from './CallToAction';
import Footer from './Footer';

export default function Landing() {
  const navigate = useNavigate();

  const handleSignIn = () => navigate("/auth/sign-in");
  const handleSignUp = () => navigate("/auth/sign-up");

  return (
    <div className="w-screen min-h-screen bg-[#101015] overflow-x-hidden relative">
      {/* Background video (fixed) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/background-poster.jpg"
        className="fixed top-0 left-0 w-screen h-screen object-cover z-0 brightness-[0.54] blur-[0.6px]"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* Overlay for readability (fixed, over video) */}
      <div className="fixed inset-0 bg-[rgba(20,24,35,0.42)] z-[1] pointer-events-none" />

      {/* TopNav (fixed, always on top) */}
      <div className="relative z-[50]">
        <TopNav onSignIn={handleSignIn} />
      </div>

      {/* Hero section (sits above most content) */}
      <div className="relative z-[5]">
        <LandingHero onGetStarted={handleSignUp} />
      </div>

      {/* Rest of the landing page content */}
      <div className="relative z-[2]">
        <WhyFeelFlick />
        <TrendingToday onSignUp={handleSignUp} />
        <CallToAction onSignUp={handleSignUp} />
        <Footer />
      </div>
    </div>
  );
}
