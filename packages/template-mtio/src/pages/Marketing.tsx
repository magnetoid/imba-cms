import { Link } from 'react-router-dom'
import { ArrowLink, Card, PageHero, Section, StatStrip, WorkWithMe } from '../components/blocks'
import { APPROACH_STEPS, PRINCIPLES, SERVICES, TYPICAL_ENGAGEMENTS, type Service } from '../data/services'
import { CLIENT_NAMES, CONTACT_EMAIL, GITHUB_URL, PROOF_STATS, UPWORK_URL, WHO_I_WORK_WITH } from '../data/site'

/* ────────────────────────────── /services ────────────────────────────── */

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 leading-relaxed text-cine-dim">
          <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-cine-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ServiceBlock({ service, index }: { service: Service; index: number }) {
  return (
    <Section id={service.id} tinted={index % 2 === 1}>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <span className="cine-eyebrow mb-6">
            0{index + 1} · {service.name}
          </span>
          <h2 className="cine-h2 text-cine-text">{service.pain}</h2>
          <p className="mt-6 text-lg font-light leading-relaxed text-cine-text">{service.promise}</p>
          <p className="mt-8 font-mono text-[0.72rem] leading-relaxed text-cine-faint">{service.tools}</p>
        </div>
        <div className="flex flex-col gap-10">
          <div>
            <h3 className="mb-5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-faint">What I do</h3>
            <CheckList items={service.whatIDo} />
          </div>
          <div>
            <h3 className="mb-5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-faint">What you get</h3>
            <CheckList items={service.youGet} />
          </div>
          {service.proof.length > 0 && (
            <div>
              <h3 className="mb-5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-faint">
                Work that shows it
              </h3>
              <ul className="flex flex-col gap-3">
                {service.proof.map((p) => (
                  <li key={p.slug}>
                    <ArrowLink to={`/projects/${p.slug}`}>{p.label}</ArrowLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}

export function Services() {
  return (
    <>
      <PageHero
        eyebrow="Marketing & Services · Services"
        title="Five ways I help a business earn more."
        lead="Each one starts from a problem you can feel in the numbers. Pick the one that sounds like yours, or tell me what is wrong and I will tell you which it is."
      />
      <Section>
        <nav aria-label="Services" className="flex flex-wrap gap-3">
          {SERVICES.map((s) => (
            <Link key={s.id} to={`/services#${s.id}`} className="cine-btn">
              {s.name}
            </Link>
          ))}
        </nav>
      </Section>
      {SERVICES.map((s, i) => (
        <ServiceBlock key={s.id} service={s} index={i} />
      ))}
      <WorkWithMe />
    </>
  )
}

/* ────────────────────────────── /results ─────────────────────────────── */

export function Results() {
  return (
    <>
      <PageHero
        eyebrow="Marketing & Services · Client results"
        title="130+ businesses, 15 years, and a 100% success score."
        lead="I have worked on Upwork since 2011, where every contract is rated by the client. That record is public, and it is the reason new clients trust me with their revenue."
      />

      <Section label="The record">
        <StatStrip stats={PROOF_STATS} />
        <p className="mt-10 max-w-2xl leading-relaxed text-cine-dim">
          Several of the businesses I have worked with passed $8M in monthly revenue. They range from first-time
          founders to established brands, and I have managed ad budgets from $5K to $500K a month.
        </p>
        <a href={UPWORK_URL} target="_blank" rel="noopener noreferrer" className="cine-btn mt-9">
          See my Upwork profile ↗
        </a>
      </Section>

      <Section label="Some of the brands" tinted>
        <ul className="grid grid-cols-2 gap-px border border-cine-hairline bg-cine-hairline md:grid-cols-3">
          {CLIENT_NAMES.map((name) => (
            <li key={name} className="bg-cine-bg px-6 py-9 text-center text-lg font-light text-cine-text">
              {name}
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-cine-dim">
          DotBooks runs on Morpheus OS, the commerce platform I built.{' '}
          <Link to="/projects/morpheus" className="text-cine-accent underline-offset-4 hover:underline">
            Read that case study
          </Link>
          .
        </p>
      </Section>

      <Section label="What clients hire me for">
        <ul className="grid gap-x-12 gap-y-4 md:grid-cols-2">
          {TYPICAL_ENGAGEMENTS.map((e) => (
            <li key={e} className="flex gap-3 border-b border-cine-hairline pb-4 text-cine-text">
              <span aria-hidden="true" className="font-mono text-cine-accent">
                +
              </span>
              <span className="font-light">{e}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <ArrowLink to="/services">All services</ArrowLink>
        </div>
      </Section>

      <Section label="Who I work with" tinted>
        <div className="grid gap-6 md:grid-cols-2">
          {WHO_I_WORK_WITH.map((w) => (
            <Card key={w.title}>
              <h3 className="text-xl font-light text-cine-text">{w.title}</h3>
              <p className="mt-3 leading-relaxed text-cine-dim">{w.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <WorkWithMe />
    </>
  )
}

/* ────────────────────────────── /approach ────────────────────────────── */

export function Approach() {
  return (
    <>
      <PageHero
        eyebrow="Marketing & Services · How I work"
        title="I don’t just consult. I build it, run it, and stay until it works."
        lead="Here is what happens from the first conversation to the point where your numbers move."
      />

      <Section label="The five steps">
        <ol className="flex flex-col">
          {APPROACH_STEPS.map((s) => (
            <li
              key={s.step}
              className="grid gap-4 border-t border-cine-hairline py-10 first:border-t-0 first:pt-0 lg:grid-cols-[6rem_20rem_1fr]"
            >
              <span className="font-mono text-2xl text-cine-accent">{s.step}</span>
              <h3 className="text-2xl font-light leading-snug text-cine-text">{s.title}</h3>
              <p className="leading-relaxed text-cine-dim">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section label="What you can count on" tinted>
        <div className="grid gap-6 md:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <Card key={p.title}>
              <h3 className="font-mono text-sm tracking-wide text-cine-accent">{p.title}</h3>
              <p className="mt-4 leading-relaxed text-cine-dim">{p.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <WorkWithMe
        title="The first conversation costs nothing."
        body="Tell me about the business and what you want to change. If I am not the right person, I will say so."
      />
    </>
  )
}

/* ────────────────────────────── /contact ─────────────────────────────── */

const TELL_ME = [
  'What your business sells, and roughly how much a month',
  'What is not working, or what you want to grow',
  'What you have already tried',
  'A link to your site or store',
]

export function Contact() {
  return (
    <>
      <PageHero
        eyebrow="Work with me"
        title="Tell me what you want to grow."
        lead="A few honest lines are enough to start. I read every message myself and reply within a couple of working days."
      />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-6">
            <Card className="p-9">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-faint">Email</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-4 block break-all text-2xl font-light text-cine-accent hover:opacity-80 lg:text-3xl"
              >
                {CONTACT_EMAIL}
              </a>
              <p className="mt-4 leading-relaxed text-cine-dim">The fastest way to reach me, for any kind of project.</p>
            </Card>
            <Card className="p-9">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-faint">Upwork</p>
              <p className="mt-4 text-xl font-light text-cine-text">Prefer to hire through Upwork?</p>
              <p className="mt-3 leading-relaxed text-cine-dim">
                Top Rated Plus, 100% Job Success Score. Contracts, payments and reviews are handled there.
              </p>
              <a href={UPWORK_URL} target="_blank" rel="noopener noreferrer" className="cine-btn mt-7">
                Hire me on Upwork ↗
              </a>
            </Card>
          </div>
          <div>
            <h2 className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-faint">
              It helps if you tell me
            </h2>
            <ul className="mt-6 flex flex-col">
              {TELL_ME.map((t, i) => (
                <li key={t} className="flex gap-5 border-b border-cine-hairline py-5 first:pt-0">
                  <span className="font-mono text-sm text-cine-accent">0{i + 1}</span>
                  <span className="font-light text-cine-text">{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm leading-relaxed text-cine-dim">
              Here for the code and the research instead?{' '}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cine-accent underline-offset-4 hover:underline"
              >
                github.com/magnetoid ↗
              </a>
            </p>
          </div>
        </div>
      </Section>
    </>
  )
}
