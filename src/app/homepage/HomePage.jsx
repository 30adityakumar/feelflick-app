// src/app/homepage/HomePage.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import CarouselRow from '@/app/homepage/components/CarouselRow'

export default function HomePage() {
  const [hasPrefs, setHasPrefs] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (mounted) setHasPrefs(false); return }
      const { data, error } = await supabase
        .from('user_preferences')
        .select('genre_id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (mounted) setHasPrefs(!error && (data === null ? false : true)) // head: true returns null rows but sets count
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="w-full min-h-[calc(100svh-64px)] pb-12">
      <div className="mx-auto mt-2 flex max-w-[1100px] flex-col gap-8 px-4 md:px-0">
        {/* Optional tiny welcome line */}
        <div className="mt-2 text-sm text-white/70">For your mood today</div>

        <CarouselRow title="Popular Now" endpoint="popular" />

        {hasPrefs
          ? <CarouselRow title="For You" endpoint="discover_for_you" />
          : <CarouselRow title="Top Rated" endpoint="top_rated" />}
      </div>
    </div>
  )
}