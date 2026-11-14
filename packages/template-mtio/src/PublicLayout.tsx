import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Nav } from './Nav'
import { Footer } from './Footer'

/**
 * A new page should start at the top; the router keeps the old scroll position.
 * A link with a #hash (e.g. /services#ecommerce) scrolls to that section instead.
 * This lives in the layout, not the page, because a parent effect runs after
 * its children's: a page-level hash scroll would be undone by this one.
 */
function useScrollOnNavigate() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
      // 'instant' on purpose: tokens.css sets smooth scrolling on <html>, and a
      // page change must not animate down (or up) through the whole page.
      if (target) target.scrollIntoView({ behavior: 'instant' })
      else window.scrollTo({ top: 0, behavior: 'instant' })
    } catch {
      // jsdom implements neither scrollTo nor scrollIntoView; nothing to do in tests.
    }
  }, [pathname, hash])
}

export function PublicLayout({ children }: { children?: ReactNode }) {
  useScrollOnNavigate()
  return (
    <div className="min-h-screen bg-cine-bg text-cine-text">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <Nav />
      <main id="main-content">{children}</main>
      <Footer />
    </div>
  )
}
