import { getCmsPageOrDefault } from '@imba/plugin-pages'
import { useAsyncContent } from '../useAsyncContent'
import { ActionLink, LoadingState, NumberedGrid, PageHeader, Reveal, SectionHeading, pad } from './shared'

/** `/services` — the pages plugin's `services` entry. */
export function Services() {
  const { data: page, loading } = useAsyncContent(() => getCmsPageOrDefault('services'), 'page:services')
  if (loading || !page) return <LoadingState />
  const c = page.content

  return (
    <>
      <PageHeader eyebrow={c.eyebrow} title={c.title} lead={c.intro} />

      <section className="mx-auto max-w-screen-2xl px-6 pb-24 lg:px-10 lg:pb-36">
        <NumberedGrid
          items={c.services}
          columns="sm:grid-cols-2"
          render={(s, i) => ({
            no: pad(i),
            title: s.title,
            body: (
              <>
                <p>{s.description}</p>
                {s.deliverables.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {s.deliverables.map((d) => (
                      <li key={d} className="border border-cine-hairline px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-cine-dim">{d}</li>
                    ))}
                  </ul>
                )}
              </>
            ),
          })}
        />
      </section>

      <section className="border-y border-cine-hairline bg-cine-surface">
        <div className="mx-auto max-w-screen-2xl px-6 py-24 lg:px-10 lg:py-36">
          <SectionHeading eyebrow={c.processHeading} />
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {c.process.map((p) => (
              <li key={p.step} className="border-t border-cine-hairline pt-6">
                <span className="font-mono text-[0.7rem] tracking-[0.2em] text-cine-accent">{p.step}</span>
                <h3 className="mt-3 font-serif text-2xl text-cine-text">{p.title}</h3>
                <p className="mt-3 font-sans text-sm leading-relaxed text-cine-dim">{p.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-6 py-24 lg:px-10 lg:py-36">
        <Reveal>
          <div className="flex flex-col items-start gap-10 border border-cine-accent bg-cine-accent-soft px-8 py-16 md:flex-row md:items-center md:justify-between lg:px-16 lg:py-20">
            <div className="max-w-2xl">
              <span className="cine-eyebrow">{c.ctaEyebrow}</span>
              <h2 className="cine-h2 mt-6 text-cine-text">{c.ctaTitle}</h2>
              <p className="mt-4 font-sans text-base leading-relaxed text-cine-dim">{c.ctaBody}</p>
            </div>
            <ActionLink action={c.ctaAction} className="cine-btn cine-btn--accent shrink-0" />
          </div>
        </Reveal>
      </section>
    </>
  )
}
