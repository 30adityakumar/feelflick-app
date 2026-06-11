// src/features/lists/ListDetail.jsx
// FeelFlick — Lists v2 detail. Mirrors the editorial "Featured shelf" layout
// from ListsV2: sticky-left title/blurb/actions, right column of numbered
// film rows with mood chips and optional italic notes. Owns its own data
// (list + owner + list_movies) so users can deep-link straight in.

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { tmdbImg } from '@/shared/api/tmdb'
import CreateListModal from '@/features/lists/CreateListModal'
import MoodPill from '@/shared/components/MoodPill'
import { ChipButton } from '@/shared/components/ActionButton'
import './lists.css'

import { HP, HP_GRAD } from '@/shared/lib/tokens'
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

export default function ListDetail() {
  const { listId } = useParams()
  const navigate = useNavigate()
  const { userId: currentUserId, user: authUser } = useAuthSession()

  const [list, setList] = useState(null)
  usePageMeta({ title: list?.title ? `${list.title} — FeelFlick` : 'List — FeelFlick' })
  const [owner, setOwner] = useState(null)
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const deletingRef = useRef(false) // F9.3: synchronous in-flight guard against double-delete
  const [linkCopied, setLinkCopied] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)

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

        // F8.2: list-owner identity via the narrow authenticated RPC (users is owner-only).
        const { data: ownerRows } = await supabase.rpc('get_people_public_identities', { requested_user_ids: [listRes.data.user_id] })
        const ownerData = (ownerRows || [])[0] || null
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

        // Resolve follow state once we know the viewer + list. Skip for the
        // owner (you can't follow your own list).
        if (currentUserId && listRes.data.user_id !== currentUserId) {
          const { data: followRow } = await supabase
            .from('user_list_follows')
            .select('list_id')
            .eq('user_id', currentUserId)
            .eq('list_id', listId)
            .maybeSingle()
          if (!abort) setIsFollowing(!!followRow)
        }
      } catch (e) {
        console.error('[ListDetail]', e)
      } finally {
        if (!abort) setLoading(false)
      }
    })()
    return () => { abort = true }
  }, [listId, currentUserId])

  const handleToggleFollow = async () => {
    if (!currentUserId || isOwner || followBusy) return
    setFollowBusy(true)
    const wasFollowing = isFollowing
    setIsFollowing(!wasFollowing)  // optimistic
    try {
      if (wasFollowing) {
        const { error } = await supabase
          .from('user_list_follows')
          .delete()
          .eq('user_id', currentUserId)
          .eq('list_id', listId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_list_follows')
          .insert({ user_id: currentUserId, list_id: listId })
        if (error) throw error
      }
    } catch (e) {
      console.error('[ListDetail.toggleFollow]', e)
      setIsFollowing(wasFollowing)  // revert
    } finally {
      setFollowBusy(false)
    }
  }

  // Owner display name: when this is the current user's own list and users.name
  // is null, fall back to their auth metadata + email-prefix. Avoids the
  // confusing "Someone" label users were seeing on their own lists.
  const ownerDisplayName = useMemo(() => {
    if (owner?.name) return owner.name
    if (isOwner) {
      return authUser?.user_metadata?.full_name
        || authUser?.user_metadata?.name
        || authUser?.email?.split('@')[0]
        || 'You'
    }
    return 'Someone'
  }, [owner, isOwner, authUser])
  const ownerInitial = useMemo(() => (ownerDisplayName || '?').charAt(0).toUpperCase(), [ownerDisplayName])
  // Also prefer the auth metadata avatar when owner row lacks one.
  const ownerAvatarUrl = useMemo(() => {
    if (owner?.avatar_url) return owner.avatar_url
    if (isOwner) return authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture || null
    return null
  }, [owner, isOwner, authUser])

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
    if (deletingRef.current) return // F9.3: no double-delete while a request is in flight
    deletingRef.current = true
    setDeleting(true)
    setDeleteError('')
    const { error } = await supabase.from('lists').delete().eq('id', listId)
    if (error) {
      // F9.3: settle honestly — the list stays visible (no false success); raw error never shown.
      console.error('[ListDetail.delete]', error)
      deletingRef.current = false
      setDeleting(false)
      setConfirmDelete(false)
      setDeleteError('Could not delete this list. Please try again.')
      return
    }
    navigate('/lists', { replace: true }) // success only after the DB delete resolves
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
      console.error('[ListDetail.removeFilm]', error)
      setFilms(prev)
    }
  }

  // Move a film up/down by swapping its position with the neighbor and
  // writing both rows. Optimistic UI: reorder locally first, then persist.
  // Uses position-based ordering (already in list_movies schema).
  const handleMove = async (index, direction) => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= films.length) return
    const prev = films
    const next = [...films]
    ;[next[index], next[target]] = [next[target], next[index]]
    setFilms(next)
    // Position values: re-number all rows to (i+1) so sort order stays
    // consistent even if the column had gaps from prior deletes.
    try {
      const updates = await Promise.all(
        next.map((f, i) => supabase
          .from('list_movies')
          .update({ position: i + 1 })
          .eq('list_id', listId)
          .eq('movie_id', f.movieId))
      )
      const err = updates.find(r => r.error)?.error
      if (err) throw err
    } catch (e) {
      console.error('[ListDetail.move]', e)
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
          <div className="ff-lists-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'flex-start' }}>
            {/* === LEFT: sticky meta + actions === */}
            <div className="ff-lists-detail-meta" style={{ position: 'sticky', top: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple }}>Cinematic list</div>
                {list.is_public ? (
                  <div style={{ padding: '3px 8px', borderRadius: 3, background: 'rgba(52,211,153,0.18)', border: `1px solid ${HP.green}66`, fontSize: 9, fontWeight: 700, color: HP.green, fontFamily: 'Outfit', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Public</div>
                ) : (
                  <div style={{ padding: '3px 8px', borderRadius: 3, background: 'rgba(0,0,0,0.4)', border: `1px solid ${HP.border}`, fontSize: 9, fontWeight: 700, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Private</div>
                )}
              </div>

              <h1 className="ff-lists-detail-h1" style={{ fontFamily: 'Outfit', fontSize: 56, lineHeight: 1, fontWeight: 400, letterSpacing: '-0.04em', color: HP.text, margin: 0, textWrap: 'balance' }}>
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
                  onClick={() => navigate(isOwner ? '/profile' : '/people')}
                  aria-label={`View ${owner?.name || 'owner'} profile`}
                  style={{ ...RESET_BTN, display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  {ownerAvatarUrl ? (
                    <img src={ownerAvatarUrl} alt="" referrerPolicy="no-referrer" style={{ width: 36, height: 36, borderRadius: 999, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: HP_GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0510', fontFamily: 'Outfit', fontWeight: 700, fontSize: 14 }}>
                      {ownerInitial}
                    </div>
                  )}
                  <div>
                    <div style={{ fontFamily: 'Outfit', fontSize: 14, fontWeight: 500, color: HP.text }}>{ownerDisplayName}</div>
                    <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.04em', marginTop: 2 }}>
                      {films.length} film{films.length === 1 ? '' : 's'} · updated {timeAgo(list.updated_at)}
                    </div>
                  </div>
                </button>
              </div>

              {/* Actions */}
              <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {/* Follow button — non-owner viewers only. Shows on public AND
                    private lists they have access to (RLS already gates private
                    access; if they can read the list, they can follow it). */}
                {!isOwner && currentUserId && (
                  <button
                    type="button"
                    onClick={handleToggleFollow}
                    disabled={followBusy}
                    aria-label={isFollowing ? 'Unfollow this list' : 'Follow this list'}
                    style={{
                      padding: '10px 18px', borderRadius: 6,
                      background: isFollowing ? 'transparent' : HP_GRAD,
                      border: isFollowing ? `1px solid ${HP.border}` : 'none',
                      color: isFollowing ? HP.textSoft : '#fff',
                      fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                      cursor: followBusy ? 'wait' : 'pointer',
                      opacity: followBusy ? 0.7 : 1,
                    }}
                  >
                    {followBusy ? '…' : isFollowing ? 'Following' : 'Follow list'}
                  </button>
                )}
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
                      disabled={deleting}
                      style={{ padding: '10px 16px', borderRadius: 6, background: confirmDelete ? 'rgba(239,68,68,0.18)' : 'transparent', border: `1px solid ${confirmDelete ? HP.red + '66' : HP.border}`, color: confirmDelete ? HP.red : HP.textMuted, fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: deleting ? 'wait' : 'pointer', opacity: deleting ? 0.6 : 1 }}
                    >
                      {deleting ? 'Deleting…' : confirmDelete ? 'Confirm delete?' : 'Delete'}
                    </button>
                  </>
                )}
              </div>
              {/* F9.3: safe, user-facing delete error — list stays visible, raw error never shown */}
              {deleteError && <p role="alert" style={{ marginTop: 8, fontSize: 13, color: HP.red }}>{deleteError}</p>}
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
                        {f.mood && <MoodPill label={f.mood} dot />}
                      </div>
                      {f.note && (
                        <p style={{ margin: '6px 0 0 0', fontSize: 13, lineHeight: 1.55, color: HP.textSoft, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', textWrap: 'pretty' }}>
                          &ldquo;{f.note}&rdquo;
                        </p>
                      )}
                    </button>
                    {editMode && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => handleMove(i, 'up')}
                          disabled={i === 0}
                          aria-label={`Move ${f.title} up`}
                          title="Move up"
                          style={{ ...RESET_BTN, padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: `1px solid ${HP.border}`, color: i === 0 ? HP.textFaint : HP.textSoft, cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.4 : 1 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(i, 'down')}
                          disabled={i === films.length - 1}
                          aria-label={`Move ${f.title} down`}
                          title="Move down"
                          style={{ ...RESET_BTN, padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: `1px solid ${HP.border}`, color: i === films.length - 1 ? HP.textFaint : HP.textSoft, cursor: i === films.length - 1 ? 'not-allowed' : 'pointer', opacity: i === films.length - 1 ? 0.4 : 1 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFilm(f.movieId)}
                          aria-label={`Remove ${f.title}`}
                          title="Remove"
                          style={{ ...RESET_BTN, padding: '6px 10px', borderRadius: 4, background: 'rgba(239,68,68,0.10)', border: `1px solid ${HP.red}33`, color: HP.red, fontFamily: 'Outfit', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginLeft: 4 }}
                        >
                          Remove
                        </button>
                      </div>
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
        <ChipButton onClick={onBack}>
          Back to shelves →
        </ChipButton>
      </div>
    </div>
  )
}
