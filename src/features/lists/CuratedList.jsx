// src/features/lists/CuratedList.jsx
// FeelFlick — Lists v2 curated-list detail. Reuses CURATED_LISTS query
// builders. Editorial dark layout: sticky-left meta, right poster grid.

import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { CURATED_LISTS } from '@/shared/lib/curatedLists'
import './lists.css'

const HP = {
  bgDeep: '#06060a',
  border: 'rgba(255,255,255,0.08)', borderStrong: 'rgba(255,255,255,0.14)',
  text: '#FAFAFA', textSoft: 'rgba(250,250,250,0.72)', textMuted: 'rgba(250,250,250,0.45)', textFaint: 'rgba(250,250,250,0.28)',
  purple: '#A78BFA', pink: '#EC4899',
}
const HP_GRAD = 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)'
const RESET_BTN = { background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }

const TMDB_IMG = (path, size = 'w342') => path ? `https://image.tmdb.org/t/p/${size}${path}` : null

export default function CuratedList() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const list = useMemo(() => CURATED_LISTS.find(l => l.slug === slug), [slug])
  usePageMeta({ title: list?.title ? `${list.title} — FeelFlick` : 'Curated list — FeelFlick' })

  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!list) { setLoading(false); return }
    let abort = false
    setLoading(true)
    list.query(supabase).then(({ data, error }) => {
      if (abort) return
      if (error) console.error('[CuratedList]', error)
      setMovies(data || [])
      setLoading(false)
    })
    return () => { abort = true }
  }, [list])

  if (!list) return <NotFound onBack={() => navigate('/lists')} />

  return (
    <div className="ff-lists-v2" style={{ minHeight: '100vh', background: HP.bgDeep, color: HP.text, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <section className="ff-lists-section" style={{ padding: '56px 88px 24px' }}>
          <button
            type="button"
            onClick={() => navigate('/lists')}
            style={{ ...RESET_BTN, fontSize: 11, color: HP.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Outfit', marginBottom: 24 }}
          >
            ← Back to shelves
          </button>
        </section>

        <section className="ff-lists-section" style={{ padding: '0 88px 80px' }}>
          <div className="ff-lists-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 64, alignItems: 'flex-start' }}>
            {/* === LEFT: sticky meta === */}
            <div className="ff-lists-detail-meta" style={{ position: 'sticky', top: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple }}>FeelFlick · Curated</div>
              </div>

              <h1 className="ff-lists-detail-h1" style={{ fontFamily: 'Outfit', fontSize: 52, lineHeight: 1, fontWeight: 400, letterSpacing: '-0.04em', color: HP.text, margin: 0, textWrap: 'balance' }}>
                {list.title}
              </h1>

              {list.description && (
                <p style={{ marginTop: 20, fontSize: 15, color: HP.textSoft, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', lineHeight: 1.6, textWrap: 'pretty' }}>
                  &ldquo;{list.description}&rdquo;
                </p>
              )}

              <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.06em' }}>
                <span>{loading ? 'Loading…' : `${movies.length} film${movies.length === 1 ? '' : 's'}`}</span>
                <span>·</span>
                <span>Hand-built by the editors</span>
              </div>
            </div>

            {/* === RIGHT: poster grid === */}
            <div>
              {loading ? (
                <div className="ff-lists-poster-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse" style={{ aspectRatio: '2/3', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
                  ))}
                </div>
              ) : movies.length === 0 ? (
                <div style={{ padding: '64px 0', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 500, color: HP.text }}>No films match yet</div>
                  <div style={{ fontSize: 13, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', marginTop: 8 }}>
                    The editors are still building this shelf. Check back soon.
                  </div>
                </div>
              ) : (
                <div className="ff-lists-poster-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                  {movies.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => m.tmdb_id && navigate(`/movie/${m.tmdb_id}`)}
                      style={{ ...RESET_BTN, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}` }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
                        {m.poster_path ? (
                          <img src={TMDB_IMG(m.poster_path)} alt={m.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.04)' }} />
                        )}
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontFamily: 'Outfit', fontSize: 13, fontWeight: 500, color: HP.text, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                        <div style={{ fontSize: 10, color: HP.textMuted, fontFamily: 'Outfit', marginTop: 2, letterSpacing: '0.04em' }}>
                          {m.release_year || ''}{m.primary_genre ? ` · ${m.primary_genre}` : ''}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function NotFound({ onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: HP.bgDeep, color: HP.text, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 18 }}>Curated · 404</div>
        <h1 style={{ fontFamily: 'Outfit', fontSize: 40, fontWeight: 500, color: HP.text, margin: '0 0 18px 0', letterSpacing: '-0.025em' }}>That shelf doesn&rsquo;t exist.</h1>
        <button
          type="button"
          onClick={onBack}
          style={{ padding: '10px 18px', borderRadius: 6, background: HP_GRAD, border: 'none', color: '#fff', fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          Back to shelves →
        </button>
      </div>
    </div>
  )
}
