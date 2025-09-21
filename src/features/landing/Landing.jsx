// src/features/landing/Landing.jsx
import { lazy, Suspense } from 'react'
import LandingHero from '@/features/landing/LandingHero'

// Lazy-load the secondary block so the hero ships fast
const WhyFeelFlick = lazy(() => import('@/features/landing/WhyFeelFlick'))

export default function Landing() {
  return (
    <main id="landing" className="min-h-screen">
      {/* Above-the-fold: conversion-first hero */}
      <LandingHero />

      {/* Slim “why us” section; loads when scrolled near */}
      <Suspense fallback={<SectionSkeleton />}>
        <WhyFeelFlick />
      </Suspense>
    </main>
  )
}

/* Lightweight skeleton while WhyFeelFlick loads */
function SectionSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <div className="grid items-start gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="h-8 w-56 rounded-lg bg-white/10" />
          <div className="h-4 w-80 rounded bg-white/10" />
          <div className="h-4 w-64 rounded bg-white/10" />
          <div className="mt-6 flex gap-2">
            <div className="h-11 w-32 rounded-full bg-white/10" />
            <div className="h-11 w-28 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="h-64 rounded-2xl bg-white/5 ring-1 ring-white/10" />
      </div>
    </section>
  )
}