import { useNavigate } from "react-router-dom";
import logo from "@assets/images/logo.png";

const NAV_CONFIG = {
  bg:         "bg-[#16161a]/95 backdrop-blur-md",
  brand:      "text-[#F6E3D7]",
  radius:     "rounded-2xl",
  shadow:     "shadow-md shadow-black/10",
  logo: {
    base:     "h-11 w-11 xs:h-12 xs:w-12 md:h-14 md:w-14 min-h-[44px] min-w-[44px]",
    ring:     "focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2",
  },
  text:       "font-extrabold tracking-tight select-none text-2xl xs:text-3xl md:text-4xl",
  gap:        "gap-3 xs:gap-4",
  padding:    "px-3 py-2 xs:px-6 sm:px-8",
  button: {
    base:     "min-h-[44px] min-w-[44px] px-4 xs:px-7 py-2 xs:py-2 rounded-xl font-bold text-lg md:text-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2",
    gradient: "bg-gradient-to-r from-orange-400 to-red-500 shadow hover:brightness-105 active:scale-95",
  }
};

export default function TopNav() {
  const navigate = useNavigate();

  return (
    <nav
      className={`
        fixed z-40 inset-x-0 top-0
        flex items-center justify-between
        ${NAV_CONFIG.bg} ${NAV_CONFIG.radius} ${NAV_CONFIG.shadow}
        ${NAV_CONFIG.padding}
        w-full max-w-full
        transition-all duration-150
      `}
      aria-label="FeelFlick top navigation"
      role="navigation"
    >
      <button
        onClick={() => navigate("/")}
        className={`
          group flex items-center ${NAV_CONFIG.gap}
          focus:outline-none ${NAV_CONFIG.logo.ring}
        `}
        aria-label="Go to FeelFlick home page"
        tabIndex={0}
      >
        <img
          src={logo}
          alt="FeelFlick logo"
          className={`
            ${NAV_CONFIG.logo.base}
            ${NAV_CONFIG.radius}
            ${NAV_CONFIG.shadow}
            bg-white object-cover transition
            group-hover:scale-105 group-active:scale-95
          `}
          draggable="false"
        />
        <span
          className={`
            ${NAV_CONFIG.text} ${NAV_CONFIG.brand}
            group-hover:underline group-focus:underline transition
          `}
        >
          FeelFlick
        </span>
      </button>

      <button
        type="button"
        onClick={() => navigate("/auth/sign-in")}
        className={`
          ${NAV_CONFIG.button.base}
          ${NAV_CONFIG.button.gradient}
        `}
        aria-label="Sign in to FeelFlick"
      >
        SIGN IN
      </button>
    </nav>
  );
}
