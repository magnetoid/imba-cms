import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useDocumentSeo, useThemeConfig } from '@imba/core'

/** Section reveal wrapper — fades/translates in, once, with reduced-motion guard. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

/** Renders a `{ label, to?, href? }` action as the right kind of link. */
export function ActionLink({
  action,
  className,
}: {
  action: { label: string; to?: string; href?: string } | undefined
  className: string
}) {
  if (!action) return null
  if (action.href && !action.to) {
    return (
      <a href={action.href} className={className} target={action.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
        {action.label}
      </a>
    )
  }
  return (
    <Link to={action.to ?? '/'} className={className}>
      {action.label}
    </Link>
  )
}

/** Standard interior-page header: eyebrow, display title, optional lead. */
export function PageHeader({ eyebrow, title, lead, children }: { eyebrow?: string; title: string; lead?: string; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-screen-2xl px-6 pt-36 pb-16 lg:px-10 lg:pt-44 lg:pb-24">
      <div className="max-w-4xl">
        {eyebrow && <span className="cine-eyebrow">{eyebrow}</span>}
        <h1 className="cine-display mt-7 text-cine-text">{title}</h1>
        {lead && <p className="cine-lead mt-8 max-w-2xl">{lead}</p>}
        {children}
      </div>
    </section>
  )
}

export function SectionHeading({ eyebrow, title }: { eyebrow?: string; title?: string }) {
  if (!eyebrow && !title) return null
  return (
    <Reveal>
      {eyebrow && <span className="cine-eyebrow">{eyebrow}</span>}
      {title && <h2 className="cine-h2 mt-6 max-w-[18ch] text-cine-text">{title}</h2>}
    </Reveal>
  )
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="mx-auto max-w-screen-2xl px-6 pt-40 pb-24 lg:px-10" role="status" aria-live="polite">
      <span className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-cine-dim">{label}</span>
    </div>
  )
}

export function NotFoundState({ title, backTo, backLabel }: { title: string; backTo: string; backLabel: string }) {
  return (
    <section className="mx-auto max-w-screen-2xl px-6 pt-40 pb-24 lg:px-10">
      <span className="cine-eyebrow">404</span>
      <h1 className="cine-h2 mt-6 text-cine-text">{title}</h1>
      <Link to={backTo} className="cine-btn mt-10 inline-block">
        {backLabel}
      </Link>
    </section>
  )
}

/** Mono-numbered list block used for services / process / approach. */
export function NumberedGrid<T>({
  items,
  columns = 'sm:grid-cols-2 lg:grid-cols-4',
  render,
}: {
  items: readonly T[]
  columns?: string
  render: (item: T, index: number) => { no: string; title: string; body: ReactNode }
}) {
  return (
    <div className={`mt-16 grid grid-cols-1 gap-px overflow-hidden border border-cine-hairline bg-cine-hairline ${columns}`}>
      {items.map((item, i) => {
        const cell = render(item, i)
        return (
          <Reveal key={cell.no + cell.title} delay={i * 0.06}>
            <div className="flex h-full flex-col gap-5 bg-cine-bg p-8 lg:p-9">
              <span className="font-mono text-[0.7rem] tracking-[0.2em] text-cine-accent">{cell.no}</span>
              <h3 className="font-serif text-2xl tracking-[-0.01em] text-cine-text">{cell.title}</h3>
              <div className="font-sans text-sm leading-relaxed text-cine-dim">{cell.body}</div>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

export function pad(i: number): string {
  return String(i + 1).padStart(2, '0')
}

/**
 * Applies a CMS record's SEO fields to the document. The route-level
 * `PublicRouteElement` sets a static title on mount; this runs again once the
 * record loads (its deps change), so the editor-managed values win.
 */
export function usePageSeo(seo: { title?: string; description?: string; type?: 'website' | 'article' } | null) {
  const theme = useThemeConfig()
  useDocumentSeo({
    title: seo?.title,
    description: seo?.description,
    type: seo?.type,
    siteName: theme.siteName ?? theme.brand?.name,
    siteUrl: theme.siteUrl,
  })
}
