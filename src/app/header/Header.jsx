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
        pt-2 pb-1 md:py-2
        px-0
        z-50 fixed top-0 left-0 right-0 transition-all duration-300
        min-h-[60px]
      `}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo with left padding on mobile */}
      <Link
        to="/"
        className="flex items-center pl-3 sm:pl-4"
        tabIndex={0}
        aria-label="Go to FeelFlick home page"
        draggable={false}
        style={{ outline: "none" }}
      >
        <img
          src={logo}
          alt="FeelFlick logo"
          className="h-10 w-10 sm:h-9 sm:w-9 rounded-lg transition-transform"
          draggable={false}
        />
        <span
          className="hidden sm:inline uppercase font-extrabold tracking-normal select-none text-lg pl-1 md:text-xl md:pl-1 lg:text-3xl transition"
          style={{
            color: "#F6E3D7",
            letterSpacing: "0.03em",
            textShadow: "0 1px 10px #fff1, 0 1px 20px #18406d24",
            lineHeight: "1",
          }}
        >
          FEELFLICK
        </span>
      </Link>

      {/* SearchBar - always centered and perfectly aligned */}
      <div className="flex-1 flex justify-center items-center mx-2 min-w-0">
        <div className="w-full h-10 flex items-center max-w-full sm:max-w-[340px] md:max-w-xl" style={{ minWidth: 0 }}>
          <SearchBar />
        </div>
      </div>

      {/* Account Icon with right padding on mobile */}
      <div className="pr-3 sm:pr-4 flex items-center" ref={menuRef}>
        <div
          onClick={() => setShowMenu(!showMenu)}
          className="
            bg-[#3a3746] w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
            text-white font-bold font-sans text-lg cursor-pointer select-none
            shadow transition hover:scale-105 border-2 border-transparent
          "
          tabIndex={0}
          aria-label="Account menu"
          style={{ outline: "none" }}
        >
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
        </div>
        {showMenu && <AccountMenuDropdown />}
      </div>
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
