import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function TopNav() {
  const [hidden, setHidden] = useState(false);
  const lastScroll = useRef(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setHidden(currentScroll > 48 && currentScroll > lastScroll.current);
      lastScroll.current = currentScroll;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`
        fixed z-50 w-full top-0 left-0 right-0
        flex justify-center pointer-events-none
      `}
      style={{
        transform: hidden ? "translateY(-130%)" : "translateY(0)"
      }}
      role="banner"
    >
      <nav
        className={`
          pointer-events-auto w-full flex items-center
          bg-[rgba(18,18,22,0.7)] backdrop-blur
          min-h-[64px]
        `}
        aria-label="Main navigation"
        role="navigation"
        style={{
          padding: "0",
          margin: "0",
          borderRadius: "0",
          boxShadow: "none"
        }}
      >
        {/* FEELFLICK brand only, no logo */}
        <Link
          to="/"
          className="flex items-center pointer-events-auto select-none focus-visible:outline-2 w-fit"
          aria-label="Go to FeelFlick home page"
          tabIndex={0}
        >
          <span
            className={`
              uppercase font-extrabold text-2xl sm:text-3xl md:text-4xl
              tracking-wide text-[#F6E3D7] pl-8
              whitespace-nowrap
            `}
            style={{
              letterSpacing: "0.08em",
              textShadow: "0 1px 10px #fff1, 0 1px 20px #18406d24",
              lineHeight: "1.15"
            }}
          >
            FEELFLICK
          </span>
        </Link>
        <span className="flex-1" />

        {/* Sign In button */}
        {location.pathname !== "/auth/sign-in" && (
          <Link
            to="/auth/sign-in"
            className={`
              bg-gradient-to-r from-orange-400 to-red-500
              text-white font-semibold
              px-4 pr-7 py-2 rounded-lg
              focus-visible:outline-2 focus-visible:outline-white
              min-w-[90px] text-base text-center
              mx-2
            `}
            aria-label="Sign in"
            tabIndex={0}
            style={{
              boxShadow: "0 2px 12px #eb423b1a",
              fontSize: "1.08rem",
              minHeight: "32px",
            }}
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
