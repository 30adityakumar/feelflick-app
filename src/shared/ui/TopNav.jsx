import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@assets/images/logo.png";

/**
 * TopNav component renders the site’s top navigation bar.
 * It hides when scrolling down and reveals when scrolling up.
 * Responsive and accessible navigation with sign-in button.
 */
export default function TopNav() {
  // State to track if the nav bar should be hidden (scroll down)
  const [hidden, setHidden] = useState(false);

  // useRef to store the last scroll position without causing re-renders
  const lastScroll = useRef(0);

  // React Router's hook to get current location for conditional rendering
  const location = useLocation();

  /**
   * Effect to listen to window scroll and toggle visibility of nav.
   * Uses requestAnimationFrame to throttle scroll event handling.
   */
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        // Throttle updates to animation frames for performance
        window.requestAnimationFrame(() => {
          const currentScroll = window.scrollY;

          // Hide nav if scrolled more than 48px AND scrolling down
          setHidden(currentScroll > 48 && currentScroll > lastScroll.current);

          // Update last scroll position
          lastScroll.current = currentScroll;

          // Reset ticking flag
          ticking = false;
        });

        ticking = true;
      }
    };

    // Add scroll listener with passive for better scrolling performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup listener on unmount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []); // Empty dependency array ensures effect runs once on mount

  return (
    /* 
      Header serves as a fixed, top-positioned banner.
      Uses transform to slide out when hidden, with smooth transitions.
      pointer-events-none disables interaction on the wrapper, allowing nav’s children to handle events.
    */
    <header
      className={`
        fixed z-50 flex justify-center pointer-events-none transition-transform duration-200
        top-1 left-1 right-1
        md:top-2 md:left-0 md:right-0
      `}
      style={{
        transform: hidden ? "translateY(-130%)" : "translateY(0)",
        transitionProperty: "transform, background",
      }}
      role="banner"
    >
      {/* 
        Main navigation container: max width centered with backdrop blur and shadow.
        Responsive padding and rounded corners enhance the look across breakpoints.
        pointer-events-auto enables interaction on this nav element.
      */}
      <nav
        className={`
          pointer-events-auto w-full max-w-[1220px] flex items-center
          bg-[rgba(18,18,22,0.4)] backdrop-blur-[6px] shadow-xl
          rounded-xl min-h-[42px] px-3 py-1
          md:rounded-2xl md:h-12 md:px-6 md:py-2
        `}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* 
          Logo and branding link
          Group class enables hover effects on child elements.
          Focus-visible ensures keyboard accessibility outline.
        */}
        <Link
          to="/"
          className="flex items-center gap-1 md:gap-3 group focus-visible:outline-2"
          aria-label="Go to FeelFlick home page"
          tabIndex={0}
        >
          {/* 
            Logo image with responsive size and rounded corners.
            Transition smooths scaling effect on hover.
            draggable={false} improves UX by preventing accidental drag.
          */}
          <img
            src={logo}
            alt="FeelFlick logo"
            className="
              h-7 w-7 rounded-lg group-hover:scale-100 transition
              md:h-9 md:w-9
            "
            draggable={false}
          />
          {/* 
            Brand name styled with uppercase, custom letter spacing, and text shadow.
            Responsive font size and padding left for spacing from logo.
            Inline styles used for custom color and text shadow for visual effect.
          */}
          <span
            className="
              uppercase font-extrabold tracking-normal select-none text-lg pl-1
              md:text-xl md:pl-1
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

        {/* 
          Spacer flexbox item grows to fill available space,
          pushing the Sign In button to the right
        */}
        <span className="flex-1" />

        {/* 
          Conditionally render "Sign In" button if user is NOT on sign-in page
          Button uses gradient background, bold white text, rounded corners,
          shadows for depth, and subtle interaction feedback on hover and active states.
          Responsive padding, font size, and minimum width for better usability.
          Focus-visible classes improve accessibility for keyboard users.
        */}
        {location.pathname !== "/auth/sign-in" && (
          <Link
            to="/auth/sign-in"
            className={`
              bg-gradient-to-r from-orange-400 to-red-500
              text-white font-bold
              px-4 py-1 rounded-lg shadow-md transition
              focus-visible:outline-2 focus-visible:outline-white
              hover:opacity-105
              min-w-[80px] text-sm text-center
              active:scale-97
              md:px-5 md:py-1 md:rounded-xl md:min-w-[100px] md:text-base
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
