// src/features/home/components/Header.jsx
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Menu, X, Film, Sparkles, ChevronDown, LogOut, Settings, User, Heart } from 'lucide-react'

export default function Header() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-gradient-to-r from-[#0a121a]/95 via-[#0d1722]/95 to-[#0c1017]/95 border-b border-white/5">
      {/* Atmospheric gradient glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-amber-500/5 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo - Cinematic Gradient */}
          <Link to="/home" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
              <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-amber-500 flex items-center justify-center shadow-xl shadow-purple-500/50 group-hover:shadow-pink-500/50 transition-all duration-300 group-hover:scale-105">
                <Film className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:via-pink-300 group-hover:to-amber-300 transition-all duration-300">
              FeelFlick
            </span>
          </Link>

          {/* Desktop Navigation - Premium Feel */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/home" icon={<Sparkles className="h-4 w-4" />}>
              Discover
            </NavLink>
            <NavLink to="/watchlist" icon={<Heart className="h-4 w-4" />}>
              My List
            </NavLink>
            <NavLink to="/preferences" icon={<Settings className="h-4 w-4" />}>
              Preferences
            </NavLink>
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all duration-300 group"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                    {user.user_metadata?.name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-white/60 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#0d1722]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">
                    <div className="p-4 border-b border-white/10">
                      <p className="text-sm font-semibold text-white">{user.user_metadata?.name || 'User'}</p>
                      <p className="text-xs text-white/50 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <DropdownItem icon={<User />} onClick={() => navigate('/account')}>
                        Account Settings
                      </DropdownItem>
                      <DropdownItem icon={<Settings />} onClick={() => navigate('/preferences')}>
                        Preferences
                      </DropdownItem>
                      <DropdownItem icon={<Heart />} onClick={() => navigate('/watchlist')}>
                        My Watchlist
                      </DropdownItem>
                      <div className="h-px bg-white/10 my-2" />
                      <DropdownItem icon={<LogOut />} onClick={handleSignOut} danger>
                        Sign Out
                      </DropdownItem>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white font-semibold text-sm shadow-xl shadow-purple-500/50 hover:shadow-pink-500/50 hover:scale-105 transition-all duration-300"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300"
          >
            {menuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu - Cinematic Slide-down */}
        {menuOpen && (
          <div className="md:hidden py-6 border-t border-white/10 animate-fade-in">
            <div className="space-y-2">
              <MobileNavLink to="/home" icon={<Sparkles />} onClick={() => setMenuOpen(false)}>
                Discover
              </MobileNavLink>
              <MobileNavLink to="/watchlist" icon={<Heart />} onClick={() => setMenuOpen(false)}>
                My List
              </MobileNavLink>
              <MobileNavLink to="/preferences" icon={<Settings />} onClick={() => setMenuOpen(false)}>
                Preferences
              </MobileNavLink>
              {user && (
                <>
                  <div className="h-px bg-white/10 my-3" />
                  <MobileNavLink to="/account" icon={<User />} onClick={() => setMenuOpen(false)}>
                    Account Settings
                  </MobileNavLink>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-400 hover:bg-red-500/10 transition-all duration-300 group"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </>
              )}
              {!user && (
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white font-semibold text-center shadow-xl shadow-purple-500/50 hover:shadow-pink-500/50 transition-all duration-300"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </header>
  )
}

// Desktop Navigation Link Component
function NavLink({ to, icon, children }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 group"
    >
      <span className="text-white/50 group-hover:text-purple-400 transition-colors duration-300">
        {icon}
      </span>
      {children}
    </Link>
  )
}

// Dropdown Item Component
function DropdownItem({ icon, onClick, children, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-300 group ${
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-white/80 hover:text-white hover:bg-white/10'
      }`}
    >
      <span className={`h-4 w-4 ${danger ? 'text-red-400' : 'text-white/50 group-hover:text-purple-400'} transition-colors duration-300`}>
        {icon}
      </span>
      {children}
    </button>
  )
}

// Mobile Navigation Link Component
function MobileNavLink({ to, icon, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 group"
    >
      <span className="h-5 w-5 text-white/50 group-hover:text-purple-400 transition-colors duration-300">
        {icon}
      </span>
      <span className="font-semibold">{children}</span>
    </Link>
  )
}
