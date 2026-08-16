import { getCmsPageOrDefault } from '@imba/plugin-pages'
import { useAsyncContent } from '../useAsyncContent'
import { ActionLink, LoadingState, usePageSeo, PageHeader, Reveal, SectionHeading } from './shared'

/** `/about` — the pages plugin's `about` entry. */
export function About() {
  const { data: page, loading } = useAsyncContent(() => getCmsPageOrDefault('about'), 'page:about')
  usePageSeo(page ? { title: page.seoTitle || page.title, description: page.seoDescription } : null)
  if (loading || !page) return <LoadingState />
  const c = page.content

  return (
    <>
      <PageHeader eyebrow={c.eyebrow} title={c.title} lead={c.role}>
        <div className="mt-11 flex flex-wrap items-center gap-4">
          <ActionLink action={c.primaryAction} className="cine-btn cine-btn--accent" />
          <ActionLink action={c.secondaryAction} className="cine-btn" />
        </div>
      </PageHeader>

      <section className="mx-auto max-w-screen-2xl px-6 pb-24 lg:px-10 lg:pb-36">
        <Reveal className="max-w-3xl space-y-6">
          {c.paragraphs.map((p, i) => (
            <p key={i} className="font-sans text-base leading-relaxed text-cine-dim">{p}</p>
          ))}
        </Reveal>
      </section>

      <section className="border-y border-cine-hairline bg-cine-surface">
        <div className="mx-auto grid max-w-screen-2xl gap-16 px-6 py-24 lg:grid-cols-2 lg:px-10 lg:py-36">
          <div>
            <SectionHeading eyebrow={c.focusHeading} />
            <ul className="mt-10 flex flex-wrap gap-3">
              {c.focusAreas.map((area) => (
                <li key={area} className="border border-cine-hairline px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-cine-text">{area}</li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow={c.statsHeading} />
            <dl className="mt-10 grid grid-cols-2 gap-8">
              {c.stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-serif text-4xl text-cine-accent">{s.value}</dt>
                  <dd className="mt-2 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-cine-dim">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-screen-2xl gap-16 px-6 py-24 lg:grid-cols-2 lg:px-10 lg:py-36">
        <div>
          <SectionHeading eyebrow={c.timelineHeading} />
          <ol className="mt-10 border-l border-cine-hairline">
            {c.timeline.map((t) => (
              <li key={t.period + t.label} className="relative pl-8 pb-8 last:pb-0">
                <span className="absolute -left-px top-1.5 h-px w-5 bg-cine-accent" aria-hidden="true" />
                <span className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-accent">{t.period}</span>
                <p className="mt-1 font-serif text-xl text-cine-text">{t.label}</p>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <SectionHeading eyebrow={c.linksHeading} />
          <ul className="mt-10 flex flex-col items-start gap-3">
            {c.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="cine-link">{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
