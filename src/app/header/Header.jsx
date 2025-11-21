// src/app/header/Header.jsx
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase/client';
import {
  Home,
  Compass,
  Search as SearchIcon,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings,
  Bookmark,
  Clock,
  Film,
  Heart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('up');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const hdrRef = useRef(null);
  const dropdownRef = useRef(null);

  // User session
  useEffect(() => {
    let unsub;

    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };

    getUser();

    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user || null);
    });
    unsub = data?.subscription?.unsubscribe;

    return () => typeof unsub === 'function' && unsub();
  }, []);

  // Smart scroll with hidden/show on scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 10);

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection('down');
        setDropdownOpen(false);
      } else {
        setScrollDirection('up');
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  // Set CSS variable for header height
  useEffect(() => {
    const setVar = () => {
      const h = hdrRef.current?.offsetHeight || 64;
      document.documentElement.style.setProperty('--hdr-h', `${h}px`);
    };

    setVar();
    const ro = new ResizeObserver(setVar);
    if (hdrRef.current) ro.observe(hdrRef.current);
    return () => ro.disconnect();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    navigate('/');
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url || null;

  const isMobile = window.innerWidth < 768;

  // Navigation items
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/discover', icon: Compass, label: 'Discover' },
    { to: '/watchlist', icon: Bookmark, label: 'Watchlist' },
    { to: '/history', icon: Clock, label: 'History' },
  ];

  return (
    <>
      {/* Desktop & Tablet Header - Glassmorphism with purplish theme */}
      <motion.header
        ref={hdrRef}
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out
          backdrop-blur-xl bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-purple-900/80
          border-b border-purple-500/30 shadow-lg
          ${scrolled ? 'py-3' : 'py-4'} 
          ${scrollDirection === 'down' && scrolled ? '-translate-y-full' : 'translate-y-0'}
          ${isMobile ? 'hidden' : 'block'}
        `}
        initial={{ y: -100 }}
        animate={{ y: scrolled && scrollDirection === 'down' ? -100 : 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Inspired by Apple/Netflix clean branding */}
            <motion.div
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Film className="h-8 w-8 text-purple-400" />
              <Link
                to="/"
                className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-600 bg-clip-text text-transparent hover:from-purple-300 hover:to-purple-500 transition-all duration-300"
              >
                FeelFlick
              </Link>
            </motion.div>

            {/* Search Bar - Prominent like Netflix */}
            <AnimatePresence>
              {searchOpen ? (
                <motion.div
                  className="flex-1 max-w-md mx-8 relative"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-300" />
                    <input
                      type="text"
                      placeholder="Search movies, shows..."
                      className="w-full pl-12 pr-4 py-3 rounded-full bg-white/10 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
                      onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  onClick={() => setSearchOpen(true)}
                  className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-purple-500/30 text-purple-300 hover:text-white transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <SearchIcon className="h-5 w-5" />
                  <span>Search</span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Navigation Links - Minimalist like Apple */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-3 py-2 rounded-full text-purple-300 hover:text-white hover:bg-white/10 transition-all duration-200 ${
                        isActive ? 'text-white bg-white/20' : ''
                      }`
                    }
                    whileHover={{ scale: 1.05 }}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`h-5 w-5 ${isActive ? 'text-purple-400' : ''}`} />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* User Profile Dropdown - Elegant like Prime */}
            <div className="relative" ref={dropdownRef}>
              <motion.button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-purple-500/30 text-white transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="h-8 w-8 rounded-full" />
                ) : (
                  <UserIcon className="h-8 w-8" />
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-48 bg-gradient-to-b from-purple-800/95 to-indigo-800/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl py-2"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="px-4 py-3 border-b border-purple-500/20">
                      <p className="text-white font-medium">{userName}</p>
                      <p className="text-purple-300 text-sm">{userEmail}</p>
                    </div>
                    <Link
                      to="/account"
                      className="flex items-center space-x-3 px-4 py-3 text-purple-300 hover:text-white hover:bg-purple-500/20 transition-all w-full"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <UserIcon className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center space-x-3 px-4 py-3 text-purple-300 hover:text-white hover:bg-purple-500/20 transition-all w-full"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-3 px-4 py-3 text-purple-300 hover:text-white hover:bg-purple-500/20 transition-all w-full"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Bottom Navigation - Persistent like Plex/Netflix mobile */}
      {isMobile && (
        <motion.footer
          className={`
            fixed bottom-0 left-0 right-0 z-40
            backdrop-blur-xl bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-900/90
            border-t border-purple-500/30 shadow-lg
            py-2 px-4
          `}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <nav className="flex items-center justify-around max-w-2xl mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'text-purple-400 bg-white/10 scale-110'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`
                  }
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`h-6 w-6 ${isActive ? 'fill-purple-400' : ''}`} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
            {/* Mobile Search Button */}
            <motion.button
              onClick={onOpenSearch || (() => setSearchOpen(true))}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <SearchIcon className="h-6 w-6" />
              <span className="text-xs font-medium">Search</span>
            </motion.button>
            {/* Mobile Account Button */}
            <Link
              to="/account"
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-purple-500/50 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{userName.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <span className="text-xs font-medium">Account</span>
            </Link>
          </nav>
        </motion.footer>
      )}
    </>
  );
}
