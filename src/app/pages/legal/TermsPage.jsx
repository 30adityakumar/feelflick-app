// src/app/pages/TermsPage.jsx
import { Link } from 'react-router-dom'
import { Scale, ShieldCheck, AlertTriangle, FileText, Mail, Gavel } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-black to-pink-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.2),transparent_50%)]" />
        
        <div className="relative mx-auto max-w-4xl px-4 md:px-8 pt-32 md:pt-40 pb-20 md:pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-5">
            <Scale className="h-4 w-4 text-purple-300" />
            <span className="text-sm font-semibold text-white/80">Terms of Service</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Our rules of engagement
          </h1>
          
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
            Last updated: November 15, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-5xl px-4 md:px-8 pb-20 space-y-12 md:space-y-16">
        
        {/* Introduction */}
        <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-black mb-4 flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-300" />
            Agreement to Terms
          </h2>
          <p className="text-white/70 leading-relaxed mb-4">
            By accessing or using FeelFlick, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of these terms, please do not use our service.
          </p>
          <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4">
            <p className="text-sm text-purple-200 font-medium leading-relaxed">
              <strong>Important:</strong> FeelFlick is a discovery tool. We do not host, stream, or provide direct access to movies or TV shows. We only provide metadata and recommendations. You are responsible for obtaining legal access to content through authorized services.
            </p>
          </div>
        </section>

        {/* User Responsibilities */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black mb-2">Your Responsibilities</h2>
            <p className="text-white/70 text-sm">
              We want to keep FeelFlick safe and helpful for everyone. Here is what we expect from you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                Account Security
              </h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>You must provide accurate information when creating an account.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>You are responsible for all activity that occurs under your account.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>Notify us immediately at <span className="text-white font-mono">support@feelflick.com</span> if you suspect unauthorized use.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Prohibited Conduct
              </h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex gap-2">
                  <span className="text-red-400">•</span>
                  <span>Do not scrape, hack, or reverse-engineer the platform.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400">•</span>
                  <span>Do not use our service for any illegal purpose.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400">•</span>
                  <span>Do not abuse our API or recommendation systems.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Intellectual Property */}
        <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-black mb-4">Intellectual Property</h2>
          <div className="space-y-4 text-sm text-white/70 leading-relaxed">
            <p>
              <strong>FeelFlick Content:</strong> Our brand, logo, design, code, and recommendation algorithms are the exclusive property of FeelFlick and are protected by copyright laws.
            </p>
            <p>
              <strong>Movie Data:</strong> Movie metadata, posters, and backdrops are provided by <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">The Movie Database (TMDB)</a>. This data is subject to TMDB's terms of use. FeelFlick uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
            <p>
              You may not copy, modify, distribute, or sell any part of our platform without our prior written permission.
            </p>
          </div>
        </section>

        {/* Disclaimers & Liability */}
        <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-black mb-4 flex items-center gap-2">
            <Gavel className="h-6 w-6 text-purple-300" />
            Disclaimers & Limitation of Liability
          </h2>
          
          <div className="space-y-4 text-sm text-white/70 leading-relaxed">
            <p className="font-semibold text-white">Service provided &quot;As Is&quot;</p>
            <p>
              FeelFlick is provided without warranties of any kind, whether express or implied. We do not guarantee that the service will be uninterrupted, error-free, or that movie data will always be accurate.
            </p>

            <p className="font-semibold text-white mt-4">Limitation of Liability</p>
            <p>
              To the fullest extent permitted by law, FeelFlick and its operators shall not be liable for any indirect, incidental, special, or consequential damages—including loss of profits, data, or goodwill—arising from your use of (or inability to use) the service.
            </p>
            <p>
              Our total liability for any claim arising out of these terms or the service shall not exceed the amount you paid us (if any) in the past 12 months.
            </p>
          </div>
        </section>

        {/* Termination & Changes */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
            <h3 className="text-lg font-bold mb-2">Termination</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              We reserve the right to suspend or terminate your account at our sole discretion, without notice, if you violate these Terms. You may also delete your account at any time via your settings.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
            <h3 className="text-lg font-bold mb-2">Changes to Terms</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              We may update these terms occasionally. Continued use of FeelFlick after changes constitutes your acceptance of the new terms. We will notify you of significant changes.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-white/10 backdrop-blur-sm p-6 md:p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-3">Legal Questions?</h2>
          <p className="text-white/80 text-sm md:text-base mb-6">
            If you have any questions about these Terms of Service, please contact us.
          </p>
          <a
            href="mailto:legal@feelflick.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-black/40 border border-white/20 text-white font-semibold hover:bg-black/60 hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <Mail className="h-4 w-4" />
            legal@feelflick.com
          </a>
        </section>

      </div>
    </div>
  )
}
