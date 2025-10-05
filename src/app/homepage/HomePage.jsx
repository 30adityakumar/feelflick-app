// src/app/homepage/HomePage.jsx
import CarouselRow from '@/app/homepage/components/CarouselRow'
import { useEnsureUserRow } from '@/features/auth/useEnsureUserRow'

export default function HomePage() {
  // Lightweight, RLS-safe readiness check (never writes)
  const { ready /*, user */ } = useEnsureUserRow()

  if (!ready) {
    // Short, centered placeholder while we confirm auth/user row
    return (
      <div className="w-full min-h-screen grid place-items-center bg-zinc-950">
        <p className="text-white/90 text-[15px]">Loading profile…</p>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen pb-14 bg-zinc-950">
      <div className="flex flex-col gap-6 md:gap-10 max-w-full md:max-w-[1100px] mx-auto mt-4">
        <CarouselRow title="Popular Now" endpoint="popular" />
        <CarouselRow title="Top Rated"   endpoint="top_rated" />
      </div>
    </div>
  )
}