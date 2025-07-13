import { useNavigate } from "react-router-dom";
import logo from "@assets/images/logo.png";

export default function TopNav() {
  const navigate = useNavigate();
  return (
    <nav className="
      fixed inset-x-0 top-0 z-50   /* ← guarantees it’s on top */
      w-full flex items-center justify-between
      bg-[#16161a]/95 backdrop-blur
      px-8 py-4 shadow
    ">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-4 focus:outline-none"
        aria-label="Go to home"
      >
        <img src={logo} alt="FeelFlick logo"
             className="h-14 w-14 rounded-2xl bg-white object-cover shadow"
             draggable="false" />
        <span className="text-[#F6E3D7] text-4xl font-black tracking-tight select-none">
          FeelFlick
        </span>
      </button>

      <button
        onClick={() => navigate("/auth/sign-in")}
        className="
          min-h-[48px] min-w-[120px] px-7 py-2 rounded-xl
          bg-gradient-to-r from-orange-400 to-red-500
          text-white text-xl font-extrabold shadow-md
          hover:brightness-110 active:scale-95
          focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400
        "
        aria-label="Sign in"
      >
        SIGN IN
      </button>
    </nav>
  );
}
