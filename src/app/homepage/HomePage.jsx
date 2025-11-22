// src/app/homepage/HomePage.jsx
import { Suspense } from 'react'
import HeroSliderSection from './components/HeroSliderSection'
import CarouselRow from './components/CarouselRow'

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white/80 text-lg">Loading movies...</div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="relative w-full bg-black text-white min-h-screen">
      {/* Hero Section - Full bleed with header overlay */}
      <HeroSliderSection className="mt-10 md:mt-12" />

      {/* Content Rows - Proper spacing */}
      <div className="relative z-30 space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 pb-20 md:pb-8">
        <CarouselRow title="Trending Now" tmdbCategory="popular" rowId="trending" />
        <CarouselRow title="Top Rated" tmdbCategory="top_rated" rowId="top-rated" />
        <CarouselRow title="Now Playing" tmdbCategory="now_playing" rowId="now-playing" />
        <CarouselRow title="Upcoming" tmdbCategory="upcoming" rowId="upcoming" />
      </div>
    </div>
  )
}