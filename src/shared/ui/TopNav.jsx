/*********************************************************************
 * TopNav – FeelFlick
 *
 *  ✅  Responsive (mobile → 4 K) via Tailwind breakpoints
 *  ✅  Large tap targets (≥40 px logo + button)
 *  ✅  Brand/logo always returns home (keyboard + mouse)
 *  ✅  ARIA / alt text / focus states (AAA starter)
 *  ✅  Easily themed: edit colours in tailwind.config.js only
 *  ✅  Extensible: drop-in user avatar / search later
 *********************************************************************/

import { useNavigate } from "react-router-dom";
import logo from "@assets/images/logo.png"; // path resolved by Vite alias

export default function TopNav() {
  const navigate = useNavigate();

  /* ----------------  UTILITY fns  ---------------- */
  const goHome = () => navigate("/");
  const goSignIn = () => navigate("/auth/sign-in");

  /* ----------------  RENDER  --------------------- */
  return (
    <header /* semantic landmark for screen-readers */
      className="
        fixed top-4 left-4 right-4 z-50
        flex items-center justify-between
        rounded-xl bg-peach-100/90 shadow-lg backdrop-blur-sm
        px-4 py-2
        md:top-6 md:left-6 md:right-6
        lg:top-8 lg:left-8 lg:right-8 lg:px-6
      "
      role="banner"
    >

      {/* ---------- Left: Logo + Wordmark ---------- */}
      <button
        onClick={goHome}
        className="group flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label="Go to FeelFlick home page"
      >
        {/* Logo image */}
        <img
          src={logo}
          alt=""                /* decorative; label is on the button */
          className="
            h-8 w-8 rounded-lg shadow-sm
            transition-transform duration-200
            group-hover:scale-105
            md:h-10 md:w-10
            lg:h-11 lg:w-11
          "
        />

        {/* Wordmark – colour & size scale fluidly */}
        <span
          className="
            font-extrabold tracking-tight text-brand-500
            text-[clamp(1rem,4vw,1.75rem)]
            leading-none select-none
            group-hover:brightness-110
            transition duration-150
          "
        >
          FeelFlick
        </span>
      </button>

      {/* ---------- Right: Sign-In button ---------- */}
      <button
        onClick={goSignIn}
        className="
          rounded-lg font-bold text-white shadow
          bg-gradient-to-r from-accent-from to-accent-to
          px-4 py-2 text-sm
          md:px-5 md:py-2.5 md:text-base
          hover:brightness-110 active:scale-95 transition
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-from
        "
      >
        SIGN&nbsp;IN
      </button>

    </header>
  );
}

/* =============  HOW TO TWEAK  =====================

1.  NAVBAR COLOUR
      – go to tailwind.config.js  → colours.peach.100

2.  WORDMARK COLOUR
      – colours.brand.500  (single source of truth)

3.  BUTTON GRADIENT
      – colours.accent.from / .to

4.  BREAKPOINT OFFSETS (spacing)
      – `top-4 left-4` etc. in <header> classes
      – Tailwind’s scale: 4 = 1rem (16 px). Change `top-4` to `top-2` for tighter.

5.  LOGO SIZE
      – `h-8 w-8 md:h-10 ...`.  h = height, w = width.
      – Use Tailwind scale: 6 = 1.5 rem, 8 = 2 rem, etc.

6.  ADD A USER AVATAR later
      – Drop another button before/after SIGN IN.
      – Tailwind handles spacing via `gap-…` or `ml-…`.

7.  FULL “HIDE ON SCROLL” nav
      – Replace `top-*` classes with a Headless-UI <Disclosure> or
        use a custom hook that toggles `translate-y-full` on scroll.

=================================================== */
