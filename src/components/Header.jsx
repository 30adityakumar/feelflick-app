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
          className="h-9 w-9 object-contain rounded"
        />
        <div>
          <h1 className="text-2xl font-extrabold leading-tight">FeelFlick</h1>
          <p className="text-xs text-orange-200">Movies that match your mood.</p>
        </div>
      </div>
    </header>
  )
}
