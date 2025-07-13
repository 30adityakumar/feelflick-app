import { useNavigate } from "react-router-dom";
import logo from "@assets/images/logo.png";

/**
 * Tailwind-powered TopNav, horizontally centered, logo+brand left, sign-in right.
 * Responsive, AAA accessible, easy to tweak.
 */
export default function TopNav() {
  const navigate = useNavigate();

  return (
    <header className="bg-[#111117] py-4"> {/* Page background, matches your 2nd screenshot */}
      {/* Container centers nav content, max width on large screens */}
      <nav
        className="
          max-w-6xl mx-auto flex items-center justify-between
          px-4 sm:px-8
        "
        aria-label="Primary"
      >
        {/* ---- Left: Logo + Brand Name ---- */}
        <button
          className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          aria-label="Go to FeelFlick home"
          onClick={() => navigate("/")}
        >
          <img
            src={logo}
            alt="FeelFlick logo"
            className="
              h-12 w-12 rounded-xl shadow-md bg-[#f6e3d7]
              sm:h-14 sm:w-14
            "
            draggable={false}
          />
          <span
            className="
              font-extrabold text-3xl text-white tracking-tight select-none
              sm:text-4xl
            "
            style={{
              // To match exact style, you can tweak color, fontWeight, etc
              letterSpacing: "-1.5px",
            }}
          >
            FeelFlick
          </span>
        </button>

        {/* ---- Right: Sign In button ---- */}
        <button
          className="
            font-bold text-white rounded-xl
            bg-gradient-to-r from-[#fe9245] to-[#eb423b]
            px-8 py-3 text-lg
            shadow-md
            transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400
          "
          onClick={() => navigate("/auth/sign-in")}
        >
          SIGN IN
        </button>
      </nav>
    </header>
  );
}

/* ---------------- HOW TO TWEAK --------------------
- Change max width of nav bar: max-w-6xl → max-w-5xl, max-w-7xl etc.
- Change padding: px-4 = 1rem on both sides (mobile), sm:px-8 = 2rem on sm+ screens.
- Change logo size: h-12 w-12 (48px), sm:h-14 sm:w-14 (56px on sm+).
- Change brand font size: text-3xl = 1.875rem, sm:text-4xl = 2.25rem.
- Button color: from-[#fe9245] to-[#eb423b] (your orange-red gradient).
- Button size: px-8 py-3 = big tap target, text-lg for bold.
- Background color: bg-[#111117] is deep black-grey (matches screenshot).

Accessibility:
- Buttons have focus rings, ARIA labels, keyboard support.
- Logo alt text for screen readers.
--------------------------------------------------- */
