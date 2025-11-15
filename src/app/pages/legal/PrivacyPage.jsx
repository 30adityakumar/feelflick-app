// src/app/pages/legal/PrivacyPage.jsx
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPage() {
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
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black">
              Privacy Policy
            </h1>
          </div>
          <p className="text-lg text-white/70">
            Last updated: November 15, 2025
          </p>
        </div>

        {/* Policy Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          <Section title="Your Privacy Matters">
            <p>
              At FeelFlick, we believe privacy is a fundamental right. This policy explains how we 
              collect, use, and protect your information. We're committed to being transparent about 
              our practices.
            </p>
          </Section>

          <Section title="Information We Collect">
            <h3 className="font-bold text-lg mt-4 mb-2">Account Information</h3>
            <p>
              When you sign up with Google OAuth, we collect your email address and name. We never 
              see your Google password.
            </p>

            <h3 className="font-bold text-lg mt-4 mb-2">Usage Data</h3>
            <p>
              We collect information about how you interact with FeelFlick, including movies you view, 
              add to your watchlist, or mark as watched. This helps us provide personalized recommendations.
            </p>

            <h3 className="font-bold text-lg mt-4 mb-2">Technical Information</h3>
            <p>
              We collect basic technical data like your browser type, device information, and IP address 
              to ensure FeelFlick works properly and to prevent abuse.
            </p>
          </Section>

          <Section title="How We Use Your Information">
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Provide mood-based movie recommendations</li>
              <li>Save your watchlist and viewing history</li>
              <li>Improve FeelFlick's features and performance</li>
              <li>Send important service updates (we never spam)</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </Section>

          <Section title="What We Don't Do">
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>We <strong>never sell</strong> your personal data</li>
              <li>We <strong>don't share</strong> your viewing habits with third parties</li>
              <li>We <strong>don't track you</strong> across other websites</li>
              <li>We <strong>don't show ads</strong> (and never will)</li>
            </ul>
          </Section>

          <Section title="Data Security">
            <p>
              We use industry-standard security measures to protect your data, including encryption 
              in transit and at rest. We work with trusted partners (Supabase for auth, TMDB for movie data) 
              who meet high security standards.
            </p>
          </Section>

          <Section title="Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and all associated data</li>
              <li>Export your watchlist and viewing history</li>
              <li>Opt out of recommendation personalization</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@feelflick.com" className="text-orange-400 hover:underline">
                privacy@feelflick.com
              </a>
            </p>
          </Section>

          <Section title="Children's Privacy">
            <p>
              FeelFlick is not intended for users under 13. We do not knowingly collect data from children. 
              If you believe a child has provided us with personal information, please contact us.
            </p>
          </Section>

          <Section title="Changes to This Policy">
            <p>
              We may update this policy from time to time. We'll notify you of significant changes via 
              email or a prominent notice on FeelFlick.
            </p>
          </Section>

          <Section title="Contact Us">
            <p>
              Questions about privacy? Email us at{' '}
              <a href="mailto:privacy@feelflick.com" className="text-orange-400 hover:underline">
                privacy@feelflick.com
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
