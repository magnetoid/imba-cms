import { Link } from 'react-router-dom'
import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL, MENUS, UPWORK_URL } from './data/site'

interface FooterLink {
  label: string
  to?: string
  href?: string
}

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  ...MENUS.map((menu) => ({
    heading: menu.label,
    links: menu.links.map((l) => ({ label: l.label, to: l.to })),
  })),
  {
    heading: 'More',
    links: [
      { label: 'Journal', to: '/blog' },
      { label: 'Contact', to: '/contact' },
      { label: 'Admin', to: '/admin' },
    ],
  },
  {
    heading: 'Elsewhere',
    links: [
      { label: 'Upwork', href: UPWORK_URL },
      { label: 'GitHub', href: GITHUB_URL },
      { label: 'LinkedIn', href: LINKEDIN_URL },
    ],
  },
]

function ColumnLink({ link }: { link: FooterLink }) {
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
      <div className="mx-auto grid max-w-screen-xl grid-cols-2 gap-x-8 gap-y-10 px-6 py-14 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:px-10">
        <div className="col-span-2 lg:col-span-1">
          <p className="font-mono text-base text-cine-text">
            <span className="text-cine-accent">&gt;_</span> Marko Tiosavljević
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cine-dim">
            AI, e-commerce and marketing systems that make businesses more money. Based in Belgrade, working worldwide.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-5 inline-block font-mono text-sm text-cine-accent transition-opacity hover:opacity-80"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
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

      <div className="border-t border-cine-hairline">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-2 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-cine-faint">
            © {new Date().getFullYear()} Marko Tiosavljević
          </p>
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-cine-dim">Built on IMBA-CMS</p>
        </div>
      </div>
    </footer>
  )
}
