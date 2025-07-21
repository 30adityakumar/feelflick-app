import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@assets/images/logo.png";

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
      className="fixed left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{
        top: hidden ? "-90px" : "18px",
        transition: "top 0.4s cubic-bezier(.4,.4,0,1), background 0.18s",
      }}
      role="banner"
    >
      <nav
        className="
          pointer-events-auto w-full max-w-4xl mx-3 mt-4
          bg-zinc-950/85
          backdrop-blur-xl shadow-xl rounded-2xl flex items-center gap-4
          px-8 py-3.5
          md:mx-6
        "
        aria-label="Main navigation"
        role="navigation"
      >
        <Link
          to="/"
          className="flex items-center gap-3 group focus-visible:outline-2"
          aria-label="Go to FeelFlick home page"
        >
          <img
            src={logo}
            alt="FeelFlick logo"
            className="h-10 w-10 rounded-xl shadow-sm group-hover:scale-105 group-hover:shadow-xl transition"
            draggable={false}
          />
          <span
            className="uppercase font-extrabold text-[2rem] tracking-widest"
            style={{
              color: "#F6E3D7",
              letterSpacing: ".08em",
              lineHeight: "1",
              textShadow: "0 1px 10px #fff1, 0 1px 20px #18406d24",
            }}
          >
            FEELFLICK
          </span>
        </Link>
        <span className="flex-1" />
        {location.pathname !== "/auth/sign-in" && (
          <Link
            to="/auth/sign-in"
            className="
              bg-gradient-to-r from-orange-400 to-red-500
              text-white font-extrabold text-lg
              px-7 py-2.5 rounded-2xl shadow-lg transition
              focus-visible:outline-2 focus-visible:outline-white
              hover:opacity-95
              min-w-[110px] text-center
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
