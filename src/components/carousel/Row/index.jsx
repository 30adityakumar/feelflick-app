import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useVirtualization } from '../hooks/useVirtualization'
import { useMovieCardHover } from '../hooks/useMovieCardHover'
import { MovieCard } from '../CardContent/MovieCard'
import { track } from '@/shared/services/analytics'

export { CARD_EXPAND_DELAY_MS } from '../hooks/useMovieCardHover'

const SCROLL_AMOUNT = 0.82
const ITEM_GAP_PX = 16
const ITEM_WIDTHS = {
  xs: 140,
  sm: 170,
  lg: 200,
  xl: 220,
}

function getItemWidth(viewportWidth) {
  if (viewportWidth >= 1280) return ITEM_WIDTHS.xl
  if (viewportWidth >= 1024) return ITEM_WIDTHS.lg
  if (viewportWidth >= 640) return ITEM_WIDTHS.sm
  return ITEM_WIDTHS.xs
}

function ScrollButton({ direction, onClick, visible }) {
  if (!visible) return null

  const Icon = direction === 'left' ? ChevronLeft : ChevronRight
  const side = direction === 'left' ? 'left-3' : 'right-3'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute ${side} top-[calc(50%-1.5rem)] z-30 hidden h-11 w-11 items-center justify-center rounded-full border sm:flex`}
      style={{
        background: 'color-mix(in srgb, var(--color-surface-raised, #2e3135) 90%, transparent)',
        borderColor: 'var(--color-border-strong, #747a82)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.42)',
        transition: 'opacity 180ms ease, background 180ms ease, border-color 180ms ease',
        backdropFilter: 'blur(8px)',
        color: 'var(--color-text-primary, #f5f2eb)',
      }}
      aria-label={`Scroll ${direction}`}
    >
      <Icon className="h-4 w-4" strokeWidth={2.5} />
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
  onShuffle = null,
  ...props
}) {
  const scrollRef = useRef(null)
  const hover = useMovieCardHover({ scrollContainerRef: scrollRef })
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const shuffleCooldownRef = useRef(false)

  const handleShuffle = useCallback(() => {
    if (!onShuffle || shuffleCooldownRef.current) return
    shuffleCooldownRef.current = true
    setTimeout(() => { shuffleCooldownRef.current = false }, 2000)
    onShuffle()
  }, [onShuffle])
  const [isRowHovered, setIsRowHovered] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  )
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
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

  const virtualization = useVirtualization({
    items,
    itemWidth,
    gap: ITEM_GAP_PX,
    overscan: priority ? 5 : 3,
    containerRef: scrollRef,
  })

  const rafScrollRef = useRef(null)
  const scrollTrackTimerRef = useRef(null)

  const updateScrollState = useCallback(() => {
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
    updateScrollState()
    hover.closeNow()
    if (scrollTrackTimerRef.current) clearTimeout(scrollTrackTimerRef.current)
    scrollTrackTimerRef.current = setTimeout(() => {
      track('row_scrolled', { row_title: typeof title === 'string' ? title : undefined })
    }, 500)
  }, [hover, title, updateScrollState])

  if (loading) {
    return (
      <section
        className={`relative overflow-visible pt-3 pb-6 sm:pt-4 sm:pb-8 ${className}`}
        aria-label={`${title} loading`}
      >
        <div className="mb-4 flex items-center gap-3" style={{ paddingInline: 'clamp(1rem, 4vw, 3rem)' }}>
          <div className="h-5 w-[2px] bg-[var(--color-brand-accent,#e5636f)] opacity-70" />
          <div className="skeleton h-4 w-44 rounded-full" />
        </div>
        <div
          className="flex overflow-hidden"
          style={{ gap: ITEM_GAP_PX, paddingInline: 'clamp(1rem, 4vw, 3rem)' }}
        >
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="skeleton animate-pulse flex-none rounded-xl bg-[var(--color-surface-1,#171819)]"
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
      <div className="mb-4 flex items-center gap-3" style={{ paddingInline: 'clamp(1rem, 4vw, 3rem)' }}>
        <div className="h-5 w-[2px] bg-[var(--color-brand-accent,#e5636f)] opacity-70" />
        <h2 className="whitespace-nowrap text-[1.05rem] font-bold tracking-tight text-[var(--color-text-primary,#f5f2eb)] sm:text-[1.15rem]">
          {title}
        </h2>
        <div className="h-px flex-1 bg-linear-to-r from-[color-mix(in_srgb,var(--color-brand-accent,#e5636f)_20%,transparent)] via-[var(--color-border-subtle,#3a3d41)] to-transparent" />
        {onShuffle && (
          <button
            type="button"
            onClick={handleShuffle}
            aria-label="Shuffle this row"
            className="min-h-11 flex-none flex items-center gap-1 rounded-xl border border-[var(--color-border-subtle,#3a3d41)] bg-transparent px-3 py-2 text-[0.7rem] font-medium text-[var(--color-text-muted,#a5a198)] transition-colors hover:border-[var(--color-border-strong,#747a82)] hover:bg-[var(--color-surface-1,#171819)] hover:text-[var(--color-text-primary,#f5f2eb)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus,#f5f2eb)]"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
        )}
      </div>

      <div className="relative overflow-visible">
        {scrollState.canScrollLeft ? (
          <div
            className="pointer-events-none absolute bottom-0 left-0 top-0 z-20 hidden w-12 sm:block sm:w-16"
            style={{ background: 'linear-gradient(to right, rgba(15,16,16,0.98) 0%, rgba(15,16,16,0) 100%)' }}
          />
        ) : null}
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-0 z-20 hidden w-12 sm:block sm:w-16"
          style={{ background: 'linear-gradient(to left, rgba(15,16,16,0.98) 0%, rgba(15,16,16,0) 100%)' }}
        />

        <ScrollButton
          direction="left"
          onClick={() => scroll('left')}
          visible={scrollState.canScrollLeft && isRowHovered && !hover.hoveredId}
        />
        <ScrollButton
          direction="right"
          onClick={() => scroll('right')}
          visible={scrollState.canScrollRight && isRowHovered && !hover.hoveredId}
        />

        <div
          ref={scrollRef}
          data-testid="carousel-scroll-region"
          className="flex snap-x snap-mandatory overflow-x-auto overflow-y-visible scroll-smooth select-none [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] scrollbar-none [&::-webkit-scrollbar]:hidden"
          style={{
            gap: ITEM_GAP_PX,
            alignItems: 'flex-start',
            minHeight: posterHeight + 64,
            paddingTop: '0.75rem',
            paddingBottom: '2rem',
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
            const hovered = hover.hoveredId === item.id

            return (
              <CardComponent
                key={`${item.id}-${globalIndex}`}
                item={item}
                index={globalIndex}
                hovered={hovered}
                width={itemWidth}
                height={posterHeight}
                priority={priority && globalIndex < 5}
                reducedMotion={prefersReducedMotion}
                onCardEnter={hover.handleCardEnter}
                onCardLeave={hover.handleCardLeave}
                onCardFocus={hover.handleCardFocus}
                onCardBlur={hover.handleCardBlur}
                rowTitle={typeof title === 'string' ? title : undefined}
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
