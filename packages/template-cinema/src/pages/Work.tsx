import { Link } from 'react-router-dom'
import { listProjectsOrDefault } from '@imba/plugin-projects'
import { useAsyncContent } from '../useAsyncContent'
import { LoadingState, PageHeader, Reveal, pad } from './shared'

const RATIOS = ['aspect-[16/10]', 'aspect-[4/5]', 'aspect-[4/5]', 'aspect-[16/10]', 'aspect-[3/2]', 'aspect-[3/2]']
const SPANS = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7', 'lg:col-span-6', 'lg:col-span-6']

/** `/work` — every published project from the projects plugin. */
export function Work() {
  const { data: projects, loading } = useAsyncContent(listProjectsOrDefault, 'projects')

  return (
    <>
      <PageHeader eyebrow="Work" title="Selected projects." lead="Case studies from the studio — what we were asked, what we made, and what changed." />
      {loading || !projects ? (
        <LoadingState />
      ) : (
        <section className="mx-auto max-w-screen-2xl px-6 pb-28 lg:px-10 lg:pb-40">
          <div className="grid grid-cols-1 gap-x-6 gap-y-14 lg:grid-cols-12">
            {projects.map((project, i) => (
              <Reveal key={project.slug} className={SPANS[i % SPANS.length]} delay={(i % 2) * 0.08}>
                <Link
                  to={`/work/${project.slug}`}
                  className="cine-work-card group block focus:outline-none"
                  aria-label={`${project.name} — ${project.category}`}
                >
                  <div className={`relative ${RATIOS[i % RATIOS.length]} overflow-hidden border border-cine-hairline bg-cine-surface`}>
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-cine-surface-2 to-cine-surface transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                      style={project.accent ? { boxShadow: `inset 0 -1px 0 0 ${project.accent}` } : undefined}
                    />
                    <div className="cine-vignette" />
                    <span className="absolute left-5 top-4 font-mono text-[0.7rem] tracking-[0.18em] text-cine-accent">
                      {pad(i)}
                    </span>
                    <span className="absolute bottom-4 left-5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-dim">
                      {project.year}
                    </span>
                  </div>
                  <div className="mt-5 flex items-baseline justify-between gap-4">
                    <h3 className="font-serif text-2xl tracking-[-0.01em] text-cine-text lg:text-3xl">{project.name}</h3>
                    <span className="shrink-0 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-dim">
                      {project.category}
                    </span>
                  </div>
                  <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-cine-dim">{project.tagline}</p>
                  <div className="cine-work-rule mt-4" />
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
