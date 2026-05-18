// src/features/lists-v2/ListDetailV2.jsx
// FeelFlick — Lists v2 detail. Mirrors the editorial "Featured shelf" layout
// from ListsV2: sticky-left title/blurb/actions, right column of numbered
// film rows with mood chips and optional italic notes. Owns its own data
// (list + owner + list_movies) so users can deep-link straight in.

import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { tmdbImg } from '@/shared/api/tmdb'
import CreateListModal from '@/app/pages/lists/CreateListModal'
import './lists-v2.css'

const HP = {
  bgDeep: '#06060a',
  border: 'rgba(255,255,255,0.08)', borderStrong: 'rgba(255,255,255,0.14)',
  text: '#FAFAFA', textSoft: 'rgba(250,250,250,0.72)', textMuted: 'rgba(250,250,250,0.45)', textFaint: 'rgba(250,250,250,0.28)',
  purple: '#A78BFA', purpleDeep: '#7C3AED', pink: '#EC4899', amber: '#F59E0B', red: '#EF4444', green: '#34D399',
}
const HP_GRAD = 'linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)'
const RESET_BTN = { background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''
}

function timeAgo(iso) {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const hours = Math.round(ms / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  const months = Math.round(days / 30)
  return `${months}mo ago`
}

export default function ListDetailV2() {
  const { listId } = useParams()
  const navigate = useNavigate()
  const { userId: currentUserId } = useAuthSession()

  const [list, setList] = useState(null)
  const [owner, setOwner] = useState(null)
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const isOwner = !!currentUserId && list?.user_id === currentUserId

  useEffect(() => {
    if (!listId) return
    let abort = false
    setLoading(true)
    setNotFound(false)
    ;(async () => {
      try {
        const [listRes, moviesRes] = await Promise.all([
          supabase
            .from('lists')
            .select('id, user_id, title, description, is_public, created_at, updated_at')
            .eq('id', listId)
            .maybeSingle(),
          supabase
            .from('list_movies')
            .select(`
              movie_id, added_at, note, position,
              movies(id, tmdb_id, title, director_name, release_date, mood_tags, poster_path)
            `)
            .eq('list_id', listId)
            .order('position', { ascending: true, nullsFirst: false }),
        ])
        if (abort) return
        if (listRes.error) throw listRes.error
        if (!listRes.data) {
          setNotFound(true)
          return
        }
        setList(listRes.data)

        const { data: ownerData } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .eq('id', listRes.data.user_id)
          .maybeSingle()
        if (abort) return
        setOwner(ownerData)

        const items = (moviesRes.data || [])
          .filter(r => r.movies)
          .map(r => ({
            movieId: r.movie_id,
            id: r.movies.id,
            tmdbId: r.movies.tmdb_id,
            title: r.movies.title || 'Untitled',
            year: r.movies.release_date ? new Date(r.movies.release_date).getFullYear() : '',
            dir: r.movies.director_name || '',
            mood: capitalize((r.movies.mood_tags || [])[0] || ''),
            poster: r.movies.poster_path ? tmdbImg(r.movies.poster_path, 'w185') : null,
            note: r.note || null,
          }))
        setFilms(items)
      } catch (e) {
        console.error('[ListDetailV2]', e)
      } finally {
        if (!abort) setLoading(false)
      }
    })()
    return () => { abort = true }
  }, [listId])

  const ownerInitial = useMemo(() => (owner?.name || '?').charAt(0).toUpperCase(), [owner])

  const handleShare = async () => {
    const url = `${window.location.origin}/lists/${listId}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // silent fallback
    }
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 1800)
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    const { error } = await supabase.from('lists').delete().eq('id', listId)
    if (error) {
      console.error('[ListDetailV2.delete]', error)
      return
    }
    navigate('/lists', { replace: true })
  }

  const handleRemoveFilm = async (movieId) => {
    const prev = films
    setFilms(prev.filter(f => f.movieId !== movieId))
    const { error } = await supabase
      .from('list_movies')
      .delete()
      .eq('list_id', listId)
      .eq('movie_id', movieId)
    if (error) {
      console.error('[ListDetailV2.removeFilm]', error)
      setFilms(prev)
    }
  }

  const handleListUpdated = (updated) => {
    setList(l => ({ ...l, ...updated }))
    setShowEdit(false)
  }

  if (loading) return <DetailSkeleton />
  if (notFound || !list) return <NotFound onBack={() => navigate('/lists')} />

  return (
    <div style={{ minHeight: '100vh', background: HP.bgDeep, color: HP.text, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <section style={{ padding: '56px 88px 24px' }}>
          <button
            type="button"
            onClick={() => navigate('/lists')}
            style={{ ...RESET_BTN, fontSize: 11, color: HP.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Outfit', marginBottom: 24 }}
          >
            ← Back to shelves
          </button>
        </section>

        <section style={{ padding: '0 88px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'flex-start' }}>
            {/* === LEFT: sticky meta + actions === */}
            <div style={{ position: 'sticky', top: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple }}>Cinematic list</div>
                {list.is_public ? (
                  <div style={{ padding: '3px 8px', borderRadius: 3, background: 'rgba(52,211,153,0.18)', border: `1px solid ${HP.green}66`, fontSize: 9, fontWeight: 700, color: HP.green, fontFamily: 'Outfit', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Public</div>
                ) : (
                  <div style={{ padding: '3px 8px', borderRadius: 3, background: 'rgba(0,0,0,0.4)', border: `1px solid ${HP.border}`, fontSize: 9, fontWeight: 700, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Private</div>
                )}
              </div>

              <h1 style={{ fontFamily: 'Outfit', fontSize: 56, lineHeight: 1, fontWeight: 400, letterSpacing: '-0.04em', color: HP.text, margin: 0, textWrap: 'balance' }}>
                {list.title}
              </h1>

              {list.description && (
                <p style={{ marginTop: 20, fontSize: 15, color: HP.textSoft, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', lineHeight: 1.6, textWrap: 'pretty' }}>
                  &ldquo;{list.description}&rdquo;
                </p>
              )}

              {/* Owner row */}
              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => navigate(isOwner ? '/profile' : `/profile/${list.user_id}`)}
                  aria-label={`View ${owner?.name || 'owner'} profile`}
                  style={{ ...RESET_BTN, display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  {owner?.avatar_url ? (
                    <img src={owner.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: 999, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: HP_GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0510', fontFamily: 'Outfit', fontWeight: 700, fontSize: 14 }}>
                      {ownerInitial}
                    </div>
                  )}
                  <div>
                    <div style={{ fontFamily: 'Outfit', fontSize: 14, fontWeight: 500, color: HP.text }}>{owner?.name || 'Someone'}</div>
                    <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.04em', marginTop: 2 }}>
                      {films.length} film{films.length === 1 ? '' : 's'} · updated {timeAgo(list.updated_at)}
                    </div>
                  </div>
                </button>
              </div>

              {/* Actions */}
              <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {list.is_public && (
                  <button
                    type="button"
                    onClick={handleShare}
                    style={{ padding: '10px 16px', borderRadius: 6, background: linkCopied ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.06)', border: `1px solid ${linkCopied ? HP.green + '66' : HP.border}`, color: linkCopied ? HP.green : HP.textSoft, fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    {linkCopied ? 'Copied ✓' : 'Copy link'}
                  </button>
                )}
                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowEdit(true)}
                      style={{ padding: '10px 16px', borderRadius: 6, background: HP_GRAD, border: 'none', color: '#fff', fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      Edit details
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(m => !m)}
                      style={{ padding: '10px 16px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: `1px solid ${HP.border}`, color: HP.textSoft, fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      {editMode ? 'Done' : 'Reorder · remove'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      style={{ padding: '10px 16px', borderRadius: 6, background: confirmDelete ? 'rgba(239,68,68,0.18)' : 'transparent', border: `1px solid ${confirmDelete ? HP.red + '66' : HP.border}`, color: confirmDelete ? HP.red : HP.textMuted, fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      {confirmDelete ? 'Confirm delete?' : 'Delete'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* === RIGHT: numbered film rows === */}
            <div style={{ borderTop: `1px solid ${HP.border}` }}>
              {films.length === 0 ? (
                <div style={{ padding: '64px 0', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 500, color: HP.text, marginBottom: 8 }}>No films yet</div>
                  <div style={{ fontSize: 13, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', marginBottom: 24 }}>
                    {isOwner ? 'Open any film page and tap "Add to list" to drop something here.' : 'Nothing on this shelf yet.'}
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => navigate('/browse')}
                      style={{ padding: '10px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: `1px solid ${HP.borderStrong}`, color: HP.text, fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      Browse films →
                    </button>
                  )}
                </div>
              ) : (
                films.map((f, i) => (
                  <div
                    key={f.movieId}
                    style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: 24, alignItems: 'center', padding: '20px 0', borderBottom: `1px solid ${HP.border}` }}
                  >
                    <div style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 200, color: HP.textMuted, letterSpacing: '-0.04em', width: 36, textAlign: 'right' }}>{String(i + 1).padStart(2, '0')}</div>
                    {f.poster ? (
                      <img src={f.poster} alt="" style={{ width: 52, height: 78, objectFit: 'cover', borderRadius: 4 }} />
                    ) : (
                      <div style={{ width: 52, height: 78, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
                    )}
                    <button
                      type="button"
                      onClick={() => f.tmdbId && navigate(`/movie/${f.tmdbId}`)}
                      style={{ ...RESET_BTN, width: '100%' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 500, color: HP.text, letterSpacing: '-0.015em' }}>{f.title}</span>
                        <span style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit' }}>{f.year}{f.year && f.dir && ' · '}{f.dir}</span>
                        {f.mood && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 999, background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.30)', fontSize: 10, color: HP.purple, fontFamily: 'Outfit' }}>
                            <span style={{ width: 5, height: 5, borderRadius: 999, background: HP.purple }} />{f.mood}
                          </span>
                        )}
                      </div>
                      {f.note && (
                        <p style={{ margin: '6px 0 0 0', fontSize: 13, lineHeight: 1.55, color: HP.textSoft, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', textWrap: 'pretty' }}>
                          &ldquo;{f.note}&rdquo;
                        </p>
                      )}
                    </button>
                    {editMode && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFilm(f.movieId)}
                        aria-label={`Remove ${f.title}`}
                        style={{ ...RESET_BTN, padding: '6px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.10)', border: `1px solid ${HP.red}33`, color: HP.red, fontFamily: 'Outfit', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {showEdit && (
        <CreateListModal
          userId={list.user_id}
          existingList={list}
          onClose={() => setShowEdit(false)}
          onSave={handleListUpdated}
        />
      )}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: HP.bgDeep, color: HP.text, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '56px 88px' }}>
        <div className="animate-pulse" style={{ height: 48, width: 320, borderRadius: 8, background: 'rgba(255,255,255,0.04)', marginBottom: 16 }} />
        <div className="animate-pulse" style={{ height: 18, width: 240, borderRadius: 999, background: 'rgba(255,255,255,0.03)', marginBottom: 32 }} />
        <div style={{ borderTop: `1px solid ${HP.border}` }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', gap: 24, alignItems: 'center', padding: '20px 0', borderBottom: `1px solid ${HP.border}` }}>
              <div className="animate-pulse" style={{ width: 36, height: 18, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
              <div className="animate-pulse" style={{ width: 52, height: 78, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
              <div className="animate-pulse" style={{ height: 18, width: '60%', borderRadius: 999, background: 'rgba(255,255,255,0.04)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function NotFound({ onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: HP.bgDeep, color: HP.text, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 18 }}>List · 404</div>
        <h1 style={{ fontFamily: 'Outfit', fontSize: 40, fontWeight: 500, color: HP.text, margin: '0 0 18px 0', letterSpacing: '-0.025em' }}>This shelf isn&rsquo;t here.</h1>
        <p style={{ margin: '0 0 24px 0', color: 'rgba(250,250,250,0.6)', fontSize: 14, lineHeight: 1.6 }}>It may have been deleted, made private, or it never existed.</p>
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
