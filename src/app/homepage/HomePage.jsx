// src/app/homepage/HomePage.jsx
import { Sparkles, History, TrendingUp } from 'lucide-react'
import HeroSliderSection from './components/HeroSliderSection'
import CarouselRow from './components/CarouselRow'
import MoodCarouselRow from './components/MoodCarouselRow'
import PersonalizedCarouselRow from './components/PersonalizedCarouselRow'
import { useGenreRecommendations, useHistoryRecommendations } from '@/shared/hooks/useRecommendations'

export default function HomePage() {
  // Fetch personalized recommendations
  const genreRecs = useGenreRecommendations({ limit: 20 })
  const historyRecs = useHistoryRecommendations({ limit: 20 })

  return (
    <div className="relative w-full bg-black text-white min-h-screen">
      {/* Hero Section */}
      <HeroSliderSection className="mt-9 md:mt-12" />

      {/* Content Rows */}
      <div className="relative z-30 space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 pb-20 md:pb-8">
        
        {/* PERSONALIZED SECTIONS - Top Priority */}
        <PersonalizedCarouselRow
          title="Picked For You"
          movies={genreRecs.data}
          loading={genreRecs.loading}
          error={genreRecs.error}
          icon={Sparkles}
          rowId="picked-for-you"
        />

        <PersonalizedCarouselRow
          title="Because You Watched"
          movies={historyRecs.data}
          loading={historyRecs.loading}
          error={historyRecs.error}
          icon={History}
          rowId="because-you-watched"
        />

        {/* PERSONALIZED MOOD ROWS */}
        <MoodCarouselRow moodId={1} moodName="Cozy Tonight" moodEmoji="☕" />
        <MoodCarouselRow moodId={8} moodName="Romantic" moodEmoji="💕" />
        
        {/* GENERIC CONTENT - Fallback */}
        <CarouselRow 
          title="Trending Now" 
          tmdbCategory="popular" 
          rowId="trending"
          icon={TrendingUp}
        />
        
        <MoodCarouselRow moodId={2} moodName="Adventurous" moodEmoji="🗺️" />
        <MoodCarouselRow moodId={10} moodName="Silly & Fun" moodEmoji="🤪" />
        
        <CarouselRow title="Top Rated" tmdbCategory="top_rated" rowId="top-rated" />
        
        <MoodCarouselRow moodId={11} moodName="Dark & Intense" moodEmoji="🌑" />
        
        <CarouselRow title="Now Playing" tmdbCategory="now_playing" rowId="now-playing" />
        <CarouselRow title="Upcoming" tmdbCategory="upcoming" rowId="upcoming" />
      </div>
    </div>
  )
}
