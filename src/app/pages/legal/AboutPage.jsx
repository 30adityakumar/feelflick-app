// src/app/pages/legal/AboutPage.jsx
import { motion } from 'framer-motion'
import { Film, Brain, Users, Shield, Zap, Heart, LogIn } from 'lucide-react'

import { useGoogleAuth } from '@/features/landing/utils/useGoogleAuth'
import TopNav from '@/features/landing/components/TopNav'
import Footer from '@/features/landing/components/Footer'

// === CONSTANTS ===

const FEATURES = [
  {
    icon: Film,
    title: 'Mood-First Discovery',
    description: 'Choose from 12 moods — Melancholic, Cozy, Tense, Curious, and more. Describe how you feel in your own words and FeelFlick builds a personalised film selection in real time.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Brain,
    title: 'Cinematic DNA',
    description: 'Every film you watch builds a living portrait of your taste — your top genres, directors, mood patterns, and the emotional fingerprint of the films you love. Visible, shareable, always growing.',
    gradient: 'from-blue-500 to-purple-500',
  },
  {
    icon: Users,
    title: 'Taste Compatibility',
    description: 'A social layer built around genuine cinematic affinity, not follower counts. See who shares your directors, your moods, and your taste in endings — and why their picks actually mean something.',
    gradient: 'from-teal-400 to-cyan-500',
  },
]

const PRINCIPLES = [
  {
    icon: Heart,
    title: 'Free Forever',
    description: 'No trials, no tiers, no credit card. This is a promise, not a marketing hook.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'No advertising. No data selling. No third-party tracking. Your taste data has one job: improving your recommendations.',
  },
  {
    icon: Zap,
    title: 'Gets Smarter',
    description: 'Every watch, rating, skip, and mood session adds signal. Five films in, it\'s decent. Fifty films in, it starts to feel uncanny.',
  },
]

const STATS = [
  { stat: '6,700+', label: 'Curated films with full metadata, mood scores, and pre-computed semantic embeddings' },
  { stat: '16', label: 'Scoring dimensions — genre affinity, pacing, intensity, emotional depth, and your personal history' },
  { stat: '3,072', label: 'Embedding dimensions via OpenAI text-embedding-3-large for deep semantic matching' },
  { stat: '12', label: 'Moods from Melancholic to Adventurous, each with natural language understanding' },
]

const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

const vp = { once: true, margin: '-60px' }

// === MAIN COMPONENT ===

export default function AboutPage() {
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()

  return (
    <>
      <TopNav />
      <div className="relative min-h-screen bg-black text-white overflow-x-hidden">

        {/* === HERO === */}
        <section className="relative overflow-hidden">
          {/* Ambient layers */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 90% 70% at 50% -5%, rgba(88,28,135,0.35) 0%, transparent 65%)' }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 70% 90%, rgba(168,85,247,0.10) 0%, transparent 60%)' }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 50% 40% at 20% 60%, rgba(236,72,153,0.06) 0%, transparent 60%)' }}
            aria-hidden="true"
          />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40 pb-20 sm:pb-28 text-center">
            <motion.p
              className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-5"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              About FeelFlick
            </motion.p>
            <motion.h1
              className="font-black tracking-tight leading-[1.05] text-white mb-6"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 4.25rem)' }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="block">Films That</span>
              <span className="gradient-text">Know You</span>
            </motion.h1>
            <motion.p
              className="text-sm sm:text-base text-white/60 leading-relaxed max-w-2xl mx-auto"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              FeelFlick is a mood-first movie discovery platform that learns your cinematic identity. It sits at the intersection of three things no other platform combines: a sophisticated recommendation engine, a personal taste identity layer, and a social graph built around genuine cinematic affinity.
            </motion.p>
          </div>
        </section>

        {/* Divider */}
        <div
          className="h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 50%, transparent 100%)' }}
          aria-hidden="true"
        />

        {/* === THE PROBLEM === */}
        <section className="relative overflow-hidden">
          <div
            className="absolute pointer-events-none"
            style={{
              top: '-10%', left: '-10%',
              width: '50%', height: '120%',
              background: 'radial-gradient(ellipse 60% 50% at 30% 50%, rgba(88,28,135,0.10) 0%, transparent 65%)',
            }}
            aria-hidden="true"
          />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="max-w-3xl">
              <motion.p
                className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-3"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.4 }}
              >
                The Problem
              </motion.p>
              <motion.h2
                className="font-black tracking-tight leading-[1.05] text-white mb-6"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.45, delay: 0.1 }}
              >
                You spend more time scrolling than watching.
              </motion.h2>
              <motion.div
                className="space-y-4 text-sm sm:text-base text-white/60 leading-relaxed"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.45, delay: 0.2 }}
              >
                <p>
                  Streaming platforms have a discovery problem. With thousands of films available, generic recommendations based on viewing history produce safe, predictable suggestions that rarely lead to genuinely memorable films.
                </p>
                <p>
                  More fundamentally: no platform treats your relationship with cinema as something worth tracking, understanding, and reflecting back to you. You watch, the algorithm updates silently, and nothing changes. <span className="text-white/70">Your taste has no visible shape.</span>
                </p>
                <p>
                  FeelFlick treats this differently. Most platforms answer <span className="italic text-white/60">&ldquo;what&apos;s popular right now?&rdquo;</span> FeelFlick answers a different question entirely: <span className="text-white/70 font-medium">&ldquo;what&apos;s right for you, right now?&rdquo;</span>
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div
          className="h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 50%, transparent 100%)' }}
          aria-hidden="true"
        />

        {/* === FEATURES === */}
        <section className="relative overflow-hidden">
          <div
            className="absolute pointer-events-none"
            style={{
              top: '10%', right: '-8%',
              width: '50%', height: '80%',
              background: 'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(88,28,135,0.12) 0%, transparent 65%)',
            }}
            aria-hidden="true"
          />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <motion.p
              className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-3"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.4 }}
            >
              How It Works
            </motion.p>
            <motion.h2
              className="font-black tracking-tight leading-[1.05] text-white mb-10"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              Three layers, one loop.
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-5">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  className="group rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:border-white/12"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={vp}
                  transition={{ duration: 0.45, delay: i * 0.1 }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br ${feature.gradient}`}
                    style={{ opacity: 0.85 }}
                  >
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div
          className="h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 50%, transparent 100%)' }}
          aria-hidden="true"
        />

        {/* === UNDER THE HOOD === */}
        <section className="relative overflow-hidden">
          <div
            className="absolute pointer-events-none"
            style={{
              top: '0%', left: '-5%',
              width: '45%', height: '100%',
              background: 'radial-gradient(ellipse 55% 50% at 25% 50%, rgba(88,28,135,0.10) 0%, transparent 70%)',
            }}
            aria-hidden="true"
          />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <motion.p
              className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-3"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.4 }}
            >
              Under the Hood
            </motion.p>
            <motion.h2
              className="font-black tracking-tight leading-[1.05] text-white mb-10"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              Built for depth.
            </motion.h2>

            <div className="grid sm:grid-cols-2 gap-4">
              {STATS.map((item, i) => (
                <motion.div
                  key={item.stat}
                  className="rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:border-white/12"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={vp}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    {item.stat}
                  </p>
                  <p className="text-xs sm:text-sm text-white/40 leading-relaxed">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div
          className="h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 50%, transparent 100%)' }}
          aria-hidden="true"
        />

        {/* === PRINCIPLES === */}
        <section className="relative overflow-hidden">
          <div
            className="absolute pointer-events-none"
            style={{
              top: '10%', right: '-5%',
              width: '40%', height: '80%',
              background: 'radial-gradient(ellipse 50% 45% at 75% 50%, rgba(88,28,135,0.08) 0%, transparent 65%)',
            }}
            aria-hidden="true"
          />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <motion.p
              className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-3"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.4 }}
            >
              Principles
            </motion.p>
            <motion.h2
              className="font-black tracking-tight leading-[1.05] text-white mb-10"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              What we believe.
            </motion.h2>

            <div className="space-y-4">
              {PRINCIPLES.map((principle, i) => (
                <motion.div
                  key={principle.title}
                  className="flex gap-4 items-start rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:border-white/12"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={vp}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}
                  >
                    <principle.icon className="w-4.5 h-4.5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white mb-1">{principle.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{principle.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div
          className="h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 50%, transparent 100%)' }}
          aria-hidden="true"
        />

        {/* === CTA === */}
        <section className="relative overflow-hidden">
          {/* Strong purple bloom */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 100% 55% at 50% -5%, rgba(88,28,135,0.30) 0%, transparent 70%)' }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(168,85,247,0.06) 0%, transparent 70%)' }}
            aria-hidden="true"
          />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center">
            <motion.h2
              className="font-black tracking-tight leading-[1.05] mb-5"
              style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.5 }}
            >
              <span className="text-white">The more you watch,</span>
              <br />
              <span className="gradient-text">the better it gets.</span>
            </motion.h2>

            <motion.p
              className="text-sm text-white/40 mb-8 max-w-md mx-auto"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              Free forever. No credit card. No ads. Sign in with Google and see your Cinematic DNA take shape.
            </motion.p>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={vp}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="flex flex-col items-center gap-3"
            >
              <button
                onClick={signInWithGoogle}
                disabled={isAuthenticating}
                className="inline-flex items-center justify-center gap-2.5 px-10 py-[0.875rem] rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-[0.9375rem] shadow-lg shadow-purple-500/20 hover:brightness-110 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                aria-label={isAuthenticating ? 'Signing in' : 'Get started with FeelFlick'}
              >
                {isAuthenticating ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <>
                    Get Started
                    <LogIn className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  </>
                )}
              </button>
              <p className="text-xs text-white/20">
                Free forever · No credit card · No ads
              </p>
            </motion.div>
          </div>
        </section>

      </div>
      <Footer />
    </>
  )
}
