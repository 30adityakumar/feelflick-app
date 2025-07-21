import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@assets/images/logo.png"; // Adjust path as needed

export default function TopNav() {
  const [hidden, setHidden] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const location = useLocation();

  // Hide nav on scroll down, show on scroll up
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const curr = window.scrollY;
          setHidden(curr > 64 && curr > lastScroll);
          setLastScroll(curr);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line
  }, [lastScroll]);

  return (
    <header
      className={`fixed left-0 right-0 z-50 flex justify-center transition-transform duration-400 ease-[cubic-bezier(.4,.4,0,1)] pointer-events-none`}
      style={{
        top: hidden ? "-90px" : "18px",
        transitionProperty: "top, background",
      }}
      role="banner"
    >
      <nav
        className="
          pointer-events-auto
          w-full max-w-4xl mx-3 bg-zinc-950/85
          backdrop-blur-xl shadow-xl rounded-2xl flex items-center gap-3
          px-6 py-3
          md:mx-6
          "
        aria-label="Main navigation"
        role="navigation"
      >
        {/* Logo + Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 focus-visible:outline-2"
          aria-label="Go to FeelFlick home page"
        >
          <img
            src={logo}
            alt="FeelFlick logo"
            className="h-9 w-9 md:h-10 md:w-10 rounded-xl shadow-sm hover:scale-105 hover:shadow-xl transition"
            draggable={false}
          />
          <span className="text-2xl md:text-3xl font-extrabold tracking-wide text-cream drop-shadow feelflick-title">
            FeelFlick
          </span>
        </Link>
        <span className="flex-1" />

        {/* Sign In Button */}
        {location.pathname !== "/auth/sign-in" && (
          <Link
            to="/auth/sign-in"
            className="
              bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-2
              rounded-xl font-semibold shadow-md transition focus-visible:outline-2 focus-visible:outline-white
              hover:opacity-95 text-base min-w-[90px] text-center
            "
            aria-label="Sign in"
            tabIndex={0}
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
