// src/app/header/Header.jsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { 
  Home, Compass, Search as SearchIcon, ChevronDown, LogOut, 
  User as UserIcon, Settings, Bookmark, Clock, Loader2
} from 'lucide-react'

/**
 * Main Header Component
 * 
 * Features:
 * - Smart scroll behavior (hides on scroll down, shows on scroll up)
 * - Desktop navigation with dropdown menu
 * - Mobile bottom navigation
 * - User session management
 * - Search integration
 * - Loading states
 * - Keyboard navigation
 * - Touch-optimized mobile UX
 * 
 * Performance optimizations:
 * - requestAnimationFrame for scroll detection
 * - Debounced resize observer
 * - Memoized callbacks
 * - Efficient event cleanup
 */
export default function Header({ onOpenSearch }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  
  const [scrolled, setScrolled] = useState(false)
  const [scrollDirection, setScrollDirection] = useState('up')
  const [lastScrollY, setLastScrollY] = useState(0)
  
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  
  const hdrRef = useRef(null)
  const dropdownRef = useRef(null)
  const ticking = useRef(false)

  // User session management
  useEffect(() => {
    let mounted = true
    let unsubscribe

    const getUser = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (mounted) {
          if (error) {
            console.error('[Header] User fetch error:', error)
          }
          setUser(currentUser ?? null)
          setUserLoading(false)
        }
      } catch (err) {
        console.error('[Header] Unexpected error:', err)
        if (mounted) {
          setUser(null)
          setUserLoading(false)
        }
      }
    }

    getUser()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setUserLoading(false)
        
        // Reset avatar states when user changes
        setAvatarLoaded(false)
        setAvatarError(false)
      }
    })

    unsubscribe = subscription?.unsubscribe

    return () => {
      mounted = false
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  // Smart scroll with requestAnimationFrame
  useEffect(() => {
    let mounted = true

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          if (!mounted) return

          const currentScrollY = window.scrollY
          setScrolled(currentScrollY > 10)
          
          // Hide header on scroll down, show on scroll up
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setScrollDirection('down')
            setDropdownOpen(false) // Close dropdown when scrolling down
          } else {
            setScrollDirection('up')
          }
          
          setLastScrollY(currentScrollY)
          ticking.current = false
        })
        
        ticking.current = true
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      mounted = false
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [dropdownOpen])

  // Keyboard navigation for dropdown
  useEffect(() => {
    if (!dropdownOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dropdownOpen])

  // Set CSS variable for header height (for page layout calculations)
  useEffect(() => {
    let resizeTimeout

    const setHeaderHeight = () => {
      const height = hdrRef.current?.offsetHeight || 64
      document.documentElement.style.setProperty('--hdr-h', `${height}px`)
    }

    // Debounced resize observer
    const debouncedSetHeight = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(setHeaderHeight, 100)
    }

    setHeaderHeight()

    const resizeObserver = new ResizeObserver(debouncedSetHeight)
    if (hdrRef.current) {
      resizeObserver.observe(hdrRef.current)
    }

    return () => {
      clearTimeout(resizeTimeout)
      resizeObserver.disconnect()
    }
  }, [])

  // Memoized sign out handler
  const handleSignOut = useCallback(async () => {
    setSigningOut(true)
    
    try {
      await supabase.auth.signOut()
      setDropdownOpen(false)
      navigate('/')
    } catch (error) {
      console.error('[Header] Sign out error:', error)
      alert('Failed to sign out. Please try again.')
    } finally {
      setSigningOut(false)
    }
  }, [navigate])

  // Memoized dropdown toggle
  const toggleDropdown = useCallback(() => {
    setDropdownOpen(prev => !prev)
  }, [])

  // User display data
  const userName = user?.user_metadata?.name || 
                   user?.user_metadata?.full_name || 
                   user?.email?.split('@')[0] || 
                   'User'
  const userEmail = user?.email
  const userAvatar = user?.user_metadata?.avatar_url || null

  return (
    <>
      {/* Desktop / Tablet Header */}
      <header 
        ref={hdrRef}
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${scrolled 
            ? 'bg-[#0a0a0a]/95 backdrop-blur-xl shadow-lg shadow-purple-900/5 border-b border-white/5' 
            : 'bg-gradient-to-b from-black/95 via-black/80 to-transparent'
          }
          ${scrollDirection === 'down' ? 'md:-translate-y-full' : 'translate-y-0'}
        `}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo */}
            <Link 
              to="/home" 
              className="flex items-center gap-2 group relative"
              aria-label="FeelFlick Home"
            >
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                FEELFLICK
              </div>
              {/* Glow effect on hover */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" 
                aria-hidden="true"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav 
              className="hidden md:flex items-center gap-8"
              role="navigation"
              aria-label="Main navigation"
            >
              <DesktopNavLink to="/home">Home</DesktopNavLink>
              <DesktopNavLink to="/browse">Discover</DesktopNavLink>
              <DesktopNavLink to="/watchlist">Watchlist</DesktopNavLink>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Search Button */}
              <button 
                onClick={onOpenSearch}
                className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95 touch-target"
                aria-label="Open search"
                type="button"
              >
                <SearchIcon className="h-5 w-5" />
              </button>

              {/* User Section */}
              {userLoading ? (
                <div className="hidden md:flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-white/10 animate-pulse" />
                </div>
              ) : user ? (
                <div className="hidden md:block relative" ref={dropdownRef}>
                  <button 
                    onClick={toggleDropdown}
                    className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-full transition-all group touch-target"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                    type="button"
                  >
                    <UserAvatar 
                      userName={userName}
                      userAvatar={userAvatar}
                      avatarLoaded={avatarLoaded}
                      avatarError={avatarError}
                      setAvatarLoaded={setAvatarLoaded}
                      setAvatarError={setAvatarError}
                    />
                    <ChevronDown 
                      className={`h-4 w-4 text-white/70 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} 
                      aria-hidden="true"
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div 
                      className="absolute right-0 mt-3 w-60 rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      {/* User Info Header */}
                      <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                        <div className="font-bold text-white text-sm truncate">{userName}</div>
                        <div className="text-xs text-white/50 truncate">{userEmail}</div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-2">
                        <DropdownLink 
                          to="/account" 
                          icon={UserIcon}
                          onClick={() => setDropdownOpen(false)}
                        >
                          Profile
                        </DropdownLink>
                        <DropdownLink 
                          to="/watchlist" 
                          icon={Bookmark}
                          onClick={() => setDropdownOpen(false)}
                        >
                          Watchlist
                        </DropdownLink>
                        <DropdownLink 
                          to="/history" 
                          icon={Clock}
                          onClick={() => setDropdownOpen(false)}
                        >
                          History
                        </DropdownLink>
                        <DropdownLink 
                          to="/preferences" 
                          icon={Settings}
                          onClick={() => setDropdownOpen(false)}
                        >
                          Settings
                        </DropdownLink>
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-white/5 py-2 bg-white/[0.02]">
                        <button 
                          onClick={handleSignOut}
                          disabled={signingOut}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                          role="menuitem"
                          type="button"
                        >
                          {signingOut ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                          <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - ALWAYS visible */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-2 pt-2">
          <MobileNavLink to="/home" icon={Home} label="Home" />
          <MobileNavLink to="/browse" icon={Compass} label="Discover" />
          
          {/* Search Button (Mobile) */}
          <button 
            onClick={onOpenSearch}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-white/60 hover:text-white transition-colors active:scale-95 touch-target"
            aria-label="Open search"
            type="button"
          >
            <SearchIcon className="h-6 w-6" />
            <span className="text-[10px] font-medium">Search</span>
          </button>

          {/* Account Nav Item */}
          {userLoading ? (
            <div className="flex flex-col items-center gap-1 px-4 py-2">
              <div className="h-6 w-6 rounded-full bg-white/10 animate-pulse" />
              <span className="text-[10px] font-medium text-white/40">Account</span>
            </div>
          ) : user ? (
            <NavLink 
              to="/mobile-account"
              className={({ isActive }) => `
                flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 touch-target
                ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}
              `}
            >
              {({ isActive }) => (
                <>
                  <UserAvatar 
                    userName={userName}
                    userAvatar={userAvatar}
                    avatarLoaded={avatarLoaded}
                    avatarError={avatarError}
                    setAvatarLoaded={setAvatarLoaded}
                    setAvatarError={setAvatarError}
                    size="small"
                    isActive={isActive}
                  />
                  <span className={`text-[10px] font-medium ${isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold' : ''}`}>
                    Account
                  </span>
                </>
              )}
            </NavLink>
          ) : null}
        </div>
      </nav>
    </>
  )
}

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

/**
 * User Avatar Component
 * Handles loading states, error states, and fallback to initials
 */
function UserAvatar({ 
  userName, 
  userAvatar, 
  avatarLoaded, 
  avatarError, 
  setAvatarLoaded, 
  setAvatarError,
  size = 'default',
  isActive = false
}) {
  const sizeClasses = size === 'small' ? 'h-6 w-6 text-[10px]' : 'h-9 w-9 text-sm'
  
  if (userAvatar && !avatarError) {
    return (
      <div className="relative">
        {!avatarLoaded && (
          <div className={`${sizeClasses} rounded-full bg-white/10 animate-pulse absolute inset-0`} />
        )}
        <img 
          src={userAvatar} 
          alt={userName} 
          className={`
            ${sizeClasses} rounded-full object-cover transition-all
            ${size === 'small' 
              ? isActive ? 'ring-2 ring-purple-500' : 'ring-1 ring-white/20'
              : 'ring-2 ring-white/10 group-hover:ring-purple-500/50'
            }
            ${avatarLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          onLoad={() => setAvatarLoaded(true)}
          onError={() => setAvatarError(true)}
          loading="lazy"
        />
      </div>
    )
  }

  // Fallback: User initials
  return (
    <div 
      className={`
        ${sizeClasses} rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
        flex items-center justify-center text-white font-bold 
        shadow-lg shadow-purple-500/20
        ${size === 'small' && isActive ? 'ring-2 ring-purple-400' : ''}
      `}
    >
      {userName.charAt(0).toUpperCase()}
    </div>
  )
}

/**
 * Desktop Navigation Link
 * With animated underline on hover/active
 */
function DesktopNavLink({ to, children }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        relative px-1 py-2 text-sm font-bold transition-colors duration-300 group
        ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}
      `}
    >
      {({ isActive }) => (
        <>
          {children}
          {/* Animated underline */}
          <span 
            className={`
              absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 
              transition-all duration-300 
              ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}
            `}
            aria-hidden="true"
          />
        </>
      )}
    </NavLink>
  )
}

/**
 * Dropdown Menu Link
 * With hover slide animation
 */
function DropdownLink({ to, icon: Icon, children, onClick }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all hover:translate-x-1 touch-target"
      role="menuitem"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{children}</span>
    </Link>
  )
}

/**
 * Mobile Navigation Link
 * With icon glow and gradient text on active
 */
function MobileNavLink({ to, icon: Icon, label }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 touch-target
        ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}
      `}
    >
      {({ isActive }) => (
        <>
          <Icon 
            className={`
              h-6 w-6 transition-all duration-300 
              ${isActive ? 'stroke-purple-400 scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : ''}
            `} 
            strokeWidth={isActive ? 2.5 : 2}
            aria-hidden="true"
          />
          <span 
            className={`
              text-[10px] font-medium transition-colors 
              ${isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold' : ''}
            `}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}