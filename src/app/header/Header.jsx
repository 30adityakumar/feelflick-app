// src/features/home/components/Header.jsx
import { useState, useEffect, useRef } from 'react'
import { Film, TrendingUp, Users, Sparkles, Sun } from 'lucide-react'

export default function Header() {
  const [activeCategory, setActiveCategory] = useState('For You')
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const headerRef = useRef(null)

  const categories = [
    { name: 'For You', icon: Sparkles },
    { name: 'Trending', icon: TrendingUp },
    { name: 'Movies', icon: Film },
    { name: 'Community', icon: Users },
    { name: 'Top Picks', icon: Sun },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show header when scrolling up, hide when scrolling down (after 100px)
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <>
      {/* Header Container with Hide/Show Animation */}
      <header
        ref={headerRef}
        className={`sticky top-0 z-40 transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Backdrop Blur Container */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a121a]/95 via-[#0a121a]/90 to-[#0a121a]/80 backdrop-blur-xl border-b border-white/5" />
        
        {/* Ambient Glow Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-30" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl opacity-20" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Categories Navigation */}
            <nav className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide flex-1">
              {categories.map(({ name, icon: Icon }) => {
                const isActive = activeCategory === name
                return (
                  <button
                    key={name}
                    onClick={() => setActiveCategory(name)}
                    className={`group relative flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full font-medium text-sm sm:text-base whitespace-nowrap transition-all duration-300 ${
                      isActive
                        ? 'text-white shadow-lg shadow-purple-500/30'
                        : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                    }`}
                  >
                    {/* Active Gradient Background */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 opacity-100" />
                    )}
                    
                    {/* Icon & Text */}
                    <Icon className={`relative h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 ${
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    }`} />
                    <span className="relative font-semibold">{name}</span>
                    
                    {/* Hover Glow Effect */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-amber-500/0 group-hover:from-purple-500/20 group-hover:via-pink-500/20 group-hover:to-amber-500/20 transition-all duration-300" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content jump */}
      <div className="h-0" />

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  )
}
