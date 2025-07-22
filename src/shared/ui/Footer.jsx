import { FaInstagram, FaTiktok } from "react-icons/fa";
import logo from '@assets/images/logo.png';

export default function Footer() {
  return (
    <footer className="w-full mt-0 bg-black/90 rounded-none pt-16 pb-10 text-white shadow-[0_-2px_24px_0_#0007] text-[15px]">
      <div className="flex flex-wrap max-w-[1240px] mx-auto justify-between gap-x-12 gap-y-10 px-[5vw]">
        {/* Logo & Brand */}
        <div className="flex flex-col items-start mb-2 min-w-[140px]">
          <img
            src={logo}
            alt="FeelFlick"
            className="w-11 h-11 rounded-xl mb-2 shadow-[0_2px_9px_#ff5b2e14]"
          />
          <span className="font-black text-[22px] tracking-tight mb-1 text-white">
            FeelFlick
          </span>
          <div className="w-12 h-[3px] bg-gradient-to-r from-[#fe9245] via-[#eb423b] to-[#367cff] rounded mb-2" />
        </div>
        {/* About */}
        <div className="flex-1 min-w-[120px]">
          <div className="font-bold mb-2 text-sm text-white">About</div>
          <div className="opacity-80 text-zinc-200 text-[15px] mb-2 cursor-pointer hover:text-orange-400 transition">Contact Us</div>
          <div className="opacity-80 text-zinc-200 text-[15px] mb-2 cursor-pointer hover:text-orange-400 transition">Careers</div>
          <div className="opacity-80 text-zinc-200 text-[15px] mb-2 cursor-pointer hover:text-orange-400 transition">Feedback</div>
        </div>
        {/* Legal */}
        <div className="flex-1 min-w-[120px]">
          <div className="font-bold mb-2 text-sm text-white">Legal</div>
          <div className="opacity-80 text-zinc-200 text-[15px] mb-2 cursor-pointer hover:text-orange-400 transition">Privacy Policy</div>
          <div className="opacity-80 text-zinc-200 text-[15px] mb-2 cursor-pointer hover:text-orange-400 transition">Terms of Use</div>
          <div className="opacity-80 text-zinc-200 text-[15px] mb-2 cursor-pointer hover:text-orange-400 transition">Cookie Policy</div>
        </div>
        {/* Help */}
        <div className="flex-1 min-w-[120px]">
          <div className="font-bold mb-2 text-sm text-white">Help</div>
          <div className="opacity-80 text-zinc-200 text-[15px] mb-2 cursor-pointer hover:text-orange-400 transition">Help Center</div>
          <div className="opacity-80 text-zinc-200 text-[15px] mb-2 cursor-pointer hover:text-orange-400 transition">FAQ</div>
          <div className="opacity-80 text-zinc-200 text-[15px] mb-2 cursor-pointer hover:text-orange-400 transition">How it Works</div>
        </div>
        {/* Social */}
        <div className="flex-1 min-w-[140px]">
          <div className="font-bold mb-2 text-sm text-white">Social</div>
          <div className="flex gap-2 flex-wrap">
            <a href="https://instagram.com/feelflick" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
              className="inline-flex items-center justify-center rounded-full bg-white/10 w-8 h-8 mr-1 mb-1 text-lg text-white border-none cursor-pointer hover:bg-orange-500/80 hover:text-white transition"
            >
              <FaInstagram />
            </a>
            <a href="https://tiktok.com/@feelflick" target="_blank" rel="noopener noreferrer" aria-label="TikTok"
              className="inline-flex items-center justify-center rounded-full bg-white/10 w-8 h-8 mr-1 mb-1 text-lg text-white border-none cursor-pointer hover:bg-orange-500/80 hover:text-white transition"
            >
              <FaTiktok />
            </a>
          </div>
        </div>
      </div>
      {/* Copyright */}
      <div className="text-center text-white text-[13px] opacity-20 mt-11 tracking-wide font-normal select-none">
        &copy; {new Date().getFullYear()} FeelFlick &mdash; All rights reserved.
      </div>
    </footer>
  );
}
