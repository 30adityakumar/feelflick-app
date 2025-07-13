import { useNavigate } from "react-router-dom";
import logo from "@assets/images/logo.png"; // Your logo import

/**
 * TopNav – Main navigation bar for FeelFlick
 *
 * ✔ Responsive: looks great on any screen (phone, tablet, desktop, 4K TV)
 * ✔ Large, easy-to-tap logo and button
 * ✔ Entire logo/title area is clickable, returns home (keyboard & mouse)
 * ✔ Fully keyboard/screen-reader accessible
 * ✔ Easily add search/user avatar in future (see comments)
 * ✔ All spacing, colors, and sizes use Tailwind tokens (change in one place)
 * ✔ No inline styles or custom <style> tags needed!
 *
 * -----
 * Want to change a color or spacing?
 * - Edit your tailwind.config.js to update brand colors and defaults
 * - Or, just tweak the Tailwind classes below (see comments)
 */

export default function TopNav() {
  const navigate = useNavigate();

  // Example: change the nav color by editing "bg-peach-100"
  // If you want a different background, e.g. bg-slate-900 for dark
  // Or use bg-gradient-to-r from-orange-100 to-red-200, etc

  return (
    <header
      className="
        fixed top-3 left-2 right-2 z-40
        flex items-center justify-between
        bg-peach-100/90 shadow-lg backdrop-blur-md
        px-2 py-2 rounded-2xl
        sm:top-5 sm:left-5 sm:right-5 sm:px-4
        md:top-7 md:left-8 md:right-8 md:px-6
        transition-all duration-200
      "
      role="banner"
    >
      {/* Left: Clickable logo + wordmark */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="
          flex items-center gap-3 outline-none group
          focus-visible:ring-2 focus-visible:ring-brand-500
          transition"
        aria-label="Go to FeelFlick home"
        tabIndex={0}
      >
        {/* LOGO – change w/h classes to make it bigger/smaller */}
        <img
          src={logo}
          alt="" // Logo is decorative; label is on button
          className="
            h-9 w-9 rounded-lg shadow
            md:h-11 md:w-11
            transition-transform group-hover:scale-105
          "
        />
        {/* TITLE – edit color/size with Tailwind */}
        <span
          className="
            font-extrabold tracking-tight text-brand-500
            text-xl md:text-2xl lg:text-3xl
            select-none leading-none
            transition group-hover:brightness-110
          "
        >
          FeelFlick
        </span>
      </button>

      {/* Right: SIGN IN button */}
      <button
        type="button"
        onClick={() => navigate("/auth/sign-in")}
        className="
          rounded-lg font-bold text-white shadow
          bg-gradient-to-r from-accent-from to-accent-to
          px-4 py-2 text-base
          hover:brightness-110 active:scale-95
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-from
          transition
        "
        tabIndex={0}
      >
        SIGN IN
      </button>
      {/* 
        To ADD A USER MENU: 
        - Drop a <UserMenu /> component before/after the SIGN IN button.
        To ADD SEARCH:
        - Add a <SearchBar /> before the button. Adjust gap-3 as needed.
      */}
    </header>
  );
}

/*
---- HOW TO TWEAK THIS NAV ----

1. COLORS: All colors are Tailwind tokens. For brand colors, set these in tailwind.config.js:

   colors: {
     peach: { 100: '#f6e3d7' },
     brand: { 500: '#e5744b' },
     accent: { from: '#fe9245', to: '#eb423b' },
   }
   Then use "bg-peach-100", "text-brand-500", "from-accent-from", etc.

2. PADDING & SPACING:
   - px-4, py-2 = horizontal/vertical padding (in rems; see Tailwind docs)
   - gap-3 = space between logo and text (increase/decrease for more/less space)
   - h-9 w-9 = logo size (increase/decrease for bigger/smaller logo)
   - text-xl, text-2xl = title size (try text-base, text-3xl, etc)

3. BREAKPOINTS:
   - sm:, md:, lg: = tablet/desktop overrides (see classnames like "md:h-11")
   - Adjust as needed for different screen sizes

4. ACCESSIBILITY:
   - The nav and both buttons are fully keyboard-accessible and screen-reader friendly.
   - All focus-visible states use proper Tailwind classes.

5. EXTENDING:
   - Add more <button>, <a>, or <UserMenu /> after the SIGN IN button for profile, search, etc.
   - Flex + gap-3 means everything spaces nicely.

6. MAKE IT SCROLL/HIDE ON SCROLL:
   - Use a "headroom" React package or custom hook to toggle the "top-..." classes based on scroll.

7. DARK MODE:
   - To support dark mode, add Tailwind dark: classes (e.g. dark:bg-slate-900).
   - Use a toggle to switch body class to "dark".

*/
