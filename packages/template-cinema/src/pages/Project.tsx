import { Link, useParams } from 'react-router-dom'
import { getProjectOrDefault } from '@imba/plugin-projects'
import { useAsyncContent } from '../useAsyncContent'
import { LoadingState, NotFoundState, NumberedGrid, Reveal, SectionHeading, pad } from './shared'

/** `/work/:slug` — one project case study from the projects plugin. */
export function Project() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data: project, loading } = useAsyncContent(() => getProjectOrDefault(slug), `project:${slug}`)

  if (loading) return <LoadingState />
  if (!project) return <NotFoundState title="That project isn’t here." backTo="/work" backLabel="← All work" />

  const c = project.content

  return (
    <>
      <section className="mx-auto max-w-screen-2xl px-6 pt-36 pb-16 lg:px-10 lg:pt-44 lg:pb-24">
        <Link to="/work" className="cine-link">← All work</Link>
        <div className="mt-10 max-w-4xl">
          <span className="cine-eyebrow">{project.category} · {project.year}</span>
          <h1 className="cine-display mt-7 text-cine-text">{project.name}</h1>
          <p className="cine-lead mt-8 max-w-2xl">{project.tagline}</p>
          {project.hero && <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-cine-dim">{project.hero}</p>}
          <div className="mt-11 flex flex-wrap items-center gap-4">
            {project.url && (
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="cine-btn cine-btn--accent">
                Visit project
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Role · stack · stats */}
      <section className="border-y border-cine-hairline bg-cine-surface">
        <div className="mx-auto grid max-w-screen-2xl gap-12 px-6 py-16 lg:grid-cols-3 lg:px-10">
          <div>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-cine-faint">Role</p>
            <p className="mt-3 font-serif text-xl text-cine-text">{c.role}</p>
          </div>
          <div>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-cine-faint">Stack</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {c.stack.map((s) => (
                <li key={s} className="border border-cine-hairline px-2 py-0.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-cine-dim">{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-cine-faint">By the numbers</p>
            <dl className="mt-3 grid grid-cols-2 gap-4">
              {c.stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-serif text-2xl text-cine-text">{s.num}</dt>
                  <dd className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-cine-dim">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-screen-2xl px-6 py-24 lg:px-10 lg:py-36">
        <Reveal className="max-w-3xl">
          <span className="cine-eyebrow">The problem</span>
          <h2 className="cine-h2 mt-6 text-cine-text">{c.problem.title}</h2>
          <p className="mt-6 font-sans text-base leading-relaxed text-cine-dim">{c.problem.body}</p>
        </Reveal>
      </section>

      {/* Approach */}
      <section className="mx-auto max-w-screen-2xl px-6 pb-24 lg:px-10 lg:pb-36">
        <SectionHeading eyebrow="Approach" title="How we got there." />
        <NumberedGrid
          items={c.approach}
          columns="sm:grid-cols-2 lg:grid-cols-3"
          render={(step, i) => ({ no: pad(i), title: step.title, body: step.body })}
        />
      </section>

      {/* Features */}
      {c.features.length > 0 && (
        <section className="border-y border-cine-hairline bg-cine-surface">
          <div className="mx-auto max-w-screen-2xl px-6 py-24 lg:px-10 lg:py-36">
            <SectionHeading eyebrow="What shipped" title="Features." />
            <ul className="mt-12 grid gap-8 md:grid-cols-2">
              {c.features.map((f) => (
                <li key={f.title} className="border-t border-cine-hairline pt-6">
                  <h3 className="font-serif text-xl text-cine-text">{f.title}</h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-cine-dim">{f.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Outcomes + lessons */}
      <section className="mx-auto grid max-w-screen-2xl gap-16 px-6 py-24 lg:grid-cols-2 lg:px-10 lg:py-36">
        <div>
          <SectionHeading eyebrow="Outcomes" />
          <dl className="mt-10 grid grid-cols-2 gap-8">
            {c.outcomes.map((o) => (
              <div key={o.label}>
                <dt className="font-serif text-4xl text-cine-accent">{o.metric}</dt>
                <dd className="mt-2 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-cine-dim">{o.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <SectionHeading eyebrow="Lessons" />
          <ul className="mt-10 space-y-4">
            {c.lessons.map((l, i) => (
              <li key={i} className="flex gap-4 font-sans text-sm leading-relaxed text-cine-dim">
                <span className="shrink-0 font-mono text-[0.7rem] tracking-[0.2em] text-cine-accent">{pad(i)}</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {c.quote && (
        <section className="border-t border-cine-hairline bg-cine-surface">
          <div className="mx-auto max-w-screen-2xl px-6 py-24 lg:px-10 lg:py-32">
            <blockquote className="max-w-4xl">
              <p className="font-serif font-light leading-[1.15] tracking-[-0.01em] text-cine-text" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 3rem)' }}>
                “{c.quote.text}”
              </p>
              <footer className="mt-6 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-dim">— {c.quote.attribution}</footer>
            </blockquote>
          </div>
        </section>
      )}
    </>
  )
}
