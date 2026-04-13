// src/app/pages/lists/ListDetailPage.jsx
import { useState, useEffect } from 'react'

import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

import { ChevronLeft, Pencil, Trash2, X as XIcon, Film, Globe, Lock } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { tmdbImg } from '@/shared/api/tmdb'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import CreateListModal from './CreateListModal'

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return null
  }
}

// ============================================================================
// SKELETON
// ============================================================================

function DetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-7 w-48 rounded-lg bg-purple-500/[0.04]" />
        <div className="h-4 w-64 rounded bg-purple-500/[0.04]" />
        <div className="h-3 w-32 rounded bg-purple-500/[0.04]" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-purple-500/[0.04]" />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// NOT FOUND
// ============================================================================

function ListNotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center text-center py-24 px-4"
    >
      <div className="h-20 w-20 rounded-full bg-white/5 border border-white/8 flex items-center justify-center mb-6">
        <Film className="h-9 w-9 text-white/20" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">List not found</h2>
      <p className="text-white/40 text-sm max-w-sm mb-6">
        This list doesn&apos;t exist, was deleted, or is private.
      </p>
      <Link
        to="/lists"
        className="inline-flex items-center gap-2 rounded-xl bg-white/8 border border-white/10 px-6 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/12 hover:text-white"
      >
        Go to lists
      </Link>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ListDetailPage() {
  const { listId } = useParams()
  const navigate = useNavigate()
  const { userId: currentUserId } = useAuthSession()

  const [list, setList] = useState(null)
  const [owner, setOwner] = useState(null)
  const [movies, setMovies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isOwner = currentUserId && list?.user_id === currentUserId

  useEffect(() => {
    if (!listId) return
    let mounted = true

    ;(async () => {
      try {
        // Fetch list + movies in parallel
        const [listRes, moviesRes] = await Promise.all([
          supabase
            .from('lists')
            .select('*')
            .eq('id', listId)
            .maybeSingle(),
          supabase
            .from('list_movies')
            .select('movie_id, added_at, note, position, movies ( id, title, poster_path, release_date, tmdb_id )')
            .eq('list_id', listId)
            .order('position', { ascending: true, nullsFirst: false }),
        ])

        if (listRes.error) throw listRes.error
        if (!mounted) return

        if (!listRes.data) {
          setNotFound(true)
          return
        }

        setList(listRes.data)

        // Fetch owner profile
        const { data: ownerData } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .eq('id', listRes.data.user_id)
          .maybeSingle()

        if (!mounted) return
        setOwner(ownerData)

        const movieList = (moviesRes.data ?? [])
          .filter((r) => r.movies)
          .map((r) => ({
            movieId: r.movie_id,
            title: r.movies.title,
            posterPath: r.movies.poster_path,
            year: r.movies.release_date ? new Date(r.movies.release_date).getFullYear() : null,
            tmdbId: r.movies.tmdb_id,
            addedAt: r.added_at,
            note: r.note,
          }))

        setMovies(movieList)
      } catch (err) {
        console.error('[ListDetailPage] fetch error:', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [listId])

  const handleRemoveMovie = async (movieId) => {
    const prevMovies = movies
    setMovies((prev) => prev.filter((m) => m.movieId !== movieId))

    const { error } = await supabase
      .from('list_movies')
      .delete()
      .eq('list_id', listId)
      .eq('movie_id', movieId)

    if (error) {
      console.error('[ListDetailPage] remove movie error:', error)
      setMovies(prevMovies)
    }
  }

  const handleDeleteList = async () => {
    const { error } = await supabase.from('lists').delete().eq('id', listId)
    if (error) {
      console.error('[ListDetailPage] delete list error:', error)
      return
    }
    navigate('/lists', { replace: true })
  }

  const handleListUpdated = (updated) => {
    setList((prev) => ({ ...prev, ...updated }))
    setShowEditModal(false)
  }

  const ownerName = owner?.name || 'Someone'
  const ownerInitial = (ownerName || '?')[0].toUpperCase()

  return (
    <div className="min-h-screen text-white pb-24 md:pb-12" style={{ background: 'var(--color-bg)', paddingTop: 'var(--hdr-h, 64px)' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(88,28,135,0.12) 0%, transparent 65%)' }}
        />
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Back link */}
        <Link
          to="/lists"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to lists
        </Link>

        {isLoading ? (
          <DetailSkeleton />
        ) : notFound ? (
          <ListNotFound />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* === HEADER === */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">{list.title}</h1>
                    {list.is_public ? (
                      <Globe className="h-4 w-4 text-white/20 flex-shrink-0" aria-label="Public list" />
                    ) : (
                      <Lock className="h-4 w-4 text-white/20 flex-shrink-0" aria-label="Private list" />
                    )}
                  </div>
                  {list.description && (
                    <p className="text-sm text-white/45 leading-relaxed">{list.description}</p>
                  )}
                </div>

                {/* Owner actions */}
                {isOwner && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(true)}
                      aria-label="Edit list"
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirmDelete) {
                          handleDeleteList()
                        } else {
                          setConfirmDelete(true)
                          setTimeout(() => setConfirmDelete(false), 3000)
                        }
                      }}
                      aria-label={confirmDelete ? 'Confirm delete' : 'Delete list'}
                      className={`h-8 rounded-lg flex items-center justify-center transition-colors ${
                        confirmDelete
                          ? 'px-3 bg-red-500/15 text-red-400 hover:bg-red-500/25'
                          : 'w-8 text-white/30 hover:text-red-400 hover:bg-red-500/8'
                      }`}
                    >
                      {confirmDelete ? (
                        <span className="text-xs font-semibold">Delete?</span>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Owner + meta */}
              <div className="flex items-center gap-3 text-xs text-white/30">
                <Link
                  to={isOwner ? '/profile' : `/profile/${list.user_id}`}
                  className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity"
                >
                  {owner?.avatar_url ? (
                    <img
                      src={owner.avatar_url}
                      alt={ownerName}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, rgb(168,85,247), rgb(236,72,153))' }}
                    >
                      {ownerInitial}
                    </div>
                  )}
                  <span className="text-white/50 font-medium">{ownerName}</span>
                </Link>
                <span>&middot;</span>
                <span>{movies.length} {movies.length === 1 ? 'film' : 'films'}</span>
                {formatDate(list.created_at) && (
                  <>
                    <span>&middot;</span>
                    <span>Created {formatDate(list.created_at)}</span>
                  </>
                )}
              </div>
            </div>

            {/* === FILM GRID === */}
            {movies.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <p className="text-white/30 text-sm mb-4">
                  {isOwner ? 'No films in this list yet' : 'This list is empty'}
                </p>
                {isOwner && (
                  <Link
                    to="/browse"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/8 border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/12 hover:text-white transition-colors"
                  >
                    Browse films to add some
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {movies.map((movie, idx) => (
                  <motion.div
                    key={movie.movieId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
                    className="group relative"
                  >
                    {movie.tmdbId ? (
                      <Link to={`/movie/${movie.tmdbId}`}>
                        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/8">
                          {movie.posterPath ? (
                            <img
                              src={tmdbImg(movie.posterPath, 'w185')}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="h-6 w-6 text-white/10" />
                            </div>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/8">
                        {movie.posterPath ? (
                          <img
                            src={tmdbImg(movie.posterPath, 'w185')}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="h-6 w-6 text-white/10" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Remove button — owner only */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMovie(movie.movieId)}
                        aria-label={`Remove ${movie.title} from list`}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-red-500/50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    )}

                    <p className="text-white/50 text-[11px] mt-1.5 truncate leading-tight">{movie.title}</p>
                    {movie.year && (
                      <p className="text-white/25 text-[10px]">{movie.year}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Edit modal */}
      {showEditModal && list && (
        <CreateListModal
          userId={list.user_id}
          existingList={list}
          onClose={() => setShowEditModal(false)}
          onSave={handleListUpdated}
        />
      )}
    </div>
  )
}
