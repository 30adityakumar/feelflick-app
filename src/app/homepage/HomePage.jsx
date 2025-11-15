// src/app/homepage/HomePage.jsx
import HeroSliderSection from "./components/HeroSliderSection";
import CarouselRow from "./components/CarouselRow";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section - Full width, no padding */}
      <HeroSliderSection />

      {/* Content Rows - Proper spacing and container */}
      <div className="relative -mt-16 md:-mt-24 lg:-mt-32 z-30">
        <div className="space-y-8 md:space-y-12 px-4 sm:px-6 md:px-8 lg:px-12 pb-16">
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
