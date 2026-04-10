import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useVirtualization } from '../hooks/useVirtualization'
import { useMovieCardHover } from '../hooks/useMovieCardHover'
import { MovieCard } from '../CardContent/MovieCard'

export { CARD_EXPAND_DELAY_MS } from '../hooks/useMovieCardHover'

const SCROLL_AMOUNT = 0.82
const ITEM_GAP_PX = 16
// A4: consistent card widths at each breakpoint (height = width × 1.5)
const ITEM_WIDTHS = {
  xs: 140,  // < 640px  → height 210
  sm: 170,  // ≥ 640px  → height 255
  lg: 200,  // ≥ 1024px → height 300
  xl: 220,  // ≥ 1280px → height 330
}

function getItemWidth(viewportWidth) {
  if (viewportWidth >= 1280) return ITEM_WIDTHS.xl
  if (viewportWidth >= 1024) return ITEM_WIDTHS.lg
  if (viewportWidth >= 640) return ITEM_WIDTHS.sm
  return ITEM_WIDTHS.xs
}

// A3: scroll buttons — only render when visible (row hover gates this externally)
function ScrollButton({ direction, onClick, visible }) {
  if (!visible) return null

  const Icon = direction === 'left' ? ChevronLeft : ChevronRight
  const side = direction === 'left' ? 'left-3' : 'right-3'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute ${side} top-[calc(50%-1.5rem)] z-30 hidden h-9 w-9 items-center justify-center rounded-full border sm:flex`}
      style={{
        background: 'rgba(2, 6, 23, 0.85)',
        borderColor: 'rgba(168, 85, 247, 0.35)',
        boxShadow: '0 0 0 1px rgba(168,85,247,0.12), 0 4px 16px rgba(0,0,0,0.6)',
        transition: 'opacity 200ms ease, transform 200ms ease, background 200ms ease',
        backdropFilter: 'blur(8px)',
      }}
      aria-label={`Scroll ${direction}`}
    >
      <Icon className="h-4 w-4" style={{ color: 'var(--color-text)' }} strokeWidth={2.5} />
    </button>
  )
}

export const CarouselRow = memo(function CarouselRow({
  title = 'Featured',
  items = [],
  CardComponent = MovieCard,
  loading = false,
  error = null,
  priority = false,
  className = '',
  ...props
}) {
  const scrollRef = useRef(null)
  const hover = useMovieCardHover()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isRowHovered, setIsRowHovered] = useState(false) // A3: gate scroll button visibility
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  )
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false, // false until measured — prevents right-edge fade flash on mount
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mediaQuery) return undefined

    const sync = () => setPrefersReducedMotion(mediaQuery.matches)
    sync()
    mediaQuery.addEventListener?.('change', sync)
    return () => mediaQuery.removeEventListener?.('change', sync)
  }, [])

  useEffect(() => {
    const syncViewport = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', syncViewport, { passive: true })
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  const itemWidth = useMemo(() => getItemWidth(viewportWidth), [viewportWidth])
  const posterHeight = useMemo(() => Math.round(itemWidth * 1.5), [itemWidth])
  const expandedWidth = useMemo(
    () => Math.max(Math.round(itemWidth * 2.02), itemWidth + 220),
    [itemWidth]
  )
  const expandedHeight = useMemo(
    () => Math.round(posterHeight * 1.55),
    [posterHeight]
  )

  const virtualization = useVirtualization({
    items,
    itemWidth,
    gap: ITEM_GAP_PX,
    overscan: priority ? 5 : 3,
    containerRef: scrollRef,
  })

  const rafScrollRef = useRef(null)
  const updateScrollState = useCallback(() => {
    // Always defer to after paint — measuring during layout gives stale/zero dimensions
    if (rafScrollRef.current) cancelAnimationFrame(rafScrollRef.current)
    rafScrollRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current
      if (!el) return
      const { scrollLeft, scrollWidth, clientWidth } = el
      setScrollState({
        canScrollLeft: scrollLeft > 10,
        canScrollRight: scrollLeft < scrollWidth - clientWidth - 10,
      })
    })
  }, [])

  useEffect(() => {
    updateScrollState()
  }, [items.length, itemWidth, updateScrollState])

  useEffect(() => {
    if (!scrollRef.current || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(scrollRef.current)
    return () => {
      observer.disconnect()
      if (rafScrollRef.current) cancelAnimationFrame(rafScrollRef.current)
    }
  }, [updateScrollState])

  const scroll = useCallback(
    (direction) => {
      const el = scrollRef.current
      if (!el) return

      hover.closeNow()
      const amount = el.clientWidth * SCROLL_AMOUNT
      el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
    },
    [hover]
  )

  const handleScrollArea = useCallback(() => {
    updateScrollState()  // already RAF-deferred inside
    hover.closeNow()
  }, [hover, updateScrollState])

  const activeId = hover.openId ?? hover.intentId
  const activeExpandedIndex = useMemo(
    () => (hover.openId ? items.findIndex((item) => item.id === hover.openId) : -1),
    [items, hover.openId]
  )

  if (loading) {
    return (
      <section
        className={`relative overflow-visible pt-3 pb-6 sm:pt-4 sm:pb-8 ${className}`}
        aria-label={`${title} loading`}
      >
        <div
          className="mb-4 flex items-center gap-3"
          style={{ paddingInline: 'clamp(1rem, 4vw, 3rem)' }}
        >
          <div
            className="h-5 w-[3px] flex-shrink-0 rounded-full"
            style={{ background: 'linear-gradient(180deg, #c084fc 0%, #ec4899 100%)' }}
          />
          <div className="skeleton h-4 w-44 rounded-full" />
        </div>
        <div
          className="flex overflow-hidden"
          style={{
            gap: ITEM_GAP_PX,
            paddingInline: 'clamp(1rem, 4vw, 3rem)',
          }}
        >
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="skeleton animate-pulse flex-none rounded-xl bg-purple-950/20"
              style={{ width: itemWidth, height: posterHeight, animationDelay: `${index * 60}ms` }}
            />
          ))}
        </div>
      </section>
    )
  }

  if (error || items.length === 0) return null

  return (
    <section
      className={`relative overflow-visible pt-3 pb-6 sm:pt-4 sm:pb-8 ${className}`}
      aria-label={typeof title === 'string' ? title : 'Recommendation row'}
      onMouseEnter={() => setIsRowHovered(true)}
      onMouseLeave={() => setIsRowHovered(false)}
    >
      <div
        className="mb-4 flex items-center gap-3"
        style={{ paddingInline: 'clamp(1rem, 4vw, 3rem)' }}
      >
        <div
          className="h-5 w-[3px] flex-shrink-0 rounded-full"
          style={{ background: 'linear-gradient(180deg, #c084fc 0%, #ec4899 100%)' }}
        />
        <h2
          className="shrink-0 whitespace-nowrap text-[1.05rem] font-bold leading-tight tracking-tight"
          style={{
            color: 'rgba(248, 250, 252, 0.95)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {title}
        </h2>
        <div
          className="h-px flex-1"
          style={{
            background: 'linear-gradient(90deg, rgba(192, 132, 252, 0.18) 0%, rgba(248, 250, 252, 0.04) 45%, transparent 100%)',
          }}
        />
      </div>

      <div className="relative overflow-visible">
        {/* A2: edge fades — w-12 sm:w-16, left only when scrolled */}
        {scrollState.canScrollLeft ? (
          <div
            className="pointer-events-none absolute bottom-0 left-0 top-0 z-20 hidden w-12 sm:block sm:w-16"
            style={{ background: 'linear-gradient(to right, rgba(8, 6, 13, 0.96) 0%, rgba(8, 6, 13, 0) 100%)' }}
          />
        ) : null}
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-0 z-20 hidden w-12 sm:block sm:w-16"
          style={{ background: 'linear-gradient(to left, rgba(8, 6, 13, 0.96) 0%, rgba(8, 6, 13, 0) 100%)' }}
        />

        {/* A3: buttons only show when row is hovered and no card is expanded */}
        <ScrollButton
          direction="left"
          onClick={() => scroll('left')}
          visible={scrollState.canScrollLeft && isRowHovered && !activeId}
        />
        <ScrollButton
          direction="right"
          onClick={() => scroll('right')}
          visible={scrollState.canScrollRight && isRowHovered && !activeId}
        />

        <div
          ref={scrollRef}
          data-testid="carousel-scroll-region"
          className="flex snap-x snap-mandatory overflow-x-auto overflow-y-visible scroll-smooth select-none [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            gap: ITEM_GAP_PX,
            alignItems: 'flex-start',  // cards take their natural height, no stretch
            // minHeight reserves space for title below cards; expansion causes smooth animated shift
            minHeight: posterHeight + 64,
            paddingTop: '0.25rem',
            paddingBottom: '2rem',     // room for expanded card overflow below
            paddingInline: 'clamp(1rem, 4vw, 3rem)',
            scrollPaddingLeft: 'clamp(1rem, 4vw, 3rem)',
            scrollPaddingRight: 'clamp(1rem, 4vw, 3rem)',
            overflowY: 'visible',
          }}
          onScroll={handleScrollArea}
        >
          <div style={{ width: virtualization.leftSpacerWidth, flexShrink: 0 }} />

          {virtualization.visibleItems.map((item, localIndex) => {
            const globalIndex = virtualization.viewport.start + localIndex
            const hoverPhase =
              hover.openId === item.id ? 'expanded' : hover.intentId === item.id ? 'peek' : 'rest'
            const dimmed = Boolean(activeId) && activeId !== item.id
            const distanceFromExpanded =
              activeExpandedIndex === -1 ? null : globalIndex - activeExpandedIndex
            const siblingOffset =
              prefersReducedMotion || activeExpandedIndex === -1 || hover.openId === item.id
                ? 0
                : distanceFromExpanded === -1
                  ? -18
                  : distanceFromExpanded === 1
                    ? 18
                    : distanceFromExpanded === -2
                      ? -8
                      : distanceFromExpanded === 2
                        ? 8
                        : 0

            let expandAlign = 'center'
            if (
              globalIndex <= 1 ||
              (!scrollState.canScrollLeft && localIndex <= 1)
            ) {
              expandAlign = 'left'
            } else if (
              globalIndex >= items.length - 2 ||
              (!scrollState.canScrollRight &&
                localIndex >= virtualization.visibleItems.length - 2)
            ) {
              expandAlign = 'right'
            }

            return (
              <CardComponent
                key={`${item.id}-${globalIndex}`}
                item={item}
                index={globalIndex}
                hoverPhase={hoverPhase}
                isExpanded={hover.openId === item.id}
                width={itemWidth}
                height={posterHeight}
                expandedWidth={expandedWidth}
                expandedHeight={expandedHeight}
                priority={priority && globalIndex < 5}
                reducedMotion={prefersReducedMotion}
                dimmed={dimmed}
                canHover={hover.canHover}
                expandAlign={expandAlign}
                siblingOffset={siblingOffset}
                onCardEnter={hover.handleCardEnter}
                onCardLeave={hover.handleCardLeave}
                onCardFocus={hover.handleCardFocus}
                onCardBlur={hover.handleCardBlur}
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
