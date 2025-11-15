// src/app/homepage/HomePage.jsx
import HeroSliderSection from "./components/HeroSliderSection";
import CarouselRow from "./components/CarouselRow";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Hero Section - Full bleed, no horizontal padding */}
      <HeroSliderSection />

      {/* Content Rows - Overlapping hero with negative margin */}
      <div className="relative -mt-12 sm:-mt-16 md:-mt-20 lg:-mt-32 z-30">
        <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 pb-12 sm:pb-16 md:pb-20">
          <CarouselRow 
            title="Trending Now" 
            subtitle="Top picks" 
            tmdbCategory="popular" 
            rowId="trending" 
          />
          
          <CarouselRow 
            title="Top Rated" 
            subtitle="All-time favorites" 
            tmdbCategory="top_rated" 
            rowId="top-rated" 
          />
          
          <CarouselRow 
            title="Now Playing" 
            subtitle="In theaters" 
            tmdbCategory="now_playing" 
            rowId="now-playing" 
          />
          
          <CarouselRow 
            title="Upcoming" 
            subtitle="Coming soon" 
            tmdbCategory="upcoming" 
            rowId="upcoming" 
          />
        </div>
      </div>
    </div>
  );
}
