// src/app/pages/onboarding/CinematicBackdrop.jsx
// Full-viewport blurred film still behind all onboarding steps.
// Ken Burns: scale 1.0 → 1.08 over 20s, infinite alternate.
// One backdrop per session, picked randomly from top-rated films.
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import { supabase } from '@/shared/lib/supabase/client'
import { tmdbImg } from '@/shared/api/tmdb'

// Module-level session cache — persists across step transitions
let _cachedBackdrop = null

async function fetchSessionBackdrop() {
  if (_cachedBackdrop) return _cachedBackdrop

  const { data } = await supabase
    .from('movies')
    .select('backdrop_path')
    .not('backdrop_path', 'is', null)
    .not('ff_audience_rating', 'is', null)
    .order('ff_audience_rating', { ascending: false })
    .limit(20)

  if (!data?.length) return null

  const pick = data[Math.floor(Math.random() * data.length)]
  _cachedBackdrop = pick.backdrop_path
  return _cachedBackdrop
}

/**
 * Full-screen blurred cinematic backdrop with Ken Burns motion.
 * Renders behind all onboarding step content via fixed positioning.
 */
export default function CinematicBackdrop() {
  const [backdropPath, setBackdropPath] = useState(_cachedBackdrop)

  useEffect(() => {
    if (_cachedBackdrop) { setBackdropPath(_cachedBackdrop); return }
    fetchSessionBackdrop().then(path => { if (path) setBackdropPath(path) })
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Base black layer */}
      <div className="absolute inset-0 bg-black" />

      {/* Blurred film still with Ken Burns */}
      {backdropPath && (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1 }}
          animate={{ scale: 1.08 }}
          transition={{ duration: 20, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
        >
          <img
            src={tmdbImg(backdropPath, 'original')}
            alt=""
            className="w-full h-full object-cover opacity-25"
            style={{ filter: 'blur(18px) saturate(1.1)' }}
            loading="eager"
          />
        </motion.div>
      )}

      {/* Dark overlay gradient — ensures text legibility */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.62) 40%, rgba(0,0,0,0.88) 100%)' }}
      />
    </div>
  )
}
