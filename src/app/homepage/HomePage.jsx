import HeroCarousel from "@/app/homepage/components/HeroCarousel";
import CarouselRow from "@/app/homepage/components/CarouselRow";
import { Star, Flame } from "lucide-react";

export default function HomePage() {
  return (
    <div className="w-full min-h-screen pb-14 bg-zinc-950">
      <HeroCarousel />
      {/* Carousels */}
      <div className="flex flex-col gap-6 md:gap-10 w-full mx-0 px-0 md:max-w-[1100px] md:mx-auto">
        <CarouselRow
          title={<span className="inline-flex items-center gap-2 text-orange-300 font-bold text-base md:text-lg"><Flame size={18} /> Popular Now</span>}
          endpoint="popular"
          cardType="small"
        />
        <div className="mt-12" /> {/* Large spacer for scroll */}
        <CarouselRow
          title={<span className="inline-flex items-center gap-2 text-yellow-300 font-bold text-base md:text-lg"><Star size={18} /> Top Rated</span>}
          endpoint="top_rated"
          cardType="small"
        />
      </div>
    </div>
  );
}
