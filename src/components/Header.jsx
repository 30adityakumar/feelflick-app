export default function Header () {
  return (
    <header
      className="px-4 py-6 shadow-md text-white"
      style={{
        background: 'linear-gradient(to right, #002b57, #ff5e3a)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)'
      }}
    >
      <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="FeelFlick Logo"
            style={{
              height: '36px',
              width: '36px',
              objectFit: 'contain',
              borderRadius: '6px'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: '1.1', marginBottom: '0.1rem' }}>
              FeelFlick
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#ffd6cb', margin: 0 }}>
              Movies that match your mood.
            </p>
          </div>
        </div>
      </header>
  )
}
