import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center text-white">
      <div className="text-6xl font-bold tracking-tight">404</div>
      <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-white/70">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          to="/"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          Go home
        </Link>
        <Link
          to="/movies"
          className="rounded-md border border-white/25 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          Browse movies
        </Link>
      </div>
    </div>
  )
}