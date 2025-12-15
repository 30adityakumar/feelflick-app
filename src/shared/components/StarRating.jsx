// src/shared/components/StarRating.jsx

/**
 * StarRating Component
 * 
 * Interactive star rating component (1-5 stars).
 * Supports half-stars, hover preview, and animations.
 * 
 * @component
 */

import { useState } from 'react'
import { Star } from 'lucide-react'
import './StarRating.css'

export default function StarRating({
  value = 0, // Current rating (0-5)
  onChange,
  size = 'md', // 'sm', 'md', 'lg'
  readonly = false,
  showValue = true,
  showLabel = true,
  allowHalf = false, // Allow half-star ratings (0.5, 1.5, etc.)
  disabled = false,
  className = ''
}) {
  const [hoverValue, setHoverValue] = useState(null)

  const starSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  const handleClick = (rating) => {
    if (readonly || disabled) return
    onChange?.(rating)
  }

  const handleMouseEnter = (rating) => {
    if (readonly || disabled) return
    setHoverValue(rating)
  }

  const handleMouseLeave = () => {
    setHoverValue(null)
  }

  const displayValue = hoverValue !== null ? hoverValue : value
  const totalStars = 5

  return (
    <div className={`star-rating ${className}`}>
      {showLabel && (
        <label className="star-rating__label">
          Your Rating
        </label>
      )}

      <div className="star-rating__container">
        {/* Stars */}
        <div 
          className={`star-rating__stars ${readonly ? 'star-rating__stars--readonly' : ''}`}
          onMouseLeave={handleMouseLeave}
        >
          {Array.from({ length: totalStars }, (_, i) => {
            const starValue = i + 1
            const isFilled = displayValue >= starValue
            const isHalfFilled = allowHalf && displayValue >= starValue - 0.5 && displayValue < starValue

            return (
              <div
                key={i}
                className={`star-rating__star-wrapper ${starSizes[size]}`}
              >
                {/* Full Star Click Area */}
                <button
                  type="button"
                  className={`
                    star-rating__star
                    ${isFilled ? 'star-rating__star--filled' : ''}
                    ${isHalfFilled ? 'star-rating__star--half' : ''}
                    ${disabled ? 'star-rating__star--disabled' : ''}
                  `}
                  onClick={() => handleClick(starValue)}
                  onMouseEnter={() => handleMouseEnter(starValue)}
                  disabled={disabled || readonly}
                  aria-label={`Rate ${starValue} stars`}
                >
                  <Star
                    className={`star-rating__star-icon ${starSizes[size]}`}
                    fill={isFilled || isHalfFilled ? 'currentColor' : 'none'}
                  />
                </button>

                {/* Half Star Click Area (if enabled) */}
                {allowHalf && (
                  <button
                    type="button"
                    className="star-rating__half-overlay"
                    onClick={() => handleClick(starValue - 0.5)}
                    onMouseEnter={() => handleMouseEnter(starValue - 0.5)}
                    disabled={disabled || readonly}
                    aria-label={`Rate ${starValue - 0.5} stars`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Value Display */}
        {showValue && (
          <div className="star-rating__value">
            {displayValue > 0 ? (
              <span className="star-rating__value-text">
                {displayValue.toFixed(1)} / 5.0
              </span>
            ) : (
              <span className="star-rating__value-placeholder">
                No rating yet
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover Hint */}
      {!readonly && !disabled && hoverValue && (
        <div className="star-rating__hint">
          {getRatingLabel(hoverValue)}
        </div>
      )}
    </div>
  )
}

/**
 * Compact star rating (display only, no interaction)
 */
export function StarRatingDisplay({
  value = 0,
  size = 'sm',
  showValue = true,
  className = ''
}) {
  return (
    <StarRating
      value={value}
      size={size}
      showValue={showValue}
      showLabel={false}
      readonly={true}
      className={className}
    />
  )
}

/**
 * Get descriptive label for rating value
 */
function getRatingLabel(rating) {
  if (rating <= 1) return 'Terrible'
  if (rating <= 2) return 'Bad'
  if (rating <= 3) return 'Okay'
  if (rating <= 4) return 'Good'
  return 'Excellent'
}
