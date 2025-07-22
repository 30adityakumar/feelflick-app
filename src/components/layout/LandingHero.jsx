import { useNavigate } from "react-router-dom";

/**
 * HeroText with improved mobile positioning
 */
function HeroText() {
  const navigate = useNavigate();

  return (
    <div
      className="
        text-center max-w-[900px] mx-auto relative z-10 px-4 md:px-8
        absolute bottom-32 left-1/2 transform -translate-x-1/2
        md:top-1/2 md:bottom-auto md:-translate-y-1/2
        w-full
      "
    >
      <h1
        className="
          font-extrabold text-white
          text-[clamp(2.2rem,6vw,3.3rem)]
          mb-4
          leading-[1.11]
          tracking-tight
          drop-shadow-[0_4px_24px_#000c,0_2px_8px_#18406d77,0_0_1px_#fe924566]
        "
        style={{
          letterSpacing: "-1.1px",
          filter: "drop-shadow(0 1px 16px #eb423b22)",
        }}
      >
        Movies that match your mood.
      </h1>
      <p
        className="
          font-normal text-white opacity-95
          text-[clamp(1rem,1.2vw,1.25rem)] mb-8
          leading-[1.6]
          drop-shadow-[0_2px_8px_#0002]
        "
      >
        Get the perfect recommendation based on your taste and how you feel.
        <br />
        Fast, private, and always free.
      </p>
      <button
        type="button"
        className="
          bg-gradient-to-r from-orange-400 to-red-500
          text-white font-extrabold rounded-xl px-12 py-3
          text-[1.07rem] shadow-lg tracking-wide
          transition duration-150 ease-[cubic-bezier(.3,1.1,.3,1.03)]
          hover:scale-105 hover:shadow-[0_9px_26px_#eb423b52]
          active:scale-100
          focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400
          mx-auto mb-2
        "
        style={{
          letterSpacing: "0.02em",
          boxShadow: "0 3px 16px #eb423b28",
        }}
        onClick={() => navigate("/auth/sign-up")}
      >
        GET STARTED
      </button>
    </div>
  );
}

/**
 * HeroCurveSVG component: Decorative curved SVG at the bottom
 */
function HeroCurveSVG() {
  return (
    <div className="absolute left-0 bottom-0 w-full z-20 pointer-events-none leading-none">
      <svg
        viewBox="0 0 1920 140"
        width="100%"
        height="140"
        preserveAspectRatio="none"
        style={{ display: "block" }}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="fflick-gradient-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#367cff" stopOpacity="0" />
            <stop offset="10%" stopColor="#367cff" stopOpacity="1" />
            <stop offset="50%" stopColor="#eb423b" />
            <stop offset="90%" stopColor="#fe9245" stopOpacity="1" />
            <stop offset="100%" stopColor="#fe9245" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="fflick-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="7%" stopColor="white" stopOpacity="1" />
            <stop offset="93%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="fflick-gradient-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(20,16,12,0.99)" />
            <stop offset="70%" stopColor="rgba(20,16,12,0.99)" />
            <stop offset="100%" stopColor="rgba(15,12,8,1)" />
          </linearGradient>
          <mask id="fflick-fade-mask">
            <rect x="0" y="0" width="1920" height="140" fill="url(#fflick-fade)" />
          </mask>
        </defs>
        <path
          d="M0,136 Q960,85 1920,136"
          fill="none"
          stroke="url(#fflick-gradient-stroke)"
          strokeWidth="13"
          style={{ filter: "drop-shadow(0 3px 14px #eb423b33)" }}
          mask="url(#fflick-fade-mask)"
        />
        <path
          d="M0,136 Q960,85 1920,136 L1920,140 L0,140 Z"
          fill="url(#fflick-gradient-fill)"
          mask="url(#fflick-fade-mask)"
        />
      </svg>
    </div>
  );
}

/**
 * LandingHero: Simple relative container for absolute positioning
 */
export default function LandingHero() {
  return (
    <section
      className="
        w-screen h-screen
        relative bg-black/20 overflow-hidden
      "
    >
      <HeroText />
      <HeroCurveSVG />
    </section>
  );
}