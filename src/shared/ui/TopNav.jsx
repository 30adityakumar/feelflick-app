import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@assets/images/logo.png";

export default function TopNav() {
  const [hidden, setHidden] = useState(false);
  const lastScroll = useRef(0);
  const location = useLocation();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const curr = window.scrollY;
          setHidden(curr > 48 && curr > lastScroll.current);
          lastScroll.current = curr;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`
        fixed z-50 flex justify-center pointer-events-none transition-transform duration-400 ease-[cubic-bezier(.4,.4,0,1)]
        top-4 inset-x-6
        md:top-4 md:inset-x-6
        sm:top-2 sm:inset-x-2
      `}
      style={{
        transform: hidden ? "translateY(-130%)" : "translateY(0)",
        transitionProperty: "transform, background",
      }}
      role="banner"
    >
      <nav
        className={`
          pointer-events-auto w-full max-w-[1220px] flex items-center rounded-2xl shadow-xl
          bg-zinc-950/40 backdrop-blur-[6px]
          px-7 py-2 min-h-[56px]
          md:py-2 md:px-7
          sm:py-1.5 sm:px-3
        `}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* Logo + Brand */}
        <Link
          to="/"
          className="flex items-center gap-3 group focus-visible:outline-2"
          aria-label="Go to FeelFlick home page"
          tabIndex={0}
        >
          <img
            src={logo}
            alt="FeelFlick logo"
            className="
              h-[38px] w-[38px] rounded-2xl shadow-sm group-hover:scale-105 group-hover:shadow-xl transition
              md:h-[38px] md:w-[38px]
              sm:h-8 sm:w-8
            "
            draggable={false}
          />
          <span
            className="
              uppercase font-extrabold tracking-wide select-none ml-2 drop-shadow
              text-[29px] leading-[1.12]
              md:text-[29px] md:ml-2
              sm:text-lg sm:ml-1
            "
            style={{
              color: "#F6E3D7",
              letterSpacing: "0.05em",
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
              px-6 py-2 rounded-xl shadow-md transition
              focus-visible:outline-2 focus-visible:outline-white
              hover:opacity-95
              min-w-[95px] min-h-[36px] text-[1.07rem] text-center
              active:scale-97
              md:text-[1.07rem] md:min-w-[95px] md:px-6 md:py-2
              sm:text-base sm:min-w-[80px] sm:px-3 sm:py-2
            `}
            aria-label="Sign in"
            tabIndex={0}
            style={{
              boxShadow: "0 2px 12px #eb423b1a",
            }}
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
