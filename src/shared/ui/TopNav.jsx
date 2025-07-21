import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@assets/images/logo.png"; // Update as needed

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
  }, [lastScroll]);

  return (
    <header
      className="fixed left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform duration-400"
      style={{
        top: hidden ? "-90px" : "18px",
        transitionProperty: "top, background",
      }}
      role="banner"
    >
      <nav
        className="
          pointer-events-auto w-full max-w-4xl mx-6
          bg-zinc-950/40 backdrop-blur-[6px] shadow-2xl
          rounded-2xl flex items-center
          px-9 py-2 min-h-[44px]
        "
        aria-label="Main navigation"
        role="navigation"
      >
        {/* ---- Logo ---- */}
        <Link
          to="/"
          className="flex items-center gap-2 group focus-visible:outline-2"
          aria-label="Go to FeelFlick home page"
          tabIndex={0}
        >
          <img
            src={logo}
            alt="FeelFlick logo"
            className="h-[38px] w-[38px] rounded-2xl shadow-sm group-hover:scale-105 group-hover:shadow-xl transition"
            draggable={false}
          />
          <span
            className="uppercase font-extrabold tracking-wide select-none ml-2"
            style={{
              color: "#F6E3D7",
              fontSize: "29px",
              letterSpacing: "0.05em",
              lineHeight: "1.12",
              textShadow: "0 1px 10px #fff1, 0 1px 20px #18406d24",
            }}
          >
            FEELFLICK
          </span>
        </Link>
        <span className="flex-1" />

        {/* ---- Sign In Button ---- */}
        {location.pathname !== "/auth/sign-in" && (
          <Link
            to="/auth/sign-in"
            className="
              bg-gradient-to-r from-orange-400 to-red-500
              text-white font-extrabold
              px-6 py-2 rounded-xl shadow-md transition
              focus-visible:outline-2 focus-visible:outline-white
              hover:opacity-95
              min-w-[95px] min-h-[36px] text-[1.07rem] text-center
              active:scale-97
            "
            aria-label="Sign in"
            tabIndex={0}
            style={{
              boxShadow: "0 2px 12px #eb423b1a",
              fontSize: "1.07rem",
            }}
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
