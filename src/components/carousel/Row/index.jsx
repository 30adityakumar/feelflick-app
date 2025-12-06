// src/components/carousel/Row/index.jsx
import { memo, useRef, useState, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useVirtualization } from '../hooks/useVirtualization'
import { MovieCard } from '../CardContent/MovieCard'
import { useInViewOnce } from '../hooks/useInViewOnce'

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
  const side = direction === 'left' ? 'left-2 sm:left-4' : 'right-2 sm:right-4'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        absolute ${side} top-1/2 -translate-y-1/2 z-40 p-2
        rounded-full bg-black/80 hover:bg-black/95 border border-white/30 hover:border-white/50
        backdrop-blur-sm shadow-2xl hover:shadow-white/10
        transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/60
      `}
      aria-label={`Scroll ${direction}`}
    >
      <Icon className="h-5 w-5 text-white" />
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
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }, [])

  const handleHover = useCallback((id) => setExpandedId(id), [])
  const handleLeave = useCallback(() => setExpandedId(null), [])

  const { ref: rowRef, hasBeenInView } = useInViewOnce({
    threshold: 0.15,
    rootMargin: '60px',
  })


  if (loading) {
    return (
      <section className={`py-6 sm:py-8 ${className}`} aria-label={`${title} loading`}>
        <div className="px-4 sm:px-6 lg:px-8 mb-5">
          <div className="flex items-center gap-3 h-8">
            <div className="h-5 w-5 bg-white/10 rounded-full animate-pulse" />
            <div className="h-6 w-32 bg-white/10 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 sm:gap-5 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-none" style={{ width: itemWidth, height: itemHeight }}>
              <div className="w-full h-full rounded-xl bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error || items.length === 0) {
    return (
      <section className={`py-6 sm:py-8 ${className}`} aria-label={`${title} unavailable`}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-8 mb-8">
            <div className="h-5 w-5 bg-white/20 rounded-full" />
            <div className="h-6 w-40 bg-white/10 rounded-md" />
          </div>
          <div className="flex items-center gap-2 py-8 text-white/40 text-sm">
            <div className="h-5 w-5 bg-white/20 rounded-full" />
            <span>Couldn&apos;t load {title.toLowerCase()}</span>
          </div>
        </div>
      </section>
    )
  }

  // inside CarouselRow component

return (
  <section
    className={`
      relative
      py-6 sm:py-8
      ${className}
    `}
    role="region"
    aria-label={title}
  >
    <div className="px-4 sm:px-6 lg:px-8 mb-4 flex items-center gap-2">
      <h2 className="text-[1.1rem] sm:text-[1.3rem] font-semibold text-white tracking-tight">
        {title}
      </h2>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-white/40 via-white/10 to-transparent opacity-60" />
    </div>


    <ScrollButton
      direction="left"
      onClick={() => scroll('left')}
      visible={scrollState.canScrollLeft}
    />
    <ScrollButton
      direction="right"
      onClick={() => scroll('right')}
      visible={scrollState.canScrollRight}
    />

    <div
    ref={scrollRef}
    className="flex gap-4 sm:gap-5 overflow-x-auto overflow-visible px-4 sm:px-6 lg:px-8 pb-4
        snap-x snap-mandatory scrollbar-hide scroll-smooth select-none
        [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [ms-overflow-style:none]"
    style={{
        scrollPaddingLeft: '1.5rem',
        scrollPaddingRight: '1.5rem',
        '--gap': '1.25rem',
        minHeight: itemHeight * 1.15, // slightly more than 1.08, gives room
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
  </section>
)

})

CarouselRow.displayName = 'CarouselRow'
export default CarouselRow
