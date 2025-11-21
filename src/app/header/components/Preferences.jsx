// src/app/header/components/Preferences.jsx
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { CheckCircle2, Sparkles, Zap, Heart, Check } from 'lucide-react'

const GENRES = [
  { id: 28, label: 'Action' },
  { id: 12, label: 'Adventure' },
  { id: 16, label: 'Animation' },
  { id: 35, label: 'Comedy' },
  { id: 80, label: 'Crime' },
  { id: 99, label: 'Documentary' },
  { id: 18, label: 'Drama' },
  { id: 10751, label: 'Family' },
  { id: 14, label: 'Fantasy' },
  { id: 36, label: 'History' },
  { id: 27, label: 'Horror' },
  { id: 10402, label: 'Music' },
  { id: 9648, label: 'Mystery' },
  { id: 10749, label: 'Romance' },
  { id: 878, label: 'Sci-Fi' },
  { id: 53, label: 'Thriller' },
]

const PRESETS = [
  { name: 'Action Pack', icon: <Zap className="h-3.5 w-3.5" />, genres: [28, 12, 53, 878] },
  { name: 'Cozy Night', icon: <Heart className="h-3.5 w-3.5" />, genres: [10751, 35, 10402, 16] },
  { name: 'Mind Bending', icon: <Sparkles className="h-3.5 w-3.5" />, genres: [9648, 53, 878, 14] },
]

export default function Preferences() {
  const [userId, setUserId] = useState(null)
  const [selected, setSelected] = useState([])
  const [initial, setInitial] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

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
        const values = data.map(r => r.genre_id)
        setSelected(values)
        setInitial(values)
      }
    })()
    return () => { mounted = false }
  }, [])

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const dirty = useMemo(() => {
    if (initial.length !== selected.length) return true
    const setInit = new Set(initial)
    for (const g of selected) if (!setInit.has(g)) return true
    return false
  }, [initial, selected])

  async function save() {
    if (!userId || !dirty) return
    setSaving(true)
    setMsg('')
    try {
      await supabase.from('user_preferences').delete().eq('user_id', userId)
      
      if (selected.length) {
        const rows = selected.map(genre_id => ({ user_id: userId, genre_id }))
        await supabase
          .from('user_preferences')
          .upsert(rows, { onConflict: 'user_id,genre_id' })
      }
      
      setInitial(selected)
      setMsg('Saved!')
    } catch (e) {
      console.warn('prefs save error', e)
      setMsg('Error saving')
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(''), 2000)
    }
  }

  const applyPreset = (ids) => setSelected(ids)

  return (
    <div className="bg-black text-white w-full pb-20 md:pb-6" style={{ paddingTop: 'var(--hdr-h, 64px)', minHeight: '100vh' }}>
      <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-3xl font-black tracking-tight mb-1 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Genre Preferences
          </h1>
          <p className="text-xs md:text-sm text-white/60">Choose genres to personalize your recommendations</p>
        </div>

        {/* Stats Bar */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70">Selected</span>
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                {selected.length}
              </span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <button 
              type="button"
              className="text-xs font-semibold text-white/70 hover:text-white transition-colors active:scale-95"
              onClick={() => setSelected([])}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <h2 className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-3">Quick Presets</h2>
          <div className="grid gap-3 grid-cols-3">
            {PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset.genres)}
                className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-3 text-left transition-all active:scale-95 active:border-purple-500/30"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-purple-900/20 group-hover:scale-110 transition-transform">
                    {preset.icon}
                  </div>
                  <h3 className="text-xs font-bold text-white leading-tight">{preset.name}</h3>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Genre Grid */}
        <div className="mb-6">
          <h2 className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-3">All Genres</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {GENRES.map(g => (
              <GenreChip 
                key={g.id} 
                active={selected.includes(g.id)} 
                onClick={() => toggle(g.id)} 
                label={g.label} 
              />
            ))}
          </div>
        </div>

        {/* Save Section */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 sticky bottom-4 md:relative md:bottom-auto shadow-2xl md:shadow-none z-30">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button 
              onClick={save} 
              disabled={saving || !dirty}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95 disabled:hover:scale-100 shadow-lg shadow-purple-900/20 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {saving ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Saving...</span>
                </>
              ) : dirty ? (
                <>
                  <span>Save Changes</span>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </>
              ) : (
                <span>Saved</span>
              )}
            </button>
            
            {msg && (
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 animate-in fade-in slide-in-from-left-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {msg}
              </div>
            )}
          </div>
          <p className="text-[10px] text-white/50 mt-2.5 text-center sm:text-left">
            Preferences help us recommend movies you'll actually love
          </p>
        </div>

      </div>
    </div>
  )
}

// Genre Chip Component
function GenreChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative rounded-xl p-3 text-center transition-all duration-200 ${
        active
          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 scale-[1.02] shadow-lg shadow-purple-500/10 z-10'
          : 'bg-white/5 border-2 border-transparent hover:border-white/10 hover:bg-white/10 active:scale-95'
      }`}
    >
      <div className="flex items-center justify-center gap-1.5">
        <div className={`text-xs font-bold transition-colors ${active ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
          {label}
        </div>
        {active && (
          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-sm animate-in zoom-in duration-200">
            <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
          </div>
        )}
      </div>
    </button>
  )
}
