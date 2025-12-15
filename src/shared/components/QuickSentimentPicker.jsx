// src/shared/components/QuickSentimentPicker.jsx

/**
 * QuickSentimentPicker Component
 * 
 * Beautiful, intuitive sentiment picker with emojis.
 * Can be inline or popup, with hover effects and animations.
 * 
 * Usage:
 * - Inline: Always visible sentiment options
 * - Popup: Shows on trigger (button click)
 * - Compact: Smaller version for cards/lists
 * 
 * @component
 */

import { useState } from 'react'
import { Heart, ThumbsUp, Meh, ThumbsDown, X } from 'lucide-react'
import './QuickSentimentPicker.css'

const SENTIMENTS = [
  {
    value: 'loved',
    label: 'Loved it',
    emoji: '❤️',
    icon: Heart,
    color: '#ef4444', // red-500
    description: 'One of the best!'
  },
  {
    value: 'liked',
    label: 'Liked it',
    emoji: '👍',
    icon: ThumbsUp,
    color: '#10b981', // green-500
    description: 'Pretty good'
  },
  {
    value: 'meh',
    label: 'It was okay',
    emoji: '😐',
    icon: Meh,
    color: '#f59e0b', // amber-500
    description: 'Nothing special'
  },
  {
    value: 'disliked',
    label: 'Didn\'t like it',
    emoji: '👎',
    icon: ThumbsDown,
    color: '#f97316', // orange-500
    description: 'Not for me'
  },
  {
    value: 'hated',
    label: 'Hated it',
    emoji: '😡',
    icon: X,
    color: '#dc2626', // red-600
    description: 'Terrible'
  }
]

/**
 * Main QuickSentimentPicker Component
 */
export default function QuickSentimentPicker({
  value = null,
  onChange,
  variant = 'inline', // 'inline', 'popup', 'compact'
  size = 'md', // 'sm', 'md', 'lg'
  showLabels = true,
  showDescriptions = false,
  disabled = false,
  className = ''
}) {
  const [hoveredSentiment, setHoveredSentiment] = useState(null)

  const handleSelect = (sentiment) => {
    if (disabled) return
    
    // Toggle if same sentiment clicked
    const newValue = value === sentiment ? null : sentiment
    onChange?.(newValue)
  }

  const sizeClasses = {
    sm: 'sentiment-picker--sm',
    md: 'sentiment-picker--md',
    lg: 'sentiment-picker--lg'
  }

  const variantClasses = {
    inline: 'sentiment-picker--inline',
    popup: 'sentiment-picker--popup',
    compact: 'sentiment-picker--compact'
  }

  return (
    <div 
      className={`
        sentiment-picker 
        ${sizeClasses[size]} 
        ${variantClasses[variant]}
        ${disabled ? 'sentiment-picker--disabled' : ''}
        ${className}
      `}
    >
      <div className="sentiment-picker__options">
        {SENTIMENTS.map((sentiment) => {
          const isSelected = value === sentiment.value
          const isHovered = hoveredSentiment === sentiment.value
          const Icon = sentiment.icon

          return (
            <button
              key={sentiment.value}
              type="button"
              className={`
                sentiment-option
                ${isSelected ? 'sentiment-option--selected' : ''}
                ${isHovered ? 'sentiment-option--hovered' : ''}
              `}
              onClick={() => handleSelect(sentiment.value)}
              onMouseEnter={() => setHoveredSentiment(sentiment.value)}
              onMouseLeave={() => setHoveredSentiment(null)}
              disabled={disabled}
              style={{
                '--sentiment-color': sentiment.color
              }}
              title={sentiment.description}
            >
              {/* Emoji (large) */}
              <span className="sentiment-option__emoji">
                {sentiment.emoji}
              </span>

              {/* Icon (small, fallback) */}
              {variant === 'compact' && (
                <Icon 
                  className="sentiment-option__icon" 
                  size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
                />
              )}

              {/* Label */}
              {showLabels && variant !== 'compact' && (
                <span className="sentiment-option__label">
                  {sentiment.label}
                </span>
              )}

              {/* Description (on hover) */}
              {showDescriptions && isHovered && (
                <span className="sentiment-option__description">
                  {sentiment.description}
                </span>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <span className="sentiment-option__check">✓</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Current selection display (for compact variant) */}
      {variant === 'compact' && value && (
        <div className="sentiment-picker__current">
          <span className="sentiment-picker__current-emoji">
            {SENTIMENTS.find(s => s.value === value)?.emoji}
          </span>
          {showLabels && (
            <span className="sentiment-picker__current-label">
              {SENTIMENTS.find(s => s.value === value)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Popup variant with trigger button
 */
export function SentimentPickerPopup({
  value = null,
  onChange,
  triggerText = 'Rate this',
  buttonClassName = '',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (sentiment) => {
    onChange?.(sentiment)
    setIsOpen(false)
  }

  const selectedSentiment = SENTIMENTS.find(s => s.value === value)

  return (
    <div className="sentiment-picker-popup">
      {/* Trigger button */}
      <button
        type="button"
        className={`sentiment-picker-popup__trigger ${buttonClassName}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {selectedSentiment ? (
          <>
            <span className="sentiment-picker-popup__trigger-emoji">
              {selectedSentiment.emoji}
            </span>
            <span>{selectedSentiment.label}</span>
          </>
        ) : (
          <>
            <span className="sentiment-picker-popup__trigger-icon">⭐</span>
            <span>{triggerText}</span>
          </>
        )}
      </button>

      {/* Popup */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="sentiment-picker-popup__backdrop"
            onClick={() => setIsOpen(false)}
          />

          {/* Picker */}
          <div className="sentiment-picker-popup__content">
            <div className="sentiment-picker-popup__header">
              <h3>How did you feel about it?</h3>
              <button
                className="sentiment-picker-popup__close"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            <QuickSentimentPicker
              value={value}
              onChange={handleSelect}
              variant="inline"
              size="lg"
              showLabels={true}
              showDescriptions={true}
            />
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Inline compact version (for movie cards)
 */
export function SentimentPickerInline({
  value = null,
  onChange,
  disabled = false,
  className = ''
}) {
  return (
    <QuickSentimentPicker
      value={value}
      onChange={onChange}
      variant="inline"
      size="sm"
      showLabels={false}
      disabled={disabled}
      className={className}
    />
  )
}

/**
 * Helper to get sentiment details by value
 */
export function getSentimentDetails(value) {
  return SENTIMENTS.find(s => s.value === value) || null
}

/**
 * Helper to get sentiment color
 */
export function getSentimentColor(value) {
  return SENTIMENTS.find(s => s.value === value)?.color || '#6b7280'
}
