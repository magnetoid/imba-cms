import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/work', label: 'Work' },
  { to: '/services', label: 'Services' },
  { to: '/blog', label: 'Journal' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

/** Wordmark — Fraunces "Imba" + small mono "PRODUCTION". */
function Wordmark() {
  return (
    <Link to="/" className="group inline-flex items-baseline gap-2" aria-label="Imba Production — home">
      <span className="font-serif text-xl leading-none tracking-[-0.02em] text-cine-text">Imba</span>
      <span className="font-mono text-[0.6rem] tracking-[0.28em] uppercase text-cine-dim transition-colors group-hover:text-cine-accent">
        Production
      </span>
    </Link>
  )
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  // Scroll listener — guarded for SSR/jsdom (no window).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll while the mobile overlay is open — guarded.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const prev = document.body.style.overflow
    document.body.style.overflow = open ? 'hidden' : prev || ''
    return () => {
      document.body.style.overflow = prev || ''
    }
  }, [open])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300 ${
          scrolled
            ? 'border-b border-cine-hairline bg-cine-bg/80 backdrop-blur-md'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-6 px-6 lg:h-20 lg:px-10">
          <Wordmark />

          {/* Desktop links */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `cine-link ${isActive ? 'is-active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
            <Link to="/contact" className="cine-btn cine-btn--accent ml-2">
              Start a project
            </Link>
          </nav>

          {/* Mobile burger */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center text-cine-text lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <span className="relative inline-block h-4 w-5">
              <span
                className={`absolute left-0 right-0 h-px bg-current transition-all duration-300 ${
                  open ? 'top-2 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 right-0 top-2 h-px bg-current transition-opacity duration-300 ${
                  open ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 right-0 h-px bg-current transition-all duration-300 ${
                  open ? 'top-2 -rotate-45' : 'top-4'
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile full-screen overlay menu */}
      <div
        className={`fixed inset-0 z-40 bg-cine-bg transition-opacity duration-300 lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col justify-center gap-1 px-8">
          <span className="cine-eyebrow mb-8">Menu</span>
          {LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `font-serif text-5xl leading-[1.05] tracking-[-0.02em] transition-colors ${
                  isActive ? 'text-cine-accent' : 'text-cine-text hover:text-cine-accent'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/contact"
            onClick={() => setOpen(false)}
            className="cine-btn cine-btn--accent mt-10 self-start"
          >
            Start a project
          </Link>
        </div>
      </div>
    </>
  )
}
