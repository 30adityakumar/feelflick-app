// src/features/landing/components/LandingFooter.jsx
// Valid legal routes only (/about, /privacy, /terms — no /feedback). Required TMDB
// attribution notice (textual; no unverified logo asset).
export default function LandingFooter() {
  return (
    <footer className="ff-l-footer">
      <div className="ff-l-shell ff-l-footer-inner">
        <div className="ff-l-footer-brand">
          <span className="ff-l-wordmark">FEELFLICK</span>
          <p className="ff-l-footer-tagline">Movies, made personal.</p>
        </div>
        <nav className="ff-l-footer-nav" aria-label="Footer">
          <a href="/about">About</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="mailto:hello@feelflick.com">Contact</a>
        </nav>
      </div>
      <div className="ff-l-shell ff-l-footer-legal">
        <div className="ff-l-attrib">
          <a className="ff-l-tmdb" href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" aria-label="The Movie Database (TMDB)">
            <img className="ff-l-tmdb-logo" src="/brand/tmdb.svg" alt="The Movie Database (TMDB)" width="167" height="14" decoding="async" />
          </a>
          <p className="ff-l-footer-attribution">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
        <p className="ff-l-footer-copy">© 2026 FeelFlick</p>
      </div>
    </footer>
  )
}
