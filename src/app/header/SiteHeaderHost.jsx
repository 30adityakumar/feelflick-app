// src/app/header/SiteHeaderHost.jsx
// Shared site-header host. Owns the fixed-header placement, the smart
// hide-on-scroll visibility, the global command-palette search state ("/" to open,
// Escape to close, not while typing), and renders the single shared <Header> +
// global <SearchBar>. Both AppShell (authenticated + anonymous app routes) and the
// anonymous Landing consume this host, so there is exactly one header implementation
// and one set of search keyboard listeners — never a duplicated Landing clone.
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '@/app/header/Header'
import SearchBar from '@/app/header/components/SearchBar'

export default function SiteHeaderHost() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)
  const location = useLocation()

  // "/" opens search when the user is not typing; Escape closes it.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen])

  // Smart hide-on-scroll: show at the top or while scrolling up, hide while
  // scrolling down past the threshold. The translate is collapsed for
  // reduced-motion users (motion-reduce + the global reduced-motion reset), so the
  // header still appears/disappears but without an animated slide.
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          if (currentScrollY < lastScrollY.current || currentScrollY < 100) {
            setHeaderVisible(true)
          } else if (currentScrollY > 100 && currentScrollY > lastScrollY.current) {
            setHeaderVisible(false)
          }
          lastScrollY.current = currentScrollY
          ticking.current = false
        })
        ticking.current = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Re-reveal the header on every route change.
  useEffect(() => {
    setHeaderVisible(true)
  }, [location.pathname])

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 motion-reduce:transition-none ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <Header onOpenSearch={() => setSearchOpen(true)} />
      </div>

      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
