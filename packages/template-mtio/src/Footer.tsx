import { Link } from 'react-router-dom'

const CONTACT_EMAIL = 'marko.tiosavljevic@gmail.com'

const COLUMNS: { heading: string; links: { label: string; to?: string; href?: string }[] }[] = [
  {
    heading: 'Navigation',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Journal', to: '/blog' },
      { label: 'Admin', to: '/admin' },
    ],
  },
  {
    heading: 'Social',
    links: [
      { label: 'LinkedIn', href: 'https://linkedin.com/in/mtiosavljevic' },
      { label: 'GitHub', href: 'https://github.com/magnetoid' },
      { label: 'Twitter / X', href: 'https://twitter.com/mtiosavljevic' },
    ],
  },
]

function ColumnLink({ link }: { link: { label: string; to?: string; href?: string } }) {
  const cls =
    'font-mono text-[0.7rem] uppercase tracking-[0.12em] text-cine-dim transition-colors hover:text-cine-text'
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
      <section className="mx-auto max-w-screen-xl px-6 py-20 lg:px-10 lg:py-28">
        <span className="cine-eyebrow mb-8">Get in touch</span>
        <h2 className="cine-h2 max-w-[20ch] text-cine-text">Let&rsquo;s build something.</h2>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-8 inline-block font-mono text-lg text-cine-accent transition-opacity hover:opacity-80"
        >
          {CONTACT_EMAIL}
        </a>
      </section>

      <div className="border-t border-cine-hairline">
        <div className="mx-auto grid max-w-screen-xl grid-cols-2 gap-x-8 gap-y-10 px-6 py-14 lg:px-10">
          {COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-4">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-cine-faint">{col.heading}</p>
              <nav className="flex flex-col items-start gap-3" aria-label={col.heading}>
                {col.links.map((link) => (
                  <ColumnLink key={col.heading + link.label} link={link} />
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-cine-hairline">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-2 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-cine-faint">
            © 2026 Marko Tiosavljević
          </p>
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-cine-dim">Built on IMBA-CMS</p>
        </div>
      </div>
    </footer>
  )
}
