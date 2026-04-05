// src/components/carousel/Row/index.jsx
import { memo, useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useVirtualization } from '../hooks/useVirtualization'
import { MovieCard } from '../CardContent/MovieCard'

const SCROLL_AMOUNT = 0.8
const ITEM_WIDTHS = {
  sm: 160,
  md: 200,
  lg: 220,
  xl: 240,
}

function ScrollButton({ direction, onClick, visible }) {
  if (!visible) return null
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight
  const side = direction === 'left' ? 'left-3 sm:left-5' : 'right-3 sm:right-5'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        hidden sm:flex absolute ${side} top-1/2 -translate-y-1/2 z-40
        h-10 w-10 rounded-full
        bg-black/75 hover:bg-black/95
        border border-white/15 hover:border-purple-400/40
        backdrop-blur-sm shadow-xl hover:shadow-purple-500/20
        transition-all duration-200 hover:scale-110
        focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60
        items-center justify-center
      `}
      aria-label={`Scroll ${direction}`}
    >
      <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
    </button>
  )
}

export const CarouselRow = memo(function CarouselRow({
  title = 'Featured',
  items = [],
  CardComponent = MovieCard,
  loading = false,
  error = null,
  itemHeight = 330,
  priority = false,
  className = '',
  ...props
}) {
  const scrollRef = useRef(null)
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: true,
  })
  const [expandedId, setExpandedId] = useState(null)
  const hoverTimerRef = useRef(null)

  useEffect(() => () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current) }, [])

  const itemWidth = useMemo(() => {
    if (typeof window === 'undefined') return ITEM_WIDTHS.md
    if (window.innerWidth >= 1280) return ITEM_WIDTHS.xl
    if (window.innerWidth >= 1024) return ITEM_WIDTHS.lg
    if (window.innerWidth >= 640) return ITEM_WIDTHS.md
    return ITEM_WIDTHS.sm
  }, [])

  const virtualization = useVirtualization({
    items,
    itemWidth,
    overscan: priority ? 5 : 3,
    containerRef: scrollRef,
  })

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setScrollState({
      canScrollLeft: scrollLeft > 10,
      canScrollRight: scrollLeft < scrollWidth - clientWidth - 10,
    })
  }, [])

  const scroll = useCallback((direction) => {
    const el = scrollRef.current
    if (!el) return
    setExpandedId(null)
    const amount = el.clientWidth * SCROLL_AMOUNT
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }, [])

  // Delay matches Netflix's ~450ms before expanding — prevents accidental pops while scrolling
  const handleHover = useCallback((id) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => setExpandedId(id), 450)
  }, [])

  const handleLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setExpandedId(null)
  }, [])

  if (loading) {
    return (
      <section className={`py-5 sm:py-6 ${className}`} aria-label={`${title} loading`}>
        <div className="px-4 sm:px-6 lg:px-8 mb-4">
          <div className="flex items-center gap-3 h-8">
            <div className="w-[3px] h-5 rounded-full bg-purple-500/30 flex-shrink-0" />
            <div className="h-4 w-44 bg-white/8 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="flex gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="flex-none rounded-xl overflow-hidden"
              style={{ width: itemWidth, height: itemHeight }}
            >
              <div
                className="w-full h-full bg-purple-500/[0.04] animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error || items.length === 0) return null

  return (
    <section
      className={`relative py-5 sm:py-6 ${className}`}
      aria-label={title}
    >
      {/* Row header */}
      <div className="px-4 sm:px-6 lg:px-8 mb-3 sm:mb-4 flex items-center gap-3">
        <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-500 flex-shrink-0" />
        <h2 className="text-[1.05rem] sm:text-[1.15rem] font-bold text-white tracking-tight whitespace-nowrap">
          {title}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-purple-400/20 via-white/5 to-transparent" />
      </div>

      {/* Scroll area with edge fades + nav buttons */}
      <div className="relative">
        {/* Left edge fade */}
        {scrollState.canScrollLeft && (
          <div
            className="absolute left-0 top-0 bottom-4 w-20 sm:w-28 pointer-events-none z-30"
            style={{ background: 'linear-gradient(to right, #000 0%, transparent 100%)' }}
          />
        )}
        {/* Right edge fade — always show to hint at more content */}
        <div
          className="absolute right-0 top-0 bottom-4 w-20 sm:w-28 pointer-events-none z-30"
          style={{ background: 'linear-gradient(to left, #000 0%, transparent 100%)' }}
        />

        <ScrollButton direction="left" onClick={() => scroll('left')} visible={scrollState.canScrollLeft} />
        <ScrollButton direction="right" onClick={() => scroll('right')} visible={scrollState.canScrollRight} />

        <div
          ref={scrollRef}
          className="
            flex gap-3 sm:gap-4
            overflow-x-auto overflow-y-visible
            px-4 sm:px-6 lg:px-8 pb-4
            snap-x snap-mandatory
            scrollbar-hide scroll-smooth select-none
            [-webkit-overflow-scrolling:touch]
            [scrollbar-width:none]
            [ms-overflow-style:none]
          "
          style={{
            scrollPaddingLeft: '1.5rem',
            scrollPaddingRight: '1.5rem',
            '--gap': '1rem',
            minHeight: itemHeight * 1.6,
          }}
          onScroll={updateScrollState}
        >
          <div style={{ width: virtualization.leftSpacerWidth, flexShrink: 0 }} />

          {virtualization.visibleItems.map((item, localIndex) => {
            const globalIndex = virtualization.viewport.start + localIndex
            const isExpanded = expandedId === item.id

            return (
              <CardComponent
                key={`${item.id}-${globalIndex}`}
                item={item}
                index={globalIndex}
                isExpanded={isExpanded}
                onHover={handleHover}
                onLeave={handleLeave}
                width={itemWidth}
                height={itemHeight}
                priority={priority && globalIndex < 5}
                {...props}
              />
            )
          })}

          <div style={{ width: virtualization.rightSpacerWidth, flexShrink: 0 }} />
        </div>
      </div>
    </section>
  )
})

CarouselRow.displayName = 'CarouselRow'
export default CarouselRow
