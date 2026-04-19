/**
 * StarRating Component - v3.0
 * 5-star half-step UI mapping to integer 1-10 internally.
 *
 * Each star has a left half (odd value) and right half (even value):
 *   Star 1: left = 1, right = 2
 *   Star 2: left = 3, right = 4
 *   ...
 *   Star 5: left = 9, right = 10
 *
 * @param {number}   value          - Current rating (0-10 integer)
 * @param {function} onChange       - Callback with new integer 0-10
 * @param {boolean}  readonly       - Display only mode
 * @param {string}   size           - 'sm' | 'md' | 'lg'
 * @param {boolean}  showLabel      - Show numeric label
 * @param {boolean}  showClearButton - Show clear button when rated
 */

import { useState, useRef, useCallback } from 'react'
import { Star, X } from 'lucide-react'

// === SIZE CONFIGS ===

const SIZE_CONFIG = {
  sm: {
    star: 'h-4 w-4',
    gap: 'gap-0.5',
    label: 'text-xs',
    starPx: 16,
  },
  md: {
    star: 'h-6 w-6',
    gap: 'gap-1',
    label: 'text-sm',
    starPx: 24,
  },
  lg: {
    star: 'h-7 w-7',
    gap: 'gap-1.5',
    label: 'text-base',
    starPx: 28,
  },
}

// === HELPERS ===

/** Convert a 0-10 internal value to how many of the 5 stars are filled */
function starFillState(val) {
  const fullStars = Math.floor(val / 2)
  const hasHalf = val % 2 === 1
  return { fullStars, hasHalf }
}

/** Format display label: 0 → "—", 1 → "0.5", 2 → "1.0", ..., 10 → "5.0" */
function formatLabel(val) {
  if (val <= 0) return '—'
  return `${(val / 2).toFixed(1)}/5`
}

export default function StarRating({
  value = 0,
  onChange = null,
  readonly = false,
  size = 'md',
  showLabel = true,
  showClearButton = true,
  className = '',
}) {
  const [hoverValue, setHoverValue] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef(null)

  const config = SIZE_CONFIG[size]
  const displayValue = hoverValue || value
  const isInteractive = !readonly && onChange
  const { fullStars, hasHalf } = starFillState(displayValue)

  // Determine internal value (1-10) from click position within a star
  const getValueFromEvent = useCallback((e, starIndex) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    // starIndex is 1-based (1-5)
    // left half = starIndex * 2 - 1 (odd), right half = starIndex * 2 (even)
    return isLeftHalf ? starIndex * 2 - 1 : starIndex * 2
  }, [])

  const handleStarClick = useCallback((e, starIndex) => {
    if (!isInteractive) return
    const newRating = getValueFromEvent(e, starIndex)
    // Toggle off if clicking the same value
    onChange(newRating === value ? 0 : newRating)
  }, [isInteractive, getValueFromEvent, value, onChange])

  const handleStarHover = useCallback((e, starIndex) => {
    if (!isInteractive) return
    setHoverValue(getValueFromEvent(e, starIndex))
  }, [isInteractive, getValueFromEvent])

  const handleContainerLeave = useCallback(() => {
    setHoverValue(0)
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (!isInteractive) return
    if (e.key === 'ArrowRight' && value < 10) {
      onChange(value + 1)
    } else if (e.key === 'ArrowLeft' && value > 0) {
      onChange(value - 1)
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
      onChange(0)
    }
  }, [isInteractive, value, onChange])

  const renderStar = (starIndex) => {
    // starIndex is 1-5
    const isFull = starIndex <= fullStars
    const isHalfFilled = !isFull && hasHalf && starIndex === fullStars + 1
    const isEmpty = !isFull && !isHalfFilled

    return (
      <button
        key={starIndex}
        type="button"
        disabled={readonly}
        onClick={(e) => handleStarClick(e, starIndex)}
        onMouseMove={(e) => handleStarHover(e, starIndex)}
        aria-label={`Rate ${starIndex} out of 5`}
        className={`
          relative transition-all duration-150
          ${isInteractive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black rounded-sm
        `}
      >
        {/* Empty star (always rendered as base layer) */}
        <Star
          className={`${config.star} text-white/20 transition-colors duration-150`}
          fill="none"
          strokeWidth={2}
        />

        {/* Filled overlay — full or half via clip-path */}
        {!isEmpty && (
          <Star
            className={`
              ${config.star} absolute inset-0 text-yellow-400 transition-all duration-150
              ${hoverValue > 0 && !readonly ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : ''}
            `}
            fill="currentColor"
            strokeWidth={2}
            style={isHalfFilled ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
          />
        )}
      </button>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center ${config.gap} ${className}`}
      onMouseLeave={handleContainerLeave}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={isInteractive ? 0 : -1}
      role={isInteractive ? 'slider' : 'img'}
      aria-label={`Rating: ${(value / 2).toFixed(1)} out of 5`}
      aria-valuemin={0}
      aria-valuemax={10}
      aria-valuenow={value}
    >
      {/* 5 Stars */}
      <div className={`flex items-center ${config.gap}`}>
        {Array.from({ length: 5 }, (_, i) => renderStar(i + 1))}
      </div>

      {/* Numeric Label */}
      {showLabel && (
        <div className="flex items-center gap-2 ml-1">
          <span
            className={`
              ${config.label} font-bold tabular-nums
              ${displayValue > 0 ? 'text-white' : 'text-white/40'}
              transition-colors duration-150
            `}
          >
            {formatLabel(displayValue)}
          </span>

          {/* Clear button */}
          {showClearButton && value > 0 && isInteractive && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onChange(0)
              }}
              className="
                h-5 w-5 rounded-full
                bg-white/10 hover:bg-white/20
                text-white/60 hover:text-white
                flex items-center justify-center
                transition-all duration-150
                active:scale-90
              "
              title="Clear rating"
              aria-label="Clear rating"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Hover hint */}
      {isInteractive && value === 0 && hoverValue === 0 && !isFocused && (
        <span className="ml-2 text-xs text-white/40 italic">
          Click to rate
        </span>
      )}
    </div>
  )
}
