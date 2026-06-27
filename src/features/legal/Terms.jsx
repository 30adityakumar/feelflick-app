// src/features/legal/Terms.jsx
// Terms of Service, rebuilt in the Adaptive Editorial Cinema direction to match the new
// website (mirrors Privacy.jsx). A TOP-LEVEL route (outside PublicShell) that owns its own
// <header>/<main id="main">/<footer> as siblings, reusing the SAME shared header
// (SiteHeaderHost) + footer (LandingFooter) + the .ff-l-legal-* document styles. This is a
// PRESENTATION rebuild only: every legal clause is preserved verbatim and the "Last updated"
// date is unchanged. No purple/pink gradients, no Lucide icons, no glass boxes.
import { Link } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import '../landing/landing.css'
import SiteHeaderHost from '@/app/header/SiteHeaderHost'
import LandingFooter from '@/features/landing/components/LandingFooter'

export default function Terms() {
  usePageMeta({
    title: 'Terms — FeelFlick',
    description: 'FeelFlick terms of service: your responsibilities, our rules of engagement, intellectual property, and TMDB attribution.',
    url: 'https://app.feelflick.com/terms',
  })

  return (
    <div className="ff-landing">
      <a href="#main" className="ff-l-skip">Skip to content</a>
      <SiteHeaderHost />
      <main id="main">
        <article className="ff-l-legal" aria-labelledby="ff-l-terms-h">
          <header className="ff-l-legal-head">
            <p className="ff-l-eyebrow">Legal</p>
            <h1 id="ff-l-terms-h" className="ff-l-legal-title">Terms of Service</h1>
            <p className="ff-l-legal-updated">Last updated: November 15, 2025</p>
          </header>

          <section aria-labelledby="ff-l-terms-agreement">
            <h2 id="ff-l-terms-agreement">Agreement to Terms</h2>
            <p>
              By accessing or using FeelFlick, you agree to be bound by these Terms of Service
              and our Privacy Policy. If you disagree with any part of these terms, please do not
              use our service.
            </p>
            <p className="ff-l-legal-note">
              <strong>Important:</strong> FeelFlick is a discovery tool. We do not host, stream,
              or provide direct access to movies or TV shows. We only provide metadata and
              recommendations. You are responsible for obtaining legal access to content through
              authorized services.
            </p>
          </section>

          <section aria-labelledby="ff-l-terms-resp">
            <h2 id="ff-l-terms-resp">Your responsibilities</h2>
            <p>We want to keep FeelFlick safe and helpful for everyone. Here is what we expect from you.</p>

            <h3>Account security</h3>
            <ul>
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>Notify us immediately at <a href="mailto:support@feelflick.com">support@feelflick.com</a> if you suspect unauthorized use.</li>
            </ul>

            <h3>Prohibited conduct</h3>
            <ul>
              <li>Do not scrape, hack, or reverse-engineer the platform.</li>
              <li>Do not use our service for any illegal purpose.</li>
              <li>Do not abuse our API or recommendation systems.</li>
            </ul>
          </section>

          <section aria-labelledby="ff-l-terms-ip">
            <h2 id="ff-l-terms-ip">Intellectual property</h2>
            <p>
              <strong>FeelFlick content:</strong> Our brand, logo, design, code, and
              recommendation algorithms are the exclusive property of FeelFlick and are protected
              by copyright laws.
            </p>
            <p>
              <strong>Movie data:</strong> Movie metadata, posters, and backdrops are provided by{' '}
              <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">The Movie Database (TMDB)</a>.
              This data is subject to TMDB&apos;s terms of use. FeelFlick uses the TMDB API but is
              not endorsed or certified by TMDB.
            </p>
            <p>
              You may not copy, modify, distribute, or sell any part of our platform without our
              prior written permission.
            </p>
          </section>

          <section aria-labelledby="ff-l-terms-disclaimers">
            <h2 id="ff-l-terms-disclaimers">Disclaimers &amp; limitation of liability</h2>
            <h3>Service provided &quot;as is&quot;</h3>
            <p>
              FeelFlick is provided without warranties of any kind, whether express or implied. We
              do not guarantee that the service will be uninterrupted, error-free, or that movie
              data will always be accurate.
            </p>
            <h3>Limitation of liability</h3>
            <p>
              To the fullest extent permitted by law, FeelFlick and its operators shall not be
              liable for any indirect, incidental, special, or consequential damages—including
              loss of profits, data, or goodwill—arising from your use of (or inability to use)
              the service.
            </p>
            <p>
              Our total liability for any claim arising out of these terms or the service shall
              not exceed the amount you paid us (if any) in the past 12 months.
            </p>
          </section>

          <section aria-labelledby="ff-l-terms-termination">
            <h2 id="ff-l-terms-termination">Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at our sole discretion,
              without notice, if you violate these Terms. You may also delete your account at any
              time via your settings.
            </p>
          </section>

          <section aria-labelledby="ff-l-terms-changes">
            <h2 id="ff-l-terms-changes">Changes to terms</h2>
            <p>
              We may update these terms occasionally. Continued use of FeelFlick after changes
              constitutes your acceptance of the new terms. We will notify you of significant
              changes.
            </p>
          </section>

          <section className="ff-l-legal-contact" aria-labelledby="ff-l-terms-contact">
            <h2 id="ff-l-terms-contact">Legal questions?</h2>
            <p>If you have any questions about these Terms of Service, please contact us.</p>
            <div className="ff-l-legal-actions">
              <a className="ff-l-btn ff-l-btn--primary" href="mailto:legal@feelflick.com">legal@feelflick.com</a>
              <Link className="ff-l-btn ff-l-btn--ghost" to="/">Back to home</Link>
            </div>
          </section>
        </article>
      </main>
      <LandingFooter />
    </div>
  )
}
