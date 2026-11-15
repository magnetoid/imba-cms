import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLink, Card, PageHero, Section, WorkWithMe } from '../components/blocks'
import { CASE_STUDIES, caseStudyTrack, findCaseStudy, type CaseStudyData } from '../data/case-studies'

function StudyCard({ study }: { study: CaseStudyData }) {
  return (
    <Link to={`/projects/${study.slug}`} className="group block h-full">
      <Card className="flex h-full flex-col">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-cine-faint">{study.category}</p>
          <p className="shrink-0 font-mono text-[0.66rem] text-cine-faint">{study.year}</p>
        </div>
        <h3 className="mt-4 text-2xl font-light text-cine-text">{study.name}</h3>
        <p className="mt-3 flex-1 leading-relaxed text-cine-dim">{study.tagline}</p>
        <span className="mt-arrow mt-6">
          Case study <span aria-hidden="true">→</span>
        </span>
      </Card>
    </Link>
  )
}

export function Projects() {
  const build = CASE_STUDIES.filter((s) => caseStudyTrack(s) === 'build')
  const marketing = CASE_STUDIES.filter((s) => caseStudyTrack(s) === 'marketing')
  return (
    <>
      <PageHero
        eyebrow="Build & Research · Case studies"
        title="Products I have built, from the problem to the outcome."
        lead="Each study covers the problem, how I approached it, what shipped, and what I learned. I designed and built all of them myself."
      />
      <Section label="AI products & platforms">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {build.map((s) => (
            <StudyCard key={s.slug} study={s} />
          ))}
        </div>
      </Section>
      <Section label="Marketing & SEO tools" tinted>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {marketing.map((s) => (
            <StudyCard key={s.slug} study={s} />
          ))}
        </div>
      </Section>
      <WorkWithMe
        title="Want something like this built for your business?"
        body="The same person who built these builds for clients. Tell me what you need and I will tell you how I would approach it."
      />
    </>
  )
}

/**
 * Title and description for a single case study.
 *
 * The route itself has no `seo` (one route serves every study), so core's
 * PublicRouteElement sets the title to the bare site name. That effect belongs
 * to a parent, and parent effects run after their children's, so setting the
 * title in a plain effect here gets overwritten. Deferring by a tick lets this
 * page have the last word. Core should let a page own its SEO; until it does,
 * this stays local to the template.
 */
function useCaseStudySeo(study: CaseStudyData | undefined) {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const timer = setTimeout(() => {
      document.title = study ? `${study.name} — ${study.tagline} | Marko Tiosavljević` : 'Case study not found'
      if (!study) return
      let meta = document.head.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', study.summary)
    }, 0)
    return () => clearTimeout(timer)
  }, [study])
}

export function ProjectPage() {
  const { slug } = useParams()
  const study = findCaseStudy(slug)

  useCaseStudySeo(study)

  if (!study) {
    return (
      <>
        <PageHero eyebrow="Case studies" title="That case study does not exist." />
        <Section>
          <ArrowLink to="/projects">All case studies</ArrowLink>
        </Section>
      </>
    )
  }

  const index = CASE_STUDIES.indexOf(study)
  const next = CASE_STUDIES[(index + 1) % CASE_STUDIES.length]

  return (
    <>
      <section className="mt-grid px-6 pb-20 pt-36 lg:px-10 lg:pt-44">
        <div className="mx-auto max-w-screen-xl">
          <Link to="/projects" className="mt-arrow mb-8">
            <span aria-hidden="true">←</span> Case studies
          </Link>
          <p className="mt-8 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-cine-accent">
            {study.category} · {study.year}
          </p>
          <h1 className="cine-h1 mt-5 text-cine-text">{study.name}</h1>
          <p className="mt-5 max-w-3xl text-2xl font-light leading-snug text-cine-text">{study.tagline}</p>
          <p className="cine-lead mt-7 max-w-3xl">{study.hero}</p>
          {study.url && (
            <a href={study.url} target="_blank" rel="noopener noreferrer" className="cine-btn mt-9">
              Visit {study.url.replace(/^https?:\/\//, '')} ↗
            </a>
          )}
        </div>
      </section>

      <Section label="In numbers">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
          {study.stats.map((s) => (
            <div key={s.num + s.label}>
              <dt className="font-mono text-2xl text-cine-accent lg:text-3xl">{s.num}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-cine-dim">{s.label}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section label="Overview" tinted>
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <p className="text-lg font-light leading-relaxed text-cine-text">{study.summary}</p>
            <h3 className="mt-10 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-faint">My role</h3>
            <p className="mt-3 leading-relaxed text-cine-dim">{study.role}</p>
          </div>
          <div>
            <h3 className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-faint">Stack</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {study.stack.map((t) => (
                <li key={t} className="border border-cine-hairline px-3 py-1.5 font-mono text-[0.7rem] text-cine-dim">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section label="The problem">
        <h2 className="cine-h2 max-w-[24ch] text-cine-text">{study.problem.title}</h2>
        <p className="mt-7 max-w-3xl leading-relaxed text-cine-dim">{study.problem.body}</p>
      </Section>

      <Section label="The approach" tinted>
        <ol className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          {study.approach.map((a, i) => (
            <li key={a.title}>
              <span className="font-mono text-sm text-cine-accent">0{i + 1}</span>
              <h3 className="mt-3 text-xl font-light text-cine-text">{a.title}</h3>
              <p className="mt-3 leading-relaxed text-cine-dim">{a.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section label="What it does">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {study.features.map((f) => (
            <Card key={f.title}>
              <h3 className="font-mono text-sm tracking-wide text-cine-text">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-cine-dim">{f.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section label="Outcomes" tinted>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
          {study.outcomes.map((o) => (
            <div key={o.metric + o.label}>
              <dt className="font-mono text-2xl text-cine-accent">{o.metric}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-cine-dim">{o.label}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section label="What I learned">
        <ul className="flex max-w-3xl flex-col gap-6">
          {study.lessons.map((l) => (
            <li key={l} className="border-l border-cine-accent pl-6 leading-relaxed text-cine-dim">
              {l}
            </li>
          ))}
        </ul>
        {study.quote && (
          <figure className="mt-14 max-w-3xl">
            <blockquote className="text-2xl font-light leading-snug text-cine-text">“{study.quote.text}”</blockquote>
            <figcaption className="mt-5 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-cine-faint">
              {study.quote.attribution}
            </figcaption>
          </figure>
        )}
      </Section>

      <Section tinted>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-faint">Next case study</p>
            <Link to={`/projects/${next.slug}`} className="mt-3 block text-2xl font-light text-cine-text hover:text-cine-accent">
              {next.name} →
            </Link>
          </div>
          <Link to="/contact" className="cine-btn cine-btn--accent">
            Work with me
          </Link>
        </div>
      </Section>
    </>
  )
}
