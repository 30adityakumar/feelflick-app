import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@assets/images/logo.png"; // Transparent PNG recommended!

export default function TopNav() {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    let lastScroll = window.scrollY;
    let ticking = false;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const curr = window.scrollY;
          if (curr > 64 && curr > lastScroll) setHidden(true);
          else setHidden(false);
          lastScroll = curr;
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => setMenuOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <nav
      className={`topnav ${hidden ? "topnav--hidden" : ""}`}
      aria-label="Main navigation"
    >
      <div className="topnav__left">
        <button
          className="topnav__logoBtn"
          onClick={() => {
            navigate("/");
            setMenuOpen(false);
          }}
          aria-label="Go to FeelFlick home page"
        >
          <img
            src={logo}
            alt="FeelFlick logo"
            className="topnav__logo"
            draggable="false"
          />
        </button>

        <button
          className="topnav__title"
          onClick={() => {
            navigate("/");
            setMenuOpen(false);
          }}
          aria-label="FeelFlick home"
        >
          FeelFlick
        </button>
      </div>

      <div className="topnav__right">
        <button
          className="topnav__signin"
          onClick={() => {
            navigate("/auth/sign-in");
            setMenuOpen(false);
          }}
        >
          Sign in
        </button>

        <button
          className="topnav__hamburger"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(prev => !prev)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <div className="hamburger-icon" />
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="topnav__mobileMenu">
          <button
            className="topnav__mobileSignIn"
            onClick={() => {
              navigate("/auth/sign-in");
              setMenuOpen(false);
            }}
          >
            Sign in
          </button>
        </div>
      )}
    </nav>
  );
}
