// src/app/header/components/Preferences.jsx
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const GENRES = [
  { id: 28,    label: 'Action'      },
  { id: 12,    label: 'Adventure'   },
  { id: 16,    label: 'Animation'   },
  { id: 35,    label: 'Comedy'      },
  { id: 80,    label: 'Crime'       },
  { id: 99,    label: 'Documentary' },
  { id: 18,    label: 'Drama'       },
  { id: 10751, label: 'Family'      },
  { id: 14,    label: 'Fantasy'     },
  { id: 36,    label: 'History'     },
  { id: 27,    label: 'Horror'      },
  { id: 10402, label: 'Music'       },
  { id: 9648,  label: 'Mystery'     },
  { id: 10749, label: 'Romance'     },
  { id: 878,   label: 'Sci-Fi'      },
  { id: 53,    label: 'Thriller'    },
]

const PRESETS = [
  { name: 'Action Pack',  genres: [28, 12, 53, 878]           },
  { name: 'Cozy Night',   genres: [10751, 35, 10402, 16]      },
  { name: 'Mind Bending', genres: [9648, 53, 878, 14]         },
  { name: 'World Cinema', genres: [18, 99, 36, 10749]         },
]

export default function Preferences() {
  const [userId,   setUserId]   = useState(null)
  const [selected, setSelected] = useState([])
  const [initial,  setInitial]  = useState([])
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState(null) // { text, ok }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted || !user) return
      setUserId(user.id)
      const { data, error } = await supabase
        .from('user_preferences')
        .select('genre_id')
        .eq('user_id', user.id)
      if (!error && Array.isArray(data)) {
        const ids = data.map(r => r.genre_id)
        setSelected(ids)
        setInitial(ids)
      }
    })()
    return () => { mounted = false }
  }, [])

  const toggle = (id) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const dirty = useMemo(() => {
    if (initial.length !== selected.length) return true
    const s = new Set(initial)
    return selected.some(g => !s.has(g))
  }, [initial, selected])

  function flash(text, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 2500)
  }

  async function save() {
    if (!userId || !dirty || saving) return
    setSaving(true)
    try {
      await supabase.from('user_preferences').delete().eq('user_id', userId)
      if (selected.length) {
        await supabase.from('user_preferences').upsert(
          selected.map(genre_id => ({ user_id: userId, genre_id })),
          { onConflict: 'user_id,genre_id' }
        )
      }
      setInitial(selected)
      flash('Preferences saved')
    } catch {
      flash('Could not save. Please try again.', false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-black text-white pb-36 md:pb-24"
      style={{ paddingTop: 'var(--hdr-h, 64px)' }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(88,28,135,0.12) 0%, transparent 65%)' }} />
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white tracking-tight">Genre preferences</h1>
          <p className="text-sm text-white/35 mt-0.5">Shape what FeelFlick recommends to you</p>
        </div>

        {/* ── Quick presets ─────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Quick presets</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRESETS.map(preset => {
              const isActive = preset.genres.every(id => selected.includes(id))
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      setSelected(s => s.filter(id => !preset.genres.includes(id)))
                    } else {
                      setSelected(s => [...new Set([...s, ...preset.genres])])
                    }
                  }}
                  className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 active:scale-95 border ${
                    isActive
                      ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/40 text-white'
                      : 'border-white/8 bg-white/4 text-white/55 hover:bg-white/8 hover:border-white/15 hover:text-white/80'
                  }`}
                >
                  {preset.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Genre tag cloud ───────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">
              All genres
            </span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-xs text-white/30 hover:text-white/55 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5">
            {GENRES.map((g, idx) => {
              const isSelected = selected.includes(g.id)
              return (
                <motion.button
                  key={g.id}
                  type="button"
                  onClick={() => toggle(g.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  whileTap={{ scale: 0.93 }}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center justify-center min-w-[110px] px-5 py-[11px] rounded-full text-sm font-semibold select-none transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 scale-[1.05]'
                      : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/9 hover:border-white/20 hover:text-white/80'
                  }`}
                >
                  {g.label}
                </motion.button>
              )
            })}
          </div>

          {/* Selection count hint */}
          <p className="mt-4 text-xs text-white/25">
            {selected.length === 0
              ? 'Pick at least 3 genres for best results'
              : selected.length < 3
              ? `${3 - selected.length} more for best recommendations`
              : `${selected.length} selected`}
          </p>
        </div>

      </div>

      {/* ── Sticky footer ─────────────────────────────────────── */}
      {/* On mobile: sit above the 64px bottom nav. On md+: sit at bottom-0 */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40">
        <div className="bg-black/95 backdrop-blur-xl border-t border-white/6 px-4 sm:px-6 py-3"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            {/* Status */}
            <AnimatePresence mode="wait">
              {msg ? (
                <motion.div
                  key="msg"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${
                    msg.ok
                      ? 'bg-purple-500/10 border border-purple-500/20 text-purple-300'
                      : 'bg-red-500/10 border border-red-500/20 text-red-300'
                  }`}
                >
                  {msg.ok
                    ? <Check className="h-3.5 w-3.5 flex-shrink-0" />
                    : <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />}
                  {msg.text}
                </motion.div>
              ) : (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-white/25"
                >
                  {dirty ? 'Unsaved changes' : 'Up to date'}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Save button */}
            <button
              onClick={save}
              disabled={saving || !dirty}
              className={`flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                dirty && !saving
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-white/6 text-white/25 cursor-not-allowed'
              }`}
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : <><Check className="h-4 w-4 stroke-[2.5]" /> Save</>}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
