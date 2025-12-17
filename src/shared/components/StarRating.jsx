/**
 * StarRating Component - v2.0
 * Intuitive 1-10 rating scale using 10 half-stars
 * 
 * Features:
 * - 10-point scale (each half-star = 1 point)
 * - Smooth hover effects without layout shifts
 * - Clear visual feedback
 * - Accessible keyboard navigation
 * 
 * Usage:
 *   <StarRating 
 *     value={8} 
 *     onChange={(rating) => handleRating(rating)}
 *     readonly={false}
 *     showLabel={true}
 *   />
 */

import { useState, useRef, useEffect } from 'react'
import { Star, X } from 'lucide-react'

export default function StarRating({ 
  value = 0,              // Current rating (0-10)
  onChange = null,        // Callback when rating changes
  readonly = false,       // Display only mode
  size = 'md',           // 'sm', 'md', 'lg'
  showLabel = true,      // Show numeric label
  showClearButton = true, // Show clear button when rated
  className = ''
}) {
  const [hoverValue, setHoverValue] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef(null)
  
  // Size configurations
  const sizeConfig = {
    sm: {
      star: 'h-3.5 w-3.5',
      gap: 'gap-0.5',
      label: 'text-xs',
      padding: 'p-1'
    },
    md: {
      star: 'h-5 w-5',
      gap: 'gap-1',
      label: 'text-sm',
      padding: 'p-1.5'
    },
    lg: {
      star: 'h-6 w-6',
      gap: 'gap-1.5',
      label: 'text-base',
      padding: 'p-2'
    }
  }
  
  const config = sizeConfig[size]
  const displayValue = hoverValue || value
  const isInteractive = !readonly && onChange
  
  // Calculate which star index to fill up to
  const filledCount = Math.floor(displayValue)
  
  // Handle click on a star
  const handleStarClick = (starIndex) => {
    if (!isInteractive) return
    
    // Star index is 1-10
    const newRating = starIndex
    
    // If clicking same rating, clear it
    if (newRating === value) {
      onChange(0)
    } else {
      onChange(newRating)
    }
  }
  
  // Handle hover
  const handleStarHover = (starIndex) => {
    if (!isInteractive) return
    setHoverValue(starIndex)
  }
  
  const handleContainerLeave = () => {
    setHoverValue(0)
  }
  
  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isInteractive) return
    
    if (e.key === 'ArrowRight' && value < 10) {
      onChange(value + 1)
    } else if (e.key === 'ArrowLeft' && value > 0) {
      onChange(value - 1)
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
      onChange(0)
    }
  }
  
  // Render individual star
  const renderStar = (index) => {
    const isFilled = index <= filledCount
    const isHovered = index <= (hoverValue || 0)
    const isActive = isFilled || isHovered
    
    return (
      <button
        key={index}
        type="button"
        disabled={readonly}
        onClick={() => handleStarClick(index)}
        onMouseEnter={() => handleStarHover(index)}
        aria-label={`Rate ${index} out of 10`}
        className={`
          relative transition-all duration-150
          ${isInteractive ? 'cursor-pointer' : 'cursor-default'}
          ${isInteractive && 'hover:scale-110 active:scale-95'}
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black rounded-sm
        `}
        style={{
          // Prevent layout shift by using transform instead of scale on hover
          transform: 'translateZ(0)', // Enable GPU acceleration
          willChange: 'transform' // Optimize for animations
        }}
      >
        <Star 
          className={`
            ${config.star}
            transition-all duration-150
            ${isActive ? 'text-yellow-400' : 'text-white/20'}
            ${isHovered && !readonly ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : ''}
          `}
          fill={isActive ? 'currentColor' : 'none'}
          strokeWidth={2}
        />
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
      aria-label={`Rating: ${value} out of 10`}
      aria-valuemin={0}
      aria-valuemax={10}
      aria-valuenow={value}
    >
      {/* 10 Stars */}
      <div className={`flex items-center ${config.gap}`}>
        {Array.from({ length: 10 }, (_, i) => renderStar(i + 1))}
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
            {displayValue > 0 ? `${displayValue}/10` : '—'}
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
      
      {/* Hover hint (only show when interactive and not rated yet) */}
      {isInteractive && value === 0 && hoverValue === 0 && !isFocused && (
        <span className="ml-2 text-xs text-white/40 italic">
          Click to rate
        </span>
      )}
    </div>
  )
}
