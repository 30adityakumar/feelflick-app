import { Outlet } from 'react-router-dom'
import SkipLink from '@/app/a11y/SkipLink'
import RouteAnnouncer from '@/app/a11y/RouteAnnouncer'
import FocusOnNavigate from '@/app/a11y/FocusOnNavigate'
// import Header from '@/app/header/Header' // if you have a header component

export default function AppShell() {
  return (
    <>
      <SkipLink />
      {/* <Header /> */}
      <RouteAnnouncer />
      <FocusOnNavigate />
      <main id="main" className="min-h-[70vh]">
        <Outlet />
      </main>
    </>
  )
}