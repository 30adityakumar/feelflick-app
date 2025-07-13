import { useNavigate } from "react-router-dom";
import TopNav from "@/shared/ui/TopNav";
import LandingHero from "@/features/onboarding/components/LandingHero";
import WhyFeelFlick from "@/features/onboarding/components/WhyFeelFlick";
import TrendingToday from "@/features/recommendations/components/TrendingToday";
import CallToAction from "@/features/onboarding/components/CallToAction";
import Footer from "@/shared/ui/Footer";

export default function Landing() {
  const navigate = useNavigate();

  const handleSignIn  = () => navigate("/auth/sign-in");
  const handleSignUp  = () => navigate("/auth/sign-up");

  return (
    <div className="relative min-h-screen w-full bg-[#101015] overflow-x-hidden">
      {/* ---------- Background video ---------- */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/background-poster.jpg"
        className="fixed inset-0 h-full w-full object-cover z-0"
        style={{ filter: "brightness(0.54) blur(0.6px)" }}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* ---------- Dark overlay for readability ---------- */}
      <div
        className="fixed inset-0 bg-[rgba(20,24,35,0.42)] pointer-events-none z-10"
      />

      {/* ---------- Top navigation (always on top) ---------- */}
      <TopNav />  {/* TopNav already has `fixed z-50 inset-x-0 top-0` */}

      {/* ---------- Landing content ---------- */}
      <main className="relative z-20 flex flex-col items-center w-full pt-24 pb-14">
        <LandingHero onGetStarted={handleSignUp} />
        <WhyFeelFlick />
        <TrendingToday onSignUp={handleSignUp} />
        <CallToAction onSignUp={handleSignUp} />
        <Footer />
      </main>
    </div>
  );
}
