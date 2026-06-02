import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/**
 * Minimal, dependency-light hero. Copy lifted from the real Home's lead slide.
 * Imports only react-router-dom + lucide-react (and design tokens via the host).
 */
export function Home() {
  return (
    <section className="cinema-panel section-py px-6 lg:px-10">
      <div className="max-w-screen-xl mx-auto">
        <span className="editorial-label mb-8 inline-flex">
          Imba Production · Cinematic video production
        </span>
        <h1
          className="editorial-hero"
          style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)', maxWidth: '16ch' }}
        >
          The video studio premium brands trust{' '}
          <span className="text-ink-dim">to ship work that sells.</span>
        </h1>
        <p className="editorial-lead mt-8 max-w-2xl">
          AI-driven strategy meets cinematic craft — brand films, AI video, product,
          social and post-production.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link to="/contact" className="editorial-button editorial-button--primary">
            Book a strategy call
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/blog" className="editorial-button">
            Read the journal
          </Link>
        </div>
      </div>
    </section>
  )
}
