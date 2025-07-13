import { useNavigate } from "react-router-dom";
import logo from "@assets/images/logo.png"; // Your logo image (via Vite alias)

/**
 * TopNav component for FeelFlick
 * Responsive, accessible, and future-proof with Tailwind CSS
 * To tweak: just change color class names, gap, size, etc. in JSX below
 */
export default function TopNav() {
  const navigate = useNavigate();

  return (
    // HEADER: Semantic tag, sticky at top
    <header
      role="banner"
      className="
        fixed top-3 left-3 right-3 z-50
        flex items-center justify-between
        rounded-xl bg-peach-100/90 shadow-lg backdrop-blur-md
        px-3 py-2
        sm:top-5 sm:left-5 sm:right-5 sm:px-6
        md:top-8 md:left-8 md:right-8
        transition-all
      "
    >
      {/* LOGO + BRAND */}
      <button
        onClick={() => navigate("/")}
        className="
          flex items-center gap-3 group
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
        "
        aria-label="Go to FeelFlick home page"
      >
        {/* LOGO: Tweak sizes for tap target */}
        <img
          src={logo}
          alt="FeelFlick"
          className="
            h-8 w-8 rounded-lg shadow-sm
            sm:h-10 sm:w-10
            lg:h-12 lg:w-12
            group-hover:scale-105 transition-transform
          "
        />
        {/* TEXT: Brand wordmark, color and size from config */}
        <span
          className="
            font-extrabold tracking-tight text-brand-500
            text-[clamp(1rem,4vw,2rem)] leading-none select-none
            group-hover:brightness-110 transition
          "
        >
          FeelFlick
        </span>
      </button>

      {/* SIGN IN BUTTON: Large tap target, accessible */}
      <button
        onClick={() => navigate("/auth/sign-in")}
        className="
          rounded-lg font-bold text-white shadow
          bg-gradient-to-r from-accent-from to-accent-to
          px-4 py-2 text-sm sm:px-6 sm:py-2.5 sm:text-base
          hover:brightness-110 active:scale-95 transition
          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-from
        "
        aria-label="Sign in"
      >
        SIGN IN
      </button>
    </header>
  );
}

