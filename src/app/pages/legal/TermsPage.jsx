// src/app/pages/legal/TermsPage.jsx
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 md:py-16">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black">
              Terms of Service
            </h1>
          </div>
          <p className="text-lg text-white/70">
            Last updated: November 15, 2025
          </p>
        </div>

        {/* Terms Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          <Section title="Agreement to Terms">
            <p>
              By accessing or using FeelFlick, you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, please do not use FeelFlick.
            </p>
          </Section>

          <Section title="What FeelFlick Provides">
            <p>
              FeelFlick is a free movie discovery platform that provides mood-based recommendations, 
              watchlist management, and viewing history tracking. We source movie data from The Movie 
              Database (TMDB) API.
            </p>
            <p>
              <strong>Important:</strong> FeelFlick does not host, stream, or provide access to movies. 
              We only provide information and recommendations. You are responsible for obtaining legal 
              access to content through appropriate streaming services.
            </p>
          </Section>

          <Section title="Your Account">
            <h3 className="font-bold text-lg mt-4 mb-2">Registration</h3>
            <p>
              To use certain features, you must create an account. You agree to provide accurate information 
              and keep your account secure.
            </p>

            <h3 className="font-bold text-lg mt-4 mb-2">Account Responsibility</h3>
            <p>
              You are responsible for all activity under your account. If you believe your account has been 
              compromised, contact us immediately at{' '}
              <a href="mailto:support@feelflick.com" className="text-orange-400 hover:underline">
                support@feelflick.com
              </a>
            </p>
          </Section>

          <Section title="Acceptable Use">
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Use FeelFlick for any illegal purpose</li>
              <li>Attempt to hack, scrape, or reverse-engineer the platform</li>
              <li>Share accounts or violate security measures</li>
              <li>Abuse our recommendation system or create fake engagement</li>
              <li>Impersonate others or create misleading accounts</li>
              <li>Upload malicious code or spam</li>
            </ul>
          </Section>

          <Section title="Intellectual Property">
            <p>
              FeelFlick's design, code, and branding are owned by us. Movie data, images, and metadata 
              are provided by TMDB and are subject to their terms of use. You may not copy, modify, or 
              distribute FeelFlick's proprietary content.
            </p>
          </Section>

          <Section title="Third-Party Services">
            <p>
              FeelFlick integrates with third-party services:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li><strong>TMDB:</strong> Movie data and images</li>
              <li><strong>Supabase:</strong> Authentication and database</li>
              <li><strong>Google OAuth:</strong> Sign-in service</li>
            </ul>
            <p className="mt-4">
              These services have their own terms and privacy policies. FeelFlick is not responsible 
              for third-party service actions or outages.
            </p>
          </Section>

          <Section title="Disclaimer of Warranties">
            <p>
              FeelFlick is provided "as is" without warranties of any kind. We do not guarantee:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Uninterrupted or error-free service</li>
              <li>Accuracy of movie data or recommendations</li>
              <li>Compatibility with all devices or browsers</li>
            </ul>
          </Section>

          <Section title="Limitation of Liability">
            <p>
              To the fullest extent permitted by law, FeelFlick and its operators are not liable for any 
              indirect, incidental, or consequential damages arising from your use of the platform.
            </p>
          </Section>

          <Section title="Service Changes">
            <p>
              We reserve the right to modify, suspend, or discontinue any part of FeelFlick at any time. 
              We'll try to provide notice for major changes, but we're not obligated to do so.
            </p>
          </Section>

          <Section title="Termination">
            <p>
              We may suspend or terminate your account if you violate these terms. You may delete your 
              account at any time from your account settings.
            </p>
          </Section>

          <Section title="Governing Law">
            <p>
              These terms are governed by the laws of your jurisdiction. Any disputes will be resolved 
              through binding arbitration.
            </p>
          </Section>

          <Section title="Changes to Terms">
            <p>
              We may update these terms from time to time. Continued use of FeelFlick after changes 
              constitutes acceptance of the new terms.
            </p>
          </Section>

          <Section title="Contact Us">
            <p>
              Questions about these terms? Email us at{' '}
              <a href="mailto:legal@feelflick.com" className="text-orange-400 hover:underline">
                legal@feelflick.com
              </a>
            </p>
          </Section>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="text-white/80 leading-relaxed space-y-4">{children}</div>
    </section>
  )
}
