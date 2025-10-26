// src/app/homepage/HomePage.jsx
import HeroSliderSection from "@/app/homepage/components/HeroSliderSection";
import CarouselRow from "@/app/homepage/components/CarouselRow";

/**
 * Clean, minimal homepage:
 *  - Brand-consistent hero spotlight
 *  - Two lean carousels (Popular, Top Rated)
 *  - No extra chrome; AppShell provides header/background/search
 */
export default function HomePage() {
  return (
    <div className="w-full pb-10">
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6">
        <HeroSliderSection />

        <div className="flex flex-col gap-6 md:gap-8">
          <CarouselRow title="Popular Now" endpoint="popular" />
          <CarouselRow title="Top Rated" endpoint="top_rated" />
        </div>
      </div>
    </div>
  );
}