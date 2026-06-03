import type { ReactNode } from 'react'
import { Nav } from './Nav'
import { Footer } from './Footer'

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-cine-bg text-cine-text">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      {/* Decorative fixed film-grain overlay */}
      <div className="cine-grain" aria-hidden="true" />
      <Nav />
      <main id="main-content">{children}</main>
      <Footer />
    </div>
  )
}
