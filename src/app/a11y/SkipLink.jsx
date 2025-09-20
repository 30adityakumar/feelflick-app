export default function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[1000] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-black"
    >
      Skip to content
    </a>
  )
}