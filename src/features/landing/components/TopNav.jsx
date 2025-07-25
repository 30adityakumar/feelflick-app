import { Link, useLocation } from "react-router-dom";

export default function TopNav() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full h-12 bg-[#18141c] flex items-center px-0 shadow-none">
      {/* Brand (FEELFLICK) */}
      <Link to="/" aria-label="FeelFlick Home" tabIndex={0}>
        <span
          className={`
            font-extrabold text-lg sm:text-xl select-none pl-5
            tracking-wide
          `}
          style={{
            color: "#F6E3D7",       // soft cream
            letterSpacing: "0.09em",
            textShadow: "0 1px 10px #fff1, 0 1px 20px #18406d24",
            lineHeight: 1.15
          }}
        >
          FEELFLICK
        </span>
      </Link>

      {/* Fills all space between brand and button */}
      <span className="flex-1" />

      {/* Sign In button, right side */}
      {location.pathname !== "/auth/sign-in" && (
        <Link
          to="/auth/sign-in"
          className={`
            border border-[#fe9245] text-[#fe9245] font-semibold
            rounded-full px-6 py-1
            hover:bg-[#fe9245] hover:text-white
            transition text-base mr-4
            focus-visible:outline-2 focus-visible:outline-white
            min-w-[90px] text-center
          `}
          aria-label="Sign in"
          tabIndex={0}
        >
          Sign in
        </Link>
      )}
    </header>
  );
}
