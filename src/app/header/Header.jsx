import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, SlidersHorizontal, User2 } from "lucide-react";
import logo from "@assets/images/logo.png";
import SearchBar from "@/app/header/components/SearchBar";

export default function Header({ user, onSignOut }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const onClick = (e) => {
      if (showMenu && menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showMenu]);

  const handleSignOut = async () => {
    if (onSignOut) await onSignOut();
    navigate("/");
  };

  function AccountMenuDropdown() {
    return (
      <div
        className="absolute right-0 top-12 bg-[#1f1d26] rounded-xl shadow-xl min-w-[185px] z-40 p-1 pt-2 animate-slideDown"
        style={{ boxShadow: "0 8px 34px #18142355" }}
      >
        <MenuItem icon={<User2 size={18} />} text="My Account" onClick={() => { navigate("/account"); setShowMenu(false); }} />
        <MenuItem icon={<SlidersHorizontal size={18} />} text="Preferences" onClick={() => { navigate("/preferences"); setShowMenu(false); }} />
        <div className="border-t border-zinc-800 my-2" />
        <MenuItem icon={<LogOut size={18} />} text="Sign Out" onClick={handleSignOut} />
      </div>
    );
  }

  function MenuItem({ icon, text, onClick }) {
    return (
      <div
        onClick={onClick}
        className="flex items-center px-4 py-2 text-white cursor-pointer font-sans text-[15px] rounded-lg transition duration-150 hover:bg-[#2d2a38]"
      >
        <span className="mr-3">{icon}</span>
        <span>{text}</span>
      </div>
    );
  }

  return (
    <header
      className={`
        flex items-center justify-between w-full
        bg-black
        px-1 md:px-3 lg:px-7 py-1.5 md:py-2 shadow-[0_1px_8px_#000b]
        z-50 fixed top-0 left-0 right-0 transition-all duration-300
        pr-1 sm:pr-2 md:pr-3 lg:pr-5
      `}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo + Brand (left) */}
      <Link
        to="/"
        className="flex items-center gap-0.5 md:gap-2 group focus-visible:outline-none min-w-[36px] sm:min-w-[120px] pl-0 sm:pl-1"
        tabIndex={0}
        aria-label="Go to FeelFlick home page"
        draggable={false}
        style={{ outline: "none" }}
      >
        <img
          src={logo}
          alt="FeelFlick logo"
          className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-transform group-hover:scale-105"
          draggable={false}
        />
        {/* Hide text on mobile */}
        <span
          className="
            hidden sm:inline
            uppercase font-extrabold tracking-normal select-none text-lg pl-1
            md:text-xl md:pl-1 lg:text-3xl
            transition
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

      {/* SearchBar (center, thinner width on mobile) */}
      <div className="flex-1 flex justify-center mx-2 sm:mx-4">
        <div className="w-full max-w-[170px] sm:max-w-[340px] md:max-w-xl px-0 sm:px-4">
          <SearchBar />
        </div>
      </div>

      {/* User avatar/account menu (right) */}
      <div className="relative min-w-[36px] sm:min-w-[45px] pr-1 sm:pr-2 md:pr-3" ref={menuRef}>
        <div
          onClick={() => setShowMenu(!showMenu)}
          className={`
            bg-[#3a3746] w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
            text-white font-bold font-sans text-lg cursor-pointer select-none
            shadow transition hover:scale-105 border-2
            border-transparent
          `}
          tabIndex={0}
          aria-label="Account menu"
          style={{ outline: "none" }}
        >
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
        </div>
        {showMenu && <AccountMenuDropdown />}
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-14px);}
            to { opacity: 1; transform: translateY(0);}
          }
          .animate-slideDown {
            animation: slideDown 0.23s cubic-bezier(.33,1,.68,1) both;
          }
        `}
      </style>
    </header>
  );
}
