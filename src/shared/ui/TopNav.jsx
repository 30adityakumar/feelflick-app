import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@assets/images/logo.png"; // Adjust path if needed

export default function TopNav() {
  const [hidden, setHidden] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const location = useLocation();

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
        fixed z-50 flex justify-center pointer-events-none transition-transform duration-400 ease-[cubic-bezier(.4,.4,0,1)]
        top-4 left-0 right-0
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
          pointer-events-auto w-full flex items-center rounded-2xl shadow-xl
          bg-zinc-950/40 backdrop-blur-[6px]
          px-4 py-2
          max-w-[700px] mx-2
          sm:mx-2 sm:px-2
        `}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* Logo + Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 group focus-visible:outline-2"
          aria-label="Go to FeelFlick home page"
        >
          <img
            src={logo}
            alt="FeelFlick logo"
            className="h-9 w-9 md:h-10 md:w-10 rounded-2xl shadow-sm group-hover:scale-105 group-hover:shadow-xl transition"
            draggable={false}
          />
          <span
            className={`
              uppercase font-extrabold tracking-widest select-none ml-1 drop-shadow
              text-[1.3rem] leading-[1.12]
              md:text-[1.7rem] md:ml-2
            `}
            style={{
              color: "#F6E3D7",
              letterSpacing: "0.07em",
              textShadow: "0 1px 10px #fff1, 0 1px 20px #18406d24",
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
              px-4 py-1 rounded-xl shadow-md transition
              focus-visible:outline-2 focus-visible:outline-white
              hover:opacity-95
              min-w-[80px] text-base text-center
              active:scale-97
              md:min-w-[95px] md:text-[1.07rem] md:px-6
            `}
            aria-label="Sign in"
            tabIndex={0}
            style={{
              boxShadow: "0 2px 12px #eb423b1a",
              fontSize: "1rem",
            }}
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
