// src/features/legal/Privacy.jsx
// Privacy policy, rebuilt in the Adaptive Editorial Cinema direction to match the new
// website. A TOP-LEVEL route (outside PublicShell) that owns its own
// <header>/<main id="main">/<footer> as siblings, reusing the SAME shared header
// (SiteHeaderHost) + footer (LandingFooter) as the landing. This is a PRESENTATION rebuild
// only: every legal disclosure is preserved verbatim and the "Last updated" date is
// unchanged. No purple/pink gradients, no Lucide icons, no glass boxes — the .ff-landing
// tokens + .ff-l-legal-* document styles carry the look.
import { Link } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import '../landing/landing.css'
import SiteHeaderHost from '@/app/header/SiteHeaderHost'
import LandingFooter from '@/features/landing/components/LandingFooter'

export default function Privacy() {
  usePageMeta({
    title: 'Privacy — FeelFlick',
    description: "FeelFlick's privacy policy: what we collect, what we don't, and how your taste data is used to improve your recommendations only.",
    url: 'https://app.feelflick.com/privacy',
  })

  return (
    <div className="ff-landing">
      <a href="#main" className="ff-l-skip">Skip to content</a>
      <SiteHeaderHost />
      <main id="main">
        <article className="ff-l-legal" aria-labelledby="ff-l-privacy-h">
          <header className="ff-l-legal-head">
            <p className="ff-l-eyebrow">Legal</p>
            <h1 id="ff-l-privacy-h" className="ff-l-legal-title">Privacy Policy</h1>
            <p className="ff-l-legal-updated">Last updated: November 15, 2025</p>
          </header>

          <section aria-labelledby="ff-l-privacy-overview">
            <h2 id="ff-l-privacy-overview">Overview</h2>
            <p>
              At FeelFlick, privacy is a core product value — not an afterthought. This policy
              explains what we collect, why we collect it, and how we protect your information
              when you use FeelFlick.
            </p>
            <p>
              By using FeelFlick, you agree to this Privacy Policy. If you do not agree, please
              do not use the service.
            </p>
          </section>

          <section aria-labelledby="ff-l-privacy-collect">
            <h2 id="ff-l-privacy-collect">Information we collect</h2>
            <p>
              We only collect information we need to provide mood-based movie recommendations,
              keep your account working, and protect the service from abuse.
            </p>

            <h3>Account information</h3>
            <p>When you sign up with Google OAuth, we receive:</p>
            <ul>
              <li>Your name</li>
              <li>Your email address</li>
            </ul>
            <p>We never see or store your Google password.</p>

            <h3>Usage &amp; viewing data</h3>
            <p>To power personalized recommendations and your account features, we store:</p>
            <ul>
              <li>Movies you view in the app</li>
              <li>Movies you add to your watchlist</li>
              <li>Movies you mark as watched</li>
              <li>Your saved preferences (such as genres or moods)</li>
            </ul>

            <h3>Technical information</h3>
            <p>To keep FeelFlick secure and functioning properly, we may collect:</p>
            <ul>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address and general location (country/region)</li>
              <li>Log data related to errors and security events</li>
            </ul>

            <h3>What we do NOT intentionally collect</h3>
            <p>
              We do not intentionally collect sensitive categories of personal data such as
              health information, political opinions, or religious beliefs.
            </p>
            <p>
              Please do not share sensitive personal information with us through support
              messages or feedback forms.
            </p>
          </section>

          <section aria-labelledby="ff-l-privacy-use">
            <h2 id="ff-l-privacy-use">How we use your information</h2>
            <p>We use your information solely to provide and improve FeelFlick. Typical uses include:</p>
            <ul>
              <li>Providing mood-based movie recommendations tailored to you</li>
              <li>Saving and syncing your watchlist and viewing history across devices</li>
              <li>Improving recommendation quality, search, and overall product experience</li>
              <li>Sending important service-related notifications (for example, critical changes or security alerts)</li>
              <li>Detecting, preventing, and responding to fraud, abuse, and security incidents</li>
              <li>Complying with legal obligations where applicable</li>
            </ul>
            <p>We do not use your personal data for advertising or sell it to anyone.</p>
          </section>

          <section aria-labelledby="ff-l-privacy-taste">
            <h2 id="ff-l-privacy-taste">Taste-match discovery</h2>
            <p>
              FeelFlick can suggest other members with compatible film taste. This is for
              signed-in members only, and you take part only if you turn on{' '}
              <strong>Appear in taste-match discovery</strong> in your Account settings.
            </p>
            <ul>
              <li>When you opt in, other signed-in members may see your name, avatar, your top film-taste tags, and your film count as a suggested match.</li>
              <li>Your watched film titles and dates, your Diary, your ratings, your reviews, and your generated Cinematic DNA reflection are <strong>not</strong> included.</li>
              <li>You can withdraw from discovery at any time by turning the setting off.</li>
            </ul>
          </section>

          <section aria-labelledby="ff-l-privacy-never">
            <h2 id="ff-l-privacy-never">What we never do</h2>
            <div className="ff-l-legal-note">
              <ul>
                <li>We never sell your personal data.</li>
                <li>We do not share your viewing habits with advertisers.</li>
                <li>We do not track you across other websites.</li>
                <li>We do not show ads inside FeelFlick.</li>
                <li>We do not buy third-party data about you to profile you.</li>
                <li>We do not allow third parties to use your data for their own marketing.</li>
              </ul>
            </div>
          </section>

          <section aria-labelledby="ff-l-privacy-third">
            <h2 id="ff-l-privacy-third">Third-party services &amp; security</h2>
            <p>
              We use trusted infrastructure providers to run FeelFlick. Today, that includes
              Supabase (authentication, database, hosting) and TMDB (movie metadata and artwork).
            </p>
            <p>
              <strong>Usage analytics &amp; error monitoring.</strong> We use PostHog for
              privacy-safe product analytics and Sentry for error monitoring, to understand
              reliability and usability during our beta. We do <strong>not</strong> send your
              email, name, search text, reviews, Diary entries, or Cinematic DNA reflection to
              PostHog — only a stable internal account identifier and coarse, non-identifying
              usage events. Where session replay is used, all text and form inputs are masked so
              private content is not captured. You can turn product analytics off any time in
              Account → Privacy.
            </p>
            <p>
              These providers process data on our behalf under strict contractual and security
              obligations. We do not grant them permission to use your personal information for
              their own marketing.
            </p>
            <p>
              We use industry-standard security measures to protect your data, including
              encryption in transit (HTTPS) and encryption at rest where available from our
              providers.
            </p>
            <p className="ff-l-legal-note">
              No online service can guarantee absolute security. We work continuously to protect
              your data but cannot promise that unauthorized access, hacking, or other breaches
              will never occur.
            </p>
          </section>

          <section aria-labelledby="ff-l-privacy-retention">
            <h2 id="ff-l-privacy-retention">Data retention &amp; location</h2>
            <p>
              We keep your data for as long as your account is active or as needed to provide
              FeelFlick. If you delete your account, we delete or anonymize your personal data
              within a reasonable period, except where we are legally required to keep certain
              records.
            </p>
            <p>
              Our infrastructure is currently hosted in data centers operated by our providers,
              which may be located outside your country of residence. By using FeelFlick, you
              consent to this cross-border data processing.
            </p>
          </section>

          <section aria-labelledby="ff-l-privacy-rights">
            <h2 id="ff-l-privacy-rights">Your rights &amp; choices</h2>
            <p>
              Depending on your location and applicable law, you may have some or all of the
              rights below. We apply these principles broadly as a matter of good practice, even
              where not legally required.
            </p>
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete information.</li>
              <li>Delete your account and associated personal data.</li>
              <li>Export your watchlist and viewing history in a portable format.</li>
              <li>Opt out of personalized recommendations (which may reduce product quality).</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:privacy@feelflick.com">privacy@feelflick.com</a> from the email
              associated with your account so we can verify your identity.
            </p>
          </section>

          <section aria-labelledby="ff-l-privacy-children">
            <h2 id="ff-l-privacy-children">Children&apos;s privacy</h2>
            <p>
              FeelFlick is not intended for children under 13, and we do not knowingly collect
              personal information from children under 13.
            </p>
            <p>
              If you believe a child has created an account or provided us with personal
              information, please contact us immediately so we can delete the data.
            </p>
          </section>

          <section aria-labelledby="ff-l-privacy-changes">
            <h2 id="ff-l-privacy-changes">Changes, disclaimers &amp; legal terms</h2>
            <p>
              We may update this Privacy Policy from time to time as we add features, change
              providers, or as laws evolve. When we make material changes, we will notify you by
              email or through a prominent in-app notice.
            </p>
            <p>Your continued use of FeelFlick after changes take effect means you agree to the revised policy.</p>
            <p className="ff-l-legal-fine">
              This Privacy Policy is provided for transparency and product explanation and is not
              legal advice. FeelFlick is provided &quot;as is&quot; and &quot;as available&quot;
              without warranties of any kind, to the fullest extent permitted by applicable law.
              Where permitted, our total liability arising out of or relating to this Policy or
              your use of FeelFlick is limited to the amount you have paid us (if any) for using
              the service in the twelve months before the dispute.
            </p>
          </section>

          <section className="ff-l-legal-contact" aria-labelledby="ff-l-privacy-contact">
            <h2 id="ff-l-privacy-contact">Questions about privacy?</h2>
            <p>
              If you have questions, concerns, or requests related to your data or this Privacy
              Policy, reach out any time.
            </p>
            <div className="ff-l-legal-actions">
              <a className="ff-l-btn ff-l-btn--primary" href="mailto:privacy@feelflick.com">privacy@feelflick.com</a>
              <Link className="ff-l-btn ff-l-btn--ghost" to="/">Back to home</Link>
            </div>
          </section>
        </article>
      </main>
      <LandingFooter />
    </div>
  )
}
