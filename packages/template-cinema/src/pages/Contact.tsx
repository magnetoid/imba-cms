import { getCmsPageOrDefault } from '@imba/plugin-pages'
import { useAsyncContent } from '../useAsyncContent'
import { ActionLink, LoadingState, PageHeader, Reveal, SectionHeading } from './shared'

/** `/contact` — the pages plugin's `contact` entry. */
export function Contact() {
  const { data: page, loading } = useAsyncContent(() => getCmsPageOrDefault('contact'), 'page:contact')
  if (loading || !page) return <LoadingState />
  const c = page.content

  return (
    <>
      <PageHeader eyebrow={c.eyebrow} title={c.title} lead={c.intro}>
        <a
          href={`mailto:${c.email}`}
          className="mt-10 inline-block font-serif text-2xl text-cine-accent transition-opacity hover:opacity-80 lg:text-3xl"
        >
          {c.email}
        </a>
      </PageHeader>

      <section className="border-y border-cine-hairline bg-cine-surface">
        <div className="mx-auto grid max-w-screen-2xl gap-16 px-6 py-24 lg:grid-cols-2 lg:px-10 lg:py-36">
          <div>
            <SectionHeading eyebrow={c.responseHeading} />
            <p className="mt-8 max-w-prose font-sans text-base leading-relaxed text-cine-dim">{c.responseText}</p>
          </div>
          <div>
            <SectionHeading eyebrow={c.profilesHeading} />
            <ul className="mt-8 flex flex-col items-start gap-3">
              {c.profiles.map((p) => (
                <li key={p.href}>
                  <a href={p.href} target="_blank" rel="noopener noreferrer" className="cine-link">{p.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-6 py-24 lg:px-10 lg:py-36">
        <Reveal>
          <div className="flex flex-col items-start gap-10 border border-cine-accent bg-cine-accent-soft px-8 py-16 md:flex-row md:items-center md:justify-between lg:px-16 lg:py-20">
            <div className="max-w-2xl">
              <span className="cine-eyebrow">{c.noteEyebrow}</span>
              <h2 className="cine-h2 mt-6 text-cine-text">{c.noteTitle}</h2>
              <p className="mt-4 font-sans text-base leading-relaxed text-cine-dim">{c.noteBody}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-4">
              <ActionLink action={c.notePrimaryAction} className="cine-btn cine-btn--accent" />
              <ActionLink action={c.noteSecondaryAction} className="cine-btn" />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}
