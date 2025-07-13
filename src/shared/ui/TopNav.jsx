import { useNavigate } from "react-router-dom";
import logo from "@assets/images/logo.png";

export default function TopNav() {
  const navigate = useNavigate();
  return (
    <nav className="
      w-full fixed top-0 left-0 z-50
      flex items-center justify-between
      px-8 py-4 bg-[#16161a]
      shadow
    ">
      <button
        className="flex items-center gap-4 group focus:outline-none"
        onClick={() => navigate("/")}
        aria-label="Go to home"
      >
        <img
          src={logo}
          alt="FeelFlick logo"
          className="h-14 w-14 rounded-2xl bg-white object-cover shadow"
          draggable="false"
        />
        <span className="text-white text-4xl font-black group-hover:underline tracking-tight select-none">
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
