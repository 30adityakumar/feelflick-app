// src/features/landing/Landing.jsx
import TopNav from '@/features/landing/components/TopNav'
import LandingHero from '@/features/landing/components/LandingHero'
import Footer from '@/features/landing/components/Footer'

export default function Landing() {
  return (
    <>
      {/* Fixed header (sets --topnav-h for the hero spacing) */}
      <TopNav />

      <main id="main">
        {/* Above-the-fold: conversion-first hero */}
        <LandingHero />

        {/*
          If you later want a slim “Why” slice under the hero, re-enable it like this:

          import { lazy, Suspense } from 'react'
          const WhyFeelFlick = lazy(() => import('@/features/landing/components/WhyFeelFlick'))

          <Suspense fallback={<SectionSkeleton />}>
            <WhyFeelFlick />
          </Suspense>

          And include SectionSkeleton from your previous version.
        */}
      </main>

      {/* Micro footer keeps legal + attribution without distraction */}
      <Footer variant="micro" />
    </>
  )
}