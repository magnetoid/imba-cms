import { Link } from 'react-router-dom'

const CONTACT_EMAIL = 'hello@imbaproduction.com'

const COLUMNS: { heading: string; links: { label: string; to?: string; href?: string }[] }[] = [
  {
    heading: 'Studio',
    links: [
      { label: 'Work', to: '/work' },
      { label: 'Services', to: '/services' },
      { label: 'Journal', to: '/blog' },
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    heading: 'Social',
    links: [
      { label: 'Instagram', href: 'https://instagram.com' },
      { label: 'LinkedIn', href: 'https://linkedin.com' },
      { label: 'Vimeo', href: 'https://vimeo.com' },
      { label: 'YouTube', href: 'https://youtube.com' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
      { label: 'Admin', to: '/admin' },
    ],
  },
]

function ColumnLink({ link }: { link: { label: string; to?: string; href?: string } }) {
  const cls =
    'font-mono text-[0.72rem] uppercase tracking-[0.12em] text-cine-dim transition-colors hover:text-cine-text'
  if (link.href) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
        {link.label}
      </a>
    )
  }
  return (
    <Link to={link.to ?? '/'} className={cls}>
      {link.label}
    </Link>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-cine-hairline bg-cine-bg text-cine-text">
      {/* Big serif CTA */}
      <section className="mx-auto max-w-screen-2xl px-6 py-24 lg:px-10 lg:py-32">
        <span className="cine-eyebrow mb-8">Get in touch</span>
        <h2 className="cine-h2 max-w-[18ch] text-cine-text" style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}>
          Let&rsquo;s make something cinematic.
        </h2>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-10 inline-block font-serif text-2xl text-cine-accent transition-opacity hover:opacity-80 lg:text-3xl"
        >
          {CONTACT_EMAIL}
        </a>
      </section>

      {/* Three mono columns */}
      <div className="border-t border-cine-hairline">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-2 gap-x-8 gap-y-12 px-6 py-16 sm:grid-cols-3 lg:px-10">
          {COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-4">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-cine-faint">
                {col.heading}
              </p>
              <nav className="flex flex-col items-start gap-3" aria-label={col.heading}>
                {col.links.map((link) => (
                  <ColumnLink key={col.heading + link.label} link={link} />
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom hairline row */}
      <div className="border-t border-cine-hairline">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-2 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-cine-faint">
            © 2026 Imba Production
          </p>
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-cine-dim">
            Built on IMBA-CMS
          </p>
        </div>
      </div>
    </footer>
  )
}
