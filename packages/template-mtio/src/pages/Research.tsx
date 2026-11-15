import { ArrowLink, Card, PageHero, Section } from '../components/blocks'
import { RESEARCH_AREAS } from '../data/research'
import { SYSTEMS, type SystemEntry } from '../data/systems'
import { EXPERIENCE, GITHUB_URL } from '../data/site'

const EXPLORING = [
  'Consensus protocols across heterogeneous models',
  'Tenso — an experimental language for neural-network development',
]

export function Research() {
  return (
    <>
      <PageHero
        eyebrow="Build & Research · Research"
        title="I build AI systems that reason together, repair themselves, and remember."
        lead={`AI and LLM research on multi-model consensus, self-developing agents and agent memory, grounded in ${EXPERIENCE.software} of shipping production software.`}
      />

      <Section label="Three questions">
        <div className="mb-14 flex max-w-3xl flex-col gap-5 leading-relaxed text-cine-dim">
          <p>
            Three questions organise the work: how heterogeneous models can be made to agree reliably; how far an agent
            can safely modify itself; and what durable memory and guardrails look like once a context window is no
            longer enough.
          </p>
          <p>
            {EXPERIENCE.ai} of that research sit on top of {EXPERIENCE.software} writing software and{' '}
            {EXPERIENCE.marketing} in marketing, which is mostly useful for knowing which parts of a system break
            first once real users arrive.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {RESEARCH_AREAS.map((area, i) => (
            <Card key={area.id} className="flex flex-col">
              <span className="font-mono text-sm text-cine-accent">0{i + 1}</span>
              <h3 className="mt-4 text-xl font-light leading-snug text-cine-text">{area.title}</h3>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-cine-dim">{area.thesis}</p>
              <a
                href={area.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 font-mono text-[0.72rem] text-cine-accent underline-offset-4 hover:underline"
              >
                {area.repoLabel} ↗
              </a>
            </Card>
          ))}
        </div>
      </Section>

      <Section label="Currently exploring" tinted>
        <ul className="flex max-w-2xl flex-col gap-4 border-l border-cine-hairline-strong pl-6">
          {EXPLORING.map((item) => (
            <li key={item} className="text-lg font-light text-cine-text">
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          <ArrowLink to="/systems">The systems</ArrowLink>
          <ArrowLink to="/blog">Notes in the Journal</ArrowLink>
        </div>
      </Section>
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[7rem_1fr]">
      <dt className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-cine-faint sm:pt-1">{label}</dt>
      <dd className="leading-relaxed text-cine-dim">{value}</dd>
    </div>
  )
}

function SystemRow({ sys }: { sys: SystemEntry }) {
  return (
    <li id={sys.id} className="grid gap-6 border-t border-cine-hairline py-12 first:border-t-0 first:pt-0 lg:grid-cols-[18rem_1fr]">
      <div>
        <h3 className="text-2xl font-light text-cine-text">{sys.name}</h3>
        <p className="mt-2 font-mono text-[0.72rem] leading-relaxed text-cine-accent">{sys.kind}</p>
      </div>
      <dl className="flex flex-col gap-5">
        <Field label="Problem" value={sys.problem} />
        <Field label="Approach" value={sys.approach} />
        <Field label="Status" value={sys.status} />
        {sys.repoUrl && (
          <div className="sm:pl-[7rem]">
            <a
              href={sys.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.72rem] text-cine-accent underline-offset-4 hover:underline"
            >
              {sys.repoLabel} ↗
            </a>
          </div>
        )}
      </dl>
    </li>
  )
}

export function Systems() {
  return (
    <>
      <PageHero
        eyebrow="Build & Research · Systems"
        title="Systems & open source."
        lead="Each one starts from a problem I ran into in real work. Here is the problem, the approach I took, and where it stands today."
      />
      <Section>
        <ul>
          {SYSTEMS.map((sys) => (
            <SystemRow key={sys.id} sys={sys} />
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-cine-hairline pt-10">
          <ArrowLink to="/projects">Longer case studies</ArrowLink>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="mt-arrow">
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      </Section>
    </>
  )
}
