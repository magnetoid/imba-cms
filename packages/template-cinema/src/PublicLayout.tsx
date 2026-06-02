import type { ReactNode } from 'react'
import { Nav } from './Nav'
import { Footer } from './Footer'

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <Nav />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  )
}
