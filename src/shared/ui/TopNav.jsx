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
        fixed z-50 flex justify-center pointer-events-none transition-transform duration-400
        top-2 left-1 right-1
        md:top-4 md:left-0 md:right-0
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
          rounded-xl min-h-[42px] px-3 py-1
          md:rounded-2xl md:min-h-[54px] md:px-6 md:py-2
        `}
        aria-label="Main navigation"
        role="navigation"
      >
        <Link
          to="/"
          className="flex items-center gap-1 md:gap-3 group focus-visible:outline-2"
          aria-label="Go to FeelFlick home page"
          tabIndex={0}
        >
          <img
            src={logo}
            alt="FeelFlick logo"
            className="
              h-7 w-7 rounded-tl-lg rounded-br-lg group-hover:scale-105 transition
              md:h-9 md:w-9
            "
            draggable={false}
          />
          <span
            className="
              uppercase font-extrabold tracking-wider select-none text-lg pl-1
              md:text-2xl md:pl-2
              lg:text-3xl
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
        <span className="flex-1" />
        {location.pathname !== "/auth/sign-in" && (
          <Link
            to="/auth/sign-in"
            className={`
              bg-gradient-to-r from-orange-400 to-red-500
              text-white font-extrabold
              px-4 py-1 rounded-lg shadow-md transition
              focus-visible:outline-2 focus-visible:outline-white
              hover:opacity-95
              min-w-[80px] text-sm text-center
              active:scale-97
              md:px-7 md:py-2 md:rounded-xl md:min-w-[110px] md:text-base
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
