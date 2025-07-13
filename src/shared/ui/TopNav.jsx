import { useNavigate } from "react-router-dom";
import logo from "@assets/images/logo.png";

/**
 * TopNav – FeelFlick Navigation Bar (Tailwind version)
 *
 * - Responsive at all breakpoints using Tailwind's `sm:`, `md:`, `lg:` utilities.
 * - Logo + wordmark is always clickable, returns home.
 * - Large, touch-friendly tap targets.
 * - Brand, button, and colors easily tweaked in tailwind.config.js or below.
 * - Keyboard & screen-reader accessible.
 * - Future-ready: add user avatar, search, menus, etc.
 */

export default function TopNav() {
  const navigate = useNavigate();

  return (
    <header
      // The nav bar is always visible ("fixed"), with spacing adapted for all screens
      className="
        fixed z-40
        top-3 left-2 right-2
        flex items-center justify-between
        px-3 py-2
        rounded-xl bg-peach-100/90 shadow-lg backdrop-blur-sm
        min-h-[44px]
        md:top-6 md:left-8 md:right-8 md:px-6 md:py-3 md:min-h-[56px]
        "
      role="banner"
    >
      {/* ----------- LOGO + BRAND NAME --------------- */}
      <button
        className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label="Go to home"
        onClick={() => navigate("/")}
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter") navigate("/"); }}
      >
        {/* Logo image */}
        <img
          src={logo}
          alt=""
          className="
            h-9 w-9 rounded-lg shadow
            transition-transform duration-150
            group-hover:scale-105
            md:h-11 md:w-11
          "
          draggable={false}
        />
        {/* App Title */}
        <span
          className="
            text-brand-500
            font-extrabold tracking-tight
            text-[clamp(1.15rem,5vw,2rem)]
            select-none leading-tight
            group-hover:brightness-110
            transition
          "
        >
          FeelFlick
        </span>
      </button>

      {/* ----------- SIGN IN BUTTON --------------- */}
      <button
        className="
          rounded-lg font-bold text-white shadow
          bg-gradient-to-r from-accent-from to-accent-to
          px-4 py-2 text-base min-w-[92px]
          md:px-6 md:py-2.5 md:text-lg md:min-w-[120px]
          hover:brightness-110 active:scale-95 transition
          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-from
        "
        onClick={() => navigate("/auth/sign-in")}
        tabIndex={0}
        aria-label="Sign in to FeelFlick"
      >
        SIGN IN
      </button>
    </header>
  );
}

/* -------------------------------------------------
   HOW TO TWEAK (for beginners)

- Change NAVBAR background:
    Replace "bg-peach-100/90" with any Tailwind color utility, or update "peach" in tailwind.config.js.

- Change wordmark color:
    Edit "text-brand-500" (set in tailwind.config.js). Example: "text-orange-600".

- Change logo size:
    Update "h-9 w-9 md:h-11 md:w-11" (9=2.25rem, 11=2.75rem). Use any Tailwind sizing (see docs).

- Change paddings:
    "px-3 py-2" (mobile), "md:px-6 md:py-3" (desktop).

- Button gradient:
    Uses "from-accent-from to-accent-to". Configure these in your tailwind.config.js colors for consistent branding.
    Or replace with built-in colors (e.g. "from-orange-400 to-red-500").

- Responsive breakpoints:
    Tailwind uses sm, md, lg, xl (see https://tailwindcss.com/docs/responsive-design).

- Accessibility:
    Buttons are always keyboard accessible (tab/focus), with ARIA labels for screen readers.
    Focus-visible ring helps users know where focus is.

- Add avatar, profile, or search:
    Just add another button or div before or after the sign-in button. Layout will adapt automatically.

-------------------------------------------------- */
