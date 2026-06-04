// src/shared/ui/PageContainer.jsx
import './PageContainer.css'
import { LAYOUT } from '@/shared/lib/tokens'

// size → max-width (px), from LAYOUT tokens. No arbitrary widths.
const SIZES = {
  app: LAYOUT.pageMax, // 1280 — standard app content
  wide: LAYOUT.pageWide, // 1440 — catalog grid / diary
  narrow: LAYOUT.pageNarrow, // 1080 — reading width
}

/**
 * The shared page-content container (F12B) — gives every route ONE consistent
 * max-width + responsive gutter system instead of per-section magic. Layout only:
 * NO background, decoration, animation, or route-specific logic.
 *
 * @param {object} props
 * @param {'app'|'wide'|'narrow'} [props.size='app']  max-width from LAYOUT.
 * @param {'none'|'sm'|'default'|'lg'} [props.padding='default']  responsive gutters (CSS).
 * @param {React.ElementType} [props.as='div']
 * @param {string} [props.className]
 * @param {object} [props.style]   Merged onto the root.
 * @returns {JSX.Element}
 */
export default function PageContainer({
  size = 'app',
  padding = 'default',
  as: Tag = 'div',
  className = '',
  style,
  children,
  ...props
}) {
  const maxWidth = SIZES[size] ?? SIZES.app
  return (
    <Tag
      className={`ff-page ff-page--pad-${padding}${className ? ` ${className}` : ''}`}
      style={{ maxWidth, marginLeft: 'auto', marginRight: 'auto', width: '100%', ...style }}
      {...props}
    >
      {children}
    </Tag>
  )
}
