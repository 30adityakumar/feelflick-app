import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@assets/images/logo.png"; // Adjust path if needed

export default function TopNav() {
  const [hidden, setHidden] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const location = useLocation();

  // Hide nav when scrolling down, show on scroll up
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const curr = window.scrollY;
          setHidden(curr > 48 && curr > lastScroll);
          setLastScroll(curr);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  return (
    <header
      className={`
        fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform duration-400
        md:top-4 md:left-0 md:right-0
        sm:top-2
      `}
      style={{
        transform: hidden ? "translateY(-130%)" : "translateY(0)",
        transitionProperty: "transform, background",
      }}
      role="banner"
    >
      <nav
        className={`
          pointer-events-auto w-full max-w-[1220px] flex items-center
          bg-[rgba(18,18,22,0.4)] backdrop-blur-[6px] shadow-xl
          rounded-xl min-h-[56px]
          px-6 py-0.85
        `}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* Logo + FEELFLICK */}
        <Link
          to="/"
          className="flex items-center gap-3 focus-visible:outline-2"
          aria-label="Go to FeelFlick home page"
          tabIndex={0}
        >
          <img
            src={logo}
            alt="FeelFlick logo"
            className="h-9 w-9 rounded-xl shadow group-hover:scale-105 transition"
            draggable={false}
          />
          <span
            className="uppercase font-extrabold tracking-wider select-none text-[1.5rem] pl-1"
            style={{
              color: "#F6E3D7",
              letterSpacing: "0.08em",
              textShadow: "0 1px 10px #fff1, 0 1px 20px #18406d24",
              lineHeight: "1",
            }}
          >
            FEELFLICK
          </span>
        </Link>
        <span className="flex-1" />
        {/* Sign In Button */}
        {location.pathname !== "/auth/sign-in" && (
          <Link
            to="/auth/sign-in"
            className={`
              bg-gradient-to-r from-orange-400 to-red-500
              text-white font-extrabold
              px-7 py-1 rounded-xl shadow-md transition
              focus-visible:outline-2 focus-visible:outline-white
              hover:opacity-95
              min-w-[110px] text-lg text-center
              active:scale-97
            `}
            aria-label="Sign in"
            tabIndex={0}
            style={{
              boxShadow: "0 2px 12px #eb423b1a",
              fontSize: "1rem",
              minHeight: "30px",
            }}
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
