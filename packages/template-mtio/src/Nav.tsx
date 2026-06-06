import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

// Only link to routes that actually exist in the pilot:
//  /      → template Home
//  /blog  → blog plugin
const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/blog', label: 'Journal', end: false },
]

const CONTACT_EMAIL = 'marko.tiosavljevic@gmail.com'

/** Wordmark — mono ">_ MT." matching the live mtiosavljevic nav. */
function Wordmark() {
  return (
    <Link to="/" className="group inline-flex items-baseline gap-1.5" aria-label="Marko Tiosavljević — home">
      <span className="font-mono text-sm text-cine-accent">&gt;_</span>
      <span className="font-mono text-base font-medium tracking-tight text-cine-text">MT.</span>
    </Link>
  )
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300 ${
        scrolled
          ? 'border-b border-cine-hairline bg-cine-bg/80 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-6 px-6 lg:px-10">
        <Wordmark />
        <nav className="flex items-center gap-7" aria-label="Primary">
          {LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `cine-link ${isActive ? 'is-active' : ''}`}>
              {label}
            </NavLink>
          ))}
          <a href={`mailto:${CONTACT_EMAIL}`} className="cine-btn cine-btn--accent">
            Get in touch
          </a>
        </nav>
      </div>
    </header>
  )
}
