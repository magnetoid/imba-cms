import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { MENUS, type Menu } from './data/site'

/**
 * Primary navigation: two dropdown menus plus the Journal and a contact button.
 *
 *   Build & Research     — the lab: research, systems, case studies
 *   Marketing & Services — the shop: services, client results, how I work
 *
 * Desktop menus open on click (and on hover for a mouse), close on Escape,
 * on an outside click, and on navigation. Below `lg` the same links are listed
 * in one panel behind a Menu button, because hover does not exist on touch.
 */

/** Wordmark — mono ">_ MT." matching the live mtiosavljevic nav. */
function Wordmark() {
  return (
    <Link to="/" className="group inline-flex items-baseline gap-1.5" aria-label="Marko Tiosavljević — home">
      <span className="font-mono text-sm text-cine-accent">&gt;_</span>
      <span className="font-mono text-base font-medium tracking-tight text-cine-text">MT.</span>
    </Link>
  )
}

function Dropdown({
  menu,
  open,
  onOpen,
  onClose,
  active,
}: {
  menu: Menu
  open: boolean
  onOpen: () => void
  onClose: () => void
  active: boolean
}) {
  const panelId = `menu-${menu.id}`
  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        type="button"
        className={`cine-link inline-flex items-center gap-2 bg-transparent ${active || open ? 'is-active' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? onClose() : onOpen())}
      >
        {menu.label}
        <span aria-hidden="true" className={`text-[0.55rem] transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && (
        // The pt-3 wrapper bridges the gap so the pointer can travel from the
        // button to the panel without the menu closing on the way.
        <div className="absolute -left-4 top-full pt-3">
          <div id={panelId} className="mt-menu">
            {menu.links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={onClose}>
                <span className="block font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-cine-text">
                  {link.label}
                </span>
                <span className="mt-1.5 block text-[0.82rem] leading-snug text-cine-dim">{link.note}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [openMenu, setOpenMenu] = useState<Menu['id'] | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Any navigation closes whatever was open.
  useEffect(() => {
    setOpenMenu(null)
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null)
        setMobileOpen(false)
      }
    }
    const onPointer = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [])

  const isActive = (menu: Menu) => menu.links.some((l) => pathname === l.to || pathname.startsWith(`${l.to}/`))
  const solid = scrolled || mobileOpen

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300 ${
        solid ? 'mt-header-solid border-b border-cine-hairline' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-6 px-6 lg:px-10">
        <Wordmark />

        {/* Desktop */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {MENUS.map((menu) => (
            <Dropdown
              key={menu.id}
              menu={menu}
              open={openMenu === menu.id}
              onOpen={() => setOpenMenu(menu.id)}
              onClose={() => setOpenMenu(null)}
              active={isActive(menu)}
            />
          ))}
          <NavLink to="/blog" className={({ isActive: a }) => `cine-link ${a ? 'is-active' : ''}`}>
            Journal
          </NavLink>
          <Link to="/contact" className="cine-btn cine-btn--accent">
            Work with me
          </Link>
        </nav>

        {/* Mobile toggle. The wrapper carries lg:hidden because .cine-btn sets
            its own display, which would win over the utility on the button. */}
        <div className="lg:hidden">
          <button
            type="button"
            className="cine-btn px-4 py-2.5"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <nav
          id="mobile-menu"
          aria-label="Primary mobile"
          className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-cine-hairline bg-cine-bg px-6 pb-8 pt-6 lg:hidden"
        >
          {MENUS.map((menu) => (
            <div key={menu.id} className="mb-7">
              <p className="mb-3 font-mono text-[0.64rem] uppercase tracking-[0.22em] text-cine-accent">{menu.label}</p>
              <ul className="flex flex-col">
                {menu.links.map((link) => (
                  <li key={link.to}>
                    <NavLink to={link.to} className="block py-2.5 text-lg text-cine-text">
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <NavLink to="/blog" className="block py-2.5 text-lg text-cine-text">
            Journal
          </NavLink>
          <Link to="/contact" className="cine-btn cine-btn--accent mt-6 flex w-full">
            Work with me
          </Link>
        </nav>
      )}
    </header>
  )
}
