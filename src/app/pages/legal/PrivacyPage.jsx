// src/app/pages/PrivacyPage.jsx
import { Link } from 'react-router-dom'
import { Shield, Lock, EyeOff, FileText, Mail, AlertTriangle, Globe } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-black to-pink-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(168,85,247,0.25),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(236,72,153,0.18),transparent_55%)]" />

        <div className="relative mx-auto max-w-4xl px-4 md:px-8 pt-32 md:pt-40 pb-20 md:pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-5">
            <Shield className="h-4 w-4 text-purple-300" />
            <span className="text-sm font-semibold text-white/80">Privacy Policy</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Your privacy comes first
          </h1>

          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
            Last updated: November 15, 2025
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative mx-auto max-w-5xl px-4 md:px-8 pb-20 space-y-12 md:space-y-16">
        {/* Intro */}
        <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-black mb-4 flex items-center gap-2">
            <Lock className="h-6 w-6 text-purple-300" />
            Overview
          </h2>
          <p className="text-white/70 leading-relaxed mb-3">
            At FeelFlick, privacy is a core product value — not an afterthought. This policy explains what we collect, why we collect it, and how we protect your information when you use FeelFlick.
          </p>
          <p className="text-white/70 leading-relaxed">
            By using FeelFlick, you agree to this Privacy Policy. If you do not agree, please do not use the service.
          </p>
        </section>

        {/* What we collect */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black mb-2">Information we collect</h2>
            <p className="text-white/70 text-sm">
              We only collect information we need to provide mood‑based movie recommendations, keep your account working, and protect the service from abuse.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Account Info */}
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
              <h3 className="text-lg font-bold mb-2">Account information</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-3">
                When you sign up with Google OAuth, we receive:
              </p>
              <ul className="list-disc list-inside text-white/70 text-sm space-y-1">
                <li>Your name</li>
                <li>Your email address</li>
              </ul>
              <p className="text-white/70 text-sm mt-3">
                We never see or store your Google password.
              </p>
            </div>

            {/* Usage Data */}
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
              <h3 className="text-lg font-bold mb-2">Usage & viewing data</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-3">
                To power personalized recommendations and your account features, we store:
              </p>
              <ul className="list-disc list-inside text-white/70 text-sm space-y-1">
                <li>Movies you view in the app</li>
                <li>Movies you add to your watchlist</li>
                <li>Movies you mark as watched</li>
                <li>Your saved preferences (such as genres or moods)</li>
              </ul>
            </div>

            {/* Technical Info */}
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
              <h3 className="text-lg font-bold mb-2">Technical information</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-3">
                To keep FeelFlick secure and functioning properly, we may collect:
              </p>
              <ul className="list-disc list-inside text-white/70 text-sm space-y-1">
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>IP address and general location (country/region)</li>
                <li>Log data related to errors and security events</li>
              </ul>
            </div>

            {/* No sensitive categories */}
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
              <h3 className="text-lg font-bold mb-2">What we do NOT intentionally collect</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-3">
                We do not intentionally collect sensitive categories of personal data such as health information, political opinions, or religious beliefs.
              </p>
              <p className="text-white/70 text-sm leading-relaxed">
                Please do not share sensitive personal information with us through support messages or feedback forms.
              </p>
            </div>
          </div>
        </section>

        {/* How we use data */}
        <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-black mb-4 flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-300" />
            How we use your information
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            We use your information solely to provide and improve FeelFlick. Typical uses include:
          </p>
          <ul className="list-disc list-inside text-white/70 text-sm space-y-1 mb-4">
            <li>Providing mood‑based movie recommendations tailored to you</li>
            <li>Saving and syncing your watchlist and viewing history across devices</li>
            <li>Improving recommendation quality, search, and overall product experience</li>
            <li>Sending important service‑related notifications (for example, critical changes or security alerts)</li>
            <li>Detecting, preventing, and responding to fraud, abuse, and security incidents</li>
            <li>Complying with legal obligations where applicable</li>
          </ul>
          <p className="text-white/70 text-sm leading-relaxed">
            We do not use your personal data for advertising or sell it to anyone.
          </p>
        </section>

        {/* What we never do */}
        <section className="rounded-2xl bg-white/5 border border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-black mb-4 flex items-center gap-2">
            <EyeOff className="h-6 w-6 text-pink-300" />
            What we never do
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-white/80">
            <ul className="list-disc list-inside space-y-1">
              <li>We never sell your personal data.</li>
              <li>We do not share your viewing habits with advertisers.</li>
              <li>We do not track you across other websites.</li>
            </ul>
            <ul className="list-disc list-inside space-y-1">
              <li>We do not show ads inside FeelFlick.</li>
              <li>We do not buy third‑party data about you to profile you.</li>
              <li>We do not allow third parties to use your data for their own marketing.</li>
            </ul>
          </div>
        </section>

        {/* Third parties & security */}
        <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 md:p-8 space-y-6">
          <h2 className="text-2xl md:text-3xl font-black mb-2">Third‑party services & security</h2>

          <div className="space-y-3 text-sm text-white/70 leading-relaxed">
            <p>
              We use trusted infrastructure providers to run FeelFlick. Today, that includes Supabase (authentication, database, hosting) and TMDB (movie metadata and artwork).
            </p>
            <p>
              These providers process data on our behalf under strict contractual and security obligations. We do not grant them permission to use your personal information for their own marketing.
            </p>
            <p>
              We use industry‑standard security measures to protect your data, including encryption in transit (HTTPS) and encryption at rest where available from our providers.
            </p>
          </div>

          <div className="rounded-xl bg-black/40 border border-white/10 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-300 mt-0.5" />
            <p className="text-xs text-white/70 leading-relaxed">
              No online service can guarantee absolute security. We work continuously to protect your data but cannot promise that unauthorized access, hacking, or other breaches will never occur.
            </p>
          </div>
        </section>

        {/* Data retention & location */}
        <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 md:p-8 space-y-5">
          <h2 className="text-2xl md:text-3xl font-black mb-2">Data retention & location</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            We keep your data for as long as your account is active or as needed to provide FeelFlick. If you delete your account, we delete or anonymize your personal data within a reasonable period, except where we are legally required to keep certain records.
          </p>
          <p className="text-white/70 text-sm leading-relaxed flex items-center gap-2">
            <Globe className="h-4 w-4 text-purple-300" />
            Our infrastructure is currently hosted in data centers operated by our providers, which may be located outside your country of residence. By using FeelFlick, you consent to this cross‑border data processing.
          </p>
        </section>

        {/* Your rights */}
        <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 md:p-8 space-y-4">
          <h2 className="text-2xl md:text-3xl font-black mb-2">Your rights & choices</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Depending on your location and applicable law, you may have some or all of the rights below. We apply these principles broadly as a matter of good practice, even where not legally required.
          </p>
          <ul className="list-disc list-inside text-white/70 text-sm space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate or incomplete information.</li>
            <li>Delete your account and associated personal data.</li>
            <li>Export your watchlist and viewing history in a portable format.</li>
            <li>Opt out of personalized recommendations (which may reduce product quality).</li>
          </ul>
          <p className="text-white/70 text-sm leading-relaxed">
            To exercise any of these rights, contact us at <span className="font-mono text-white">privacy@feelflick.com</span> from the email associated with your account so we can verify your identity.
          </p>
        </section>

        {/* Children */}
        <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 md:p-8 space-y-3">
          <h2 className="text-2xl md:text-3xl font-black mb-2">Children&apos;s privacy</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            FeelFlick is not intended for children under 13, and we do not knowingly collect personal information from children under 13.
          </p>
          <p className="text-white/70 text-sm leading-relaxed">
            If you believe a child has created an account or provided us with personal information, please contact us immediately so we can delete the data.
          </p>
        </section>

        {/* Changes & legal protections */}
        <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 md:p-8 space-y-4">
          <h2 className="text-2xl md:text-3xl font-black mb-2">Changes, disclaimers & legal terms</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            We may update this Privacy Policy from time to time as we add features, change providers, or as laws evolve. When we make material changes, we will notify you by email or through a prominent in‑app notice.
          </p>
          <p className="text-white/70 text-sm leading-relaxed">
            Your continued use of FeelFlick after changes take effect means you agree to the revised policy.
          </p>
          <p className="text-white/70 text-xs leading-relaxed">
            This Privacy Policy is provided for transparency and product explanation and is not legal advice. FeelFlick is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, to the fullest extent permitted by applicable law. Where permitted, our total liability arising out of or relating to this Policy or your use of FeelFlick is limited to the amount you have paid us (if any) for using the service in the twelve months before the dispute.
          </p>
        </section>

        {/* Contact */}
        <section className="rounded-2xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-white/10 backdrop-blur-sm p-6 md:p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-3 flex items-center justify-center gap-2">
            <Mail className="h-6 w-6 text-white" />
            Questions about privacy?
          </h2>
          <p className="text-white/80 text-sm md:text-base mb-6 max-w-xl mx-auto leading-relaxed">
            If you have questions, concerns, or requests related to your data or this Privacy Policy, reach out any time.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:privacy@feelflick.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-black/40 border border-white/20 text-white font-semibold text-sm md:text-base hover:bg-black/60 hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <Mail className="h-4 w-4" />
              privacy@feelflick.com
            </a>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-semibold text-sm md:text-base hover:bg-white/20 hover:scale-105 active:scale-95 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
