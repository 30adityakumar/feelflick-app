import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { CURATED_LISTS } from './curatedListsConfig'

export default function CuratedListsIndex() {
  const navigate = useNavigate()
  usePageMeta({ title: 'Curated Lists · FeelFlick' })

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-purple-300/80 mb-2">Editorial</p>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">Curated Lists</h1>
        <p className="text-white/55 max-w-2xl mb-10">Films grouped by theme, era, and cinematic identity.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CURATED_LISTS.map(list => (
            <button
              key={list.slug}
              onClick={() => navigate(`/lists/curated/${list.slug}`)}
              className="text-left rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 p-6 transition-all"
            >
              <h3 className="text-lg font-bold text-white mb-2">{list.title}</h3>
              <p className="text-sm text-white/55 line-clamp-2">{list.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
