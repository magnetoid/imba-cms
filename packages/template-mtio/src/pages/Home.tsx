import { Link } from 'react-router-dom'
import { ArrowLink, Card, Section, StatStrip, WorkWithMe } from '../components/blocks'
import { CASE_STUDIES } from '../data/case-studies'
import { RESEARCH_AREAS } from '../data/research'
import { SERVICES } from '../data/services'
import { EXPERIENCE, PROOF_STATS } from '../data/site'

/** Case studies shown on the home page, in this order. */
const FEATURED = ['clearcount', 'morpheus', 'woopulse']

export function Home() {
  const featured = FEATURED.map((slug) => CASE_STUDIES.find((c) => c.slug === slug)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  )

  return (
    <>
      {/* ── HERO ── */}
      <section className="mt-grid relative overflow-hidden px-6 pb-24 pt-36 lg:px-10 lg:pt-44">
        <div className="mx-auto max-w-screen-xl">
          <span className="cine-eyebrow mb-7">Marko Tiosavljević · AI · E-commerce · Marketing</span>
          <h1 className="cine-display max-w-[20ch] text-cine-text">
            I build the AI, stores and marketing that make your business <em className="not-italic text-cine-accent">more money</em>.
          </h1>
          <p className="cine-lead mt-8 max-w-2xl">
            Most marketers cannot build, and most developers have never been responsible for revenue. I have spent{' '}
            {EXPERIENCE.software} writing software and {EXPERIENCE.marketing} in marketing, and the last {EXPERIENCE.ai}{' '}
            researching AI. You get one person who does all three, and who stays until the numbers move.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/contact" className="cine-btn cine-btn--accent">
              Work with me
            </Link>
            <Link to="/services" className="cine-btn">
              See what I do
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROOF ── */}
      <Section label="Track record">
        <StatStrip stats={PROOF_STATS} />
        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-cine-dim">
          Several of the businesses I have worked with passed $8M in monthly revenue.{' '}
          <Link to="/results" className="text-cine-accent underline-offset-4 hover:underline">
            See the client record
          </Link>
          .
        </p>
      </Section>

      {/* ── TWO DOORS ── */}
      <Section label="Two sides of the same work" tinted>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="flex flex-col p-9">
            <span className="cine-eyebrow mb-5">Marketing &amp; Services</span>
            <h3 className="cine-h2 text-cine-text">You have a business and want it to earn more.</h3>
            <p className="mt-5 flex-1 leading-relaxed text-cine-dim">
              AI automation, e-commerce, ads and tracking, SEO and video. I find where money is leaking, fix it, and
              build what brings more in.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <ArrowLink to="/services">Services</ArrowLink>
              <ArrowLink to="/results">Client results</ArrowLink>
              <ArrowLink to="/approach">How I work</ArrowLink>
            </div>
          </Card>
          <Card className="flex flex-col p-9">
            <span className="cine-eyebrow mb-5">Build &amp; Research</span>
            <h3 className="cine-h2 text-cine-text">You want to see what I build and how I think.</h3>
            <p className="mt-5 flex-1 leading-relaxed text-cine-dim">
              AI systems that reason together, repair themselves and remember. Open-source tools, products in
              production, and the research behind them.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <ArrowLink to="/research">Research</ArrowLink>
              <ArrowLink to="/systems">Systems</ArrowLink>
              <ArrowLink to="/projects">Case studies</ArrowLink>
            </div>
          </Card>
        </div>
      </Section>

      {/* ── SERVICES ── */}
      <Section label="What I do for clients">
        <div className="grid gap-px border border-cine-hairline bg-cine-hairline md:grid-cols-2">
          {SERVICES.map((s) => (
            <Link
              key={s.id}
              to={`/services#${s.id}`}
              className="group block bg-cine-bg p-8 transition-colors hover:bg-cine-surface"
            >
              <h3 className="font-mono text-sm tracking-wide text-cine-accent">{s.name}</h3>
              <p className="mt-4 text-xl font-light leading-snug text-cine-text">{s.pain}</p>
              <p className="mt-4 text-sm leading-relaxed text-cine-dim">{s.promise}</p>
            </Link>
          ))}
          <div className="flex flex-col justify-center bg-cine-bg p-8">
            <p className="text-xl font-light leading-snug text-cine-text">Not sure which of these you need?</p>
            <p className="mt-4 text-sm leading-relaxed text-cine-dim">
              Most clients are not. Tell me what is not working and I will tell you where I would start.
            </p>
            <div className="mt-6">
              <ArrowLink to="/contact">Ask me</ArrowLink>
            </div>
          </div>
        </div>
      </Section>

      {/* ── BUILT ── */}
      <Section label="Things I have built" tinted>
        <div className="grid gap-6 lg:grid-cols-3">
          {featured.map((c) => (
            <Card key={c.slug} className="flex flex-col">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-cine-faint">{c.category}</p>
              <h3 className="mt-4 text-2xl font-light text-cine-text">{c.name}</h3>
              <p className="mt-3 flex-1 leading-relaxed text-cine-dim">{c.tagline}</p>
              <div className="mt-6">
                <ArrowLink to={`/projects/${c.slug}`}>Read the case study</ArrowLink>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-10">
          <ArrowLink to="/projects">All {CASE_STUDIES.length} case studies</ArrowLink>
        </div>
      </Section>

      {/* ── RESEARCH ── */}
      <Section label="The research behind it">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h3 className="cine-h2 text-cine-text">AI that agrees, repairs itself, and remembers.</h3>
            <p className="mt-6 leading-relaxed text-cine-dim">
              Clients get better AI from me because I study where it fails. Three questions organise that work, and
              each has an open-source system behind it.
            </p>
            <div className="mt-8">
              <ArrowLink to="/research">Read the research</ArrowLink>
            </div>
          </div>
          <ol className="flex flex-col">
            {RESEARCH_AREAS.map((area, i) => (
              <li key={area.id} className="flex gap-6 border-t border-cine-hairline py-6 first:border-t-0 first:pt-0">
                <span className="font-mono text-sm text-cine-accent">0{i + 1}</span>
                <span className="text-lg font-light text-cine-text">{area.title}</span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <WorkWithMe />
    </>
  )
}
