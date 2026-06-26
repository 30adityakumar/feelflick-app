// src/features/landing/components/LandingFooter.jsx
// Landing back cover: brand + a brief human line, grouped nav columns (valid public/legal
// routes only — /discover, /browse, /about, /privacy, /terms, Contact; no /feedback), and
// the REQUIRED TMDB attribution (official local logo asset public/brand/tmdb.svg plus the
// textual "not endorsed or certified by TMDB" notice, visible even if the image fails).
const FOOTER_NAV = [
  { title: 'Explore', links: [['Discover', '/discover'], ['Browse', '/browse']] },
  { title: 'Company', links: [['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
  { title: 'Connect', links: [['Contact', 'mailto:hello@feelflick.com']] },
]

export default function LandingFooter() {
  return (
    <footer className="ff-l-footer">
      <div className="ff-l-shell ff-l-footer-inner">
        <div className="ff-l-footer-brand">
          <span className="ff-l-wordmark">FEELFLICK</span>
          <p className="ff-l-footer-tagline">Movies, made personal.</p>
          <p className="ff-l-footer-note">
            Built by Aditya Kumar in Toronto, around a belief that recommendations should
            feel personal.
          </p>
        </div>
        <nav className="ff-l-footer-nav" aria-label="Footer">
          <div className="ff-l-footer-cols">
            {FOOTER_NAV.map((col) => (
              <div key={col.title} className="ff-l-footer-col">
                <p className="ff-l-footer-col__title">{col.title}</p>
                <ul>
                  {col.links.map(([label, href]) => (
                    <li key={label}><a href={href}>{label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
