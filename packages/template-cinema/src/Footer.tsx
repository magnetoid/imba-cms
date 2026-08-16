import { Link } from 'react-router-dom'
import { useThemeConfig } from '@imba/core'
import type { ThemeColumn, ThemeLink } from '@imba/core'
import { CINEMA_THEME_DEFAULTS } from './themeDefaults'

function ColumnLink({ link }: { link: ThemeLink }) {
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

/**
 * Everything rendered here comes from the merged theme config: the template's
 * defaults (`CINEMA_THEME_DEFAULTS`) underneath whatever the site plugin has
 * published. Social links are shown as their own column so the site plugin's
 * `footer.socialLinks` and `footer.columns` both land somewhere visible.
 */
export function Footer() {
  const theme = useThemeConfig()
  const footer = theme.footer ?? CINEMA_THEME_DEFAULTS.footer!
  const contactEmail = footer.contactEmail ?? CINEMA_THEME_DEFAULTS.footer!.contactEmail
  const ctaEyebrow = footer.ctaEyebrow ?? CINEMA_THEME_DEFAULTS.footer!.ctaEyebrow
  const ctaTitle = footer.ctaTitle ?? CINEMA_THEME_DEFAULTS.footer!.ctaTitle
  const copyright = footer.copyright ?? CINEMA_THEME_DEFAULTS.footer!.copyright
  const platformNote = footer.platformNote ?? CINEMA_THEME_DEFAULTS.footer!.platformNote

  const columns: ThemeColumn[] = [...(footer.columns ?? [])]
  if (footer.socialLinks && footer.socialLinks.length > 0) {
    columns.splice(Math.min(1, columns.length), 0, { heading: 'Social', links: footer.socialLinks })
  }

  return (
    <footer className="border-t border-cine-hairline bg-cine-bg text-cine-text">
      {/* Big serif CTA */}
      <section className="mx-auto max-w-screen-2xl px-6 py-24 lg:px-10 lg:py-32">
        {ctaEyebrow && <span className="cine-eyebrow mb-8">{ctaEyebrow}</span>}
        {ctaTitle && (
          <h2 className="cine-h2 max-w-[18ch] text-cine-text" style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}>
            {ctaTitle}
          </h2>
        )}
        {footer.contactBlurb && (
          <p className="mt-6 max-w-prose text-cine-dim">{footer.contactBlurb}</p>
        )}
        {contactEmail && (
          <a
            href={`mailto:${contactEmail}`}
            className="mt-10 inline-block font-serif text-2xl text-cine-accent transition-opacity hover:opacity-80 lg:text-3xl"
          >
            {contactEmail}
          </a>
        )}
      </section>

      {/* Mono columns */}
      {columns.length > 0 && (
        <div className="border-t border-cine-hairline">
          <div className="mx-auto grid max-w-screen-2xl grid-cols-2 gap-x-8 gap-y-12 px-6 py-16 sm:grid-cols-3 lg:px-10">
            {columns.map((col) => (
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
      )}

      {/* Bottom hairline row */}
      <div className="border-t border-cine-hairline">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-2 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-cine-faint">
            {copyright}
          </p>
          {platformNote && (
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-cine-dim">
              {platformNote}
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
