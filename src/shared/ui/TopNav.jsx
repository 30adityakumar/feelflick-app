import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@assets/images/logo.png";

/**
 * TopNav: Minimal, instant-appearance, fixed header for MVP.
 * - Hides instantly on scroll down (no animation/transition).
 * - Loads fast, minimal CSS, optimal for slow connections/MVPs.
 * - Accessible and responsive.
 */
export default function TopNav() {
  // Track if navigation should be hidden (on scroll down)
  const [hidden, setHidden] = useState(false);
  // Store last scroll position without causing re-renders
  const lastScroll = useRef(0);
  // Get current location for conditional rendering
  const location = useLocation();

  useEffect(() => {
    // Hide nav when scrolling down, show on scroll up
    const handleScroll = () => {
      const curr = window.scrollY;
      setHidden(curr > 48 && curr > lastScroll.current);
      lastScroll.current = curr;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Clean up event listener when component unmounts
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    // Fixed header, instantly hides (no animation), pointer-events handled by nav
    <header
      className={`
        fixed z-50 flex justify-center pointer-events-none
        top-1 left-1 right-1
        md:top-2 md:left-0 md:right-0
      `}
      style={{
        // Instantly moves header out of view when hidden
        transform: hidden ? "translateY(-130%)" : "translateY(0)",
        // No transition for MVP (animation-free)
      }}
      role="banner"
    >
      <nav
        className={`
          pointer-events-auto w-full max-w-[1220px] flex items-center
          bg-[rgba(18,18,22,0.4)] backdrop-blur-[6px] shadow-xl
          rounded-xl min-h-[42px] px-3 py-1
          md:rounded-2xl md:h-12 md:px-6 md:py-2
        `}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* Logo and brand name (left) */}
        <Link
          to="/"
          className="flex items-center gap-1 md:gap-3 group focus-visible:outline-2"
          aria-label="Go to FeelFlick home page"
          tabIndex={0}
        >
          <img
            src={logo}
            alt="FeelFlick logo"
            className="h-7 w-7 rounded-lg md:h-9 md:w-9"
            draggable={false}
          />
          <span
            className="
              uppercase font-extrabold tracking-normal select-none text-lg pl-1
              md:text-xl md:pl-1 lg:text-3xl
            "
            style={{
              color: "#F6E3D7",
              letterSpacing: "0.07em",
              textShadow: "0 1px 10px #fff1, 0 1px 20px #18406d24",
              lineHeight: "1",
            }}
          >
            FEELFLICK
          </span>
        </Link>

        {/* Spacer to push Sign In button to right */}
        <span className="flex-1" />

        {/* Show "Sign in" button unless on sign-in page */}
        {location.pathname !== "/auth/sign-in" && (
          <Link
            to="/auth/sign-in"
            className={`
              bg-gradient-to-r from-orange-400 to-red-500
              text-white font-bold
              px-4 py-1 rounded-lg shadow-md
              focus-visible:outline-2 focus-visible:outline-white
              min-w-[80px] text-sm text-center
              md:px-5 md:py-1 md:rounded-xl md:min-w-[100px] md:text-base
            `}
            aria-label="Sign in"
            tabIndex={0}
            style={{
              boxShadow: "0 2px 12px #eb423b1a",
              fontSize: "0.95rem",
              minHeight: "28px",
            }}
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
