import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT_EMAIL, UPWORK_URL, type ProofStat } from '../data/site'

/** Top-of-page block shared by every inner page. */
export function PageHero({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <section className="mt-grid px-6 pb-20 pt-36 lg:px-10 lg:pt-44">
      <div className="mx-auto max-w-screen-xl">
        <span className="cine-eyebrow mb-7">{eyebrow}</span>
        <h1 className="cine-h1 max-w-[22ch] text-cine-text">{title}</h1>
        {lead && <p className="cine-lead mt-7 max-w-2xl">{lead}</p>}
      </div>
    </section>
  )
}

export function Section({
  label,
  children,
  id,
  tinted = false,
}: {
  label?: string
  children: ReactNode
  id?: string
  tinted?: boolean
}) {
  return (
    <section
      id={id}
      className={`border-t border-cine-hairline px-6 py-20 lg:px-10 lg:py-24 ${tinted ? 'mt-tint' : ''}`}
    >
      <div className="mx-auto max-w-screen-xl">
        {label && (
          <div className="mb-12 flex items-center gap-3">
            <h2 className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.3em] text-cine-faint">{label}</h2>
            <div className="h-px flex-1 bg-cine-hairline" />
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

export function StatStrip({ stats }: { stats: ProofStat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <div key={s.num + s.label}>
          <dt className="font-mono text-2xl text-cine-accent lg:text-3xl">{s.num}</dt>
          <dd className="mt-2 text-sm leading-relaxed text-cine-dim">{s.label}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mt-card p-7 ${className}`}
    >
      {children}
    </div>
  )
}

/** Arrow text link used at the bottom of cards and sections. */
export function ArrowLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="mt-arrow">
      {children} <span aria-hidden="true">→</span>
    </Link>
  )
}

/** The closing call to action used on the client-facing pages. */
export function WorkWithMe({
  title = 'Tell me what you want to grow.',
  body = 'Send me a few lines about your business and what is not working. I will tell you honestly whether I can help, and what I would do first.',
}: {
  title?: string
  body?: string
}) {
  return (
    <Section tinted>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="cine-h2 max-w-[20ch] text-cine-text">{title}</h2>
          <p className="cine-lead mt-5 max-w-xl">{body}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <a href={`mailto:${CONTACT_EMAIL}`} className="cine-btn cine-btn--accent">
            Email me
          </a>
          <a href={UPWORK_URL} target="_blank" rel="noopener noreferrer" className="cine-btn">
            Hire me on Upwork
          </a>
        </div>
      </div>
    </Section>
  )
}
