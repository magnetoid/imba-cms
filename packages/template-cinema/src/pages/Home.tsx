import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * Cinematic landing page — the showcase for @imba/template-cinema.
 * Dark, high-contrast, editorial. Left-aligned composition, Fraunces display
 * headlines, JetBrains Mono micro-labels, a single restrained film-gold accent.
 * All motion is gated behind prefers-reduced-motion.
 */

// No background film ships with the template; leave empty to render the layered
// CSS gradient fallback. A host can pass a real reel URL via this constant.
const HERO_VIDEO_SRC = ''
const HERO_POSTER = ''

const CAPABILITIES = ['Brand films', 'Commercials', 'Documentary', 'Post', 'Motion']

const WORK = [
  { index: '01', title: 'Atlas', category: 'Brand film', span: 'lg:col-span-7', ratio: 'aspect-[16/10]' },
  { index: '02', title: 'Northwind', category: 'Commercial', span: 'lg:col-span-5', ratio: 'aspect-[4/5]' },
  { index: '03', title: 'Lumen', category: 'Documentary', span: 'lg:col-span-5', ratio: 'aspect-[4/5]' },
  { index: '04', title: 'Cassette', category: 'Music video', span: 'lg:col-span-7', ratio: 'aspect-[16/10]' },
  { index: '05', title: 'Field Notes', category: 'Series', span: 'lg:col-span-6', ratio: 'aspect-[3/2]' },
  { index: '06', title: 'Halcyon', category: 'Motion', span: 'lg:col-span-6', ratio: 'aspect-[3/2]' },
]

const SERVICES = [
  { no: '01', title: 'Brand films', body: 'Story-led hero films that carry a brand across a campaign and a year.' },
  { no: '02', title: 'Commercials', body: 'Broadcast and social spots built to perform — sharp, fast, repeatable.' },
  { no: '03', title: 'Documentary', body: 'Long-form and short docs with real people, real places, real weight.' },
  { no: '04', title: 'Post & motion', body: 'Edit, colour, sound and motion design finished to a cinema standard.' },
]

/** Section reveal wrapper — fades/translates in, once, with reduced-motion guard. */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

function Hero() {
  const reduce = useReducedMotion()
  const showVideo = HERO_VIDEO_SRC.length > 0 && !reduce

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  }
  const item = reduce
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
      }

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Background layer */}
      <div className="absolute inset-0 -z-10">
        {showVideo ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={HERO_POSTER || undefined}
            src={HERO_VIDEO_SRC}
          />
        ) : (
          <div className="cine-hero-gradient h-full w-full" />
        )}
        <div className="cine-vignette" />
      </div>

      {/* Foreground — left-aligned */}
      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col justify-center px-6 pt-28 pb-16 lg:px-10">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl">
          <motion.span variants={item} className="cine-eyebrow">
            Cinematic production · worldwide
          </motion.span>
          <motion.h1 variants={item} className="cine-display mt-7 text-cine-text">
            Films that move people.
          </motion.h1>
          <motion.p variants={item} className="cine-lead mt-8 max-w-xl">
            We are a film and motion studio making brand films, commercials and documentary
            for companies that want their story told with craft.
          </motion.p>
          <motion.div variants={item} className="mt-11 flex flex-wrap items-center gap-4">
            <Link to="/work" className="cine-btn cine-btn--accent">
              View work
            </Link>
            <Link to="/contact" className="cine-btn">
              Start a project
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom: scroll cue + capabilities marquee */}
      <div className="relative z-10 border-t border-cine-hairline">
        <div className="mx-auto flex max-w-screen-2xl items-center gap-6 px-6 py-4 lg:px-10">
          <span className="hidden shrink-0 items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.22em] text-cine-faint sm:inline-flex">
            <span aria-hidden="true">↓</span> Scroll
          </span>
          <div className="cine-marquee flex-1" aria-hidden="true">
            <div className="cine-marquee__track">
              {[...CAPABILITIES, ...CAPABILITIES].map((cap, i) => (
                <span
                  key={cap + i}
                  className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-cine-dim"
                >
                  {cap}
                  <span className="ml-10 text-cine-accent">·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SelectedWork() {
  return (
    <section className="mx-auto max-w-screen-2xl px-6 py-24 lg:px-10 lg:py-36">
      <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="cine-eyebrow">Selected work</span>
          <h2 className="cine-h2 mt-6 max-w-[16ch] text-cine-text">A reel of recent films.</h2>
        </div>
        <Link to="/work" className="cine-link self-start md:self-auto">
          All work →
        </Link>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-14 lg:grid-cols-12">
        {WORK.map((w, i) => (
          <Reveal key={w.index} className={w.span} delay={(i % 2) * 0.08}>
            <Link
              to="/work"
              className="cine-work-card group block focus:outline-none"
              aria-label={`${w.title} — ${w.category}`}
            >
              <div
                className={`relative ${w.ratio} overflow-hidden border border-cine-hairline bg-cine-surface`}
              >
                {/* Placeholder surface — subtle gradient stands in for the still. */}
                <div className="absolute inset-0 bg-gradient-to-br from-cine-surface-2 to-cine-surface transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]" />
                <div className="cine-vignette" />
                <span className="absolute left-5 top-4 font-mono text-[0.7rem] tracking-[0.18em] text-cine-accent">
                  {w.index}
                </span>
              </div>
              <div className="mt-5 flex items-baseline justify-between gap-4">
                <h3 className="font-serif text-2xl tracking-[-0.01em] text-cine-text lg:text-3xl">
                  {w.title}
                </h3>
                <span className="shrink-0 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-dim">
                  {w.category}
                </span>
              </div>
              <div className="cine-work-rule mt-4" />
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Statement() {
  return (
    <section className="border-y border-cine-hairline bg-cine-surface">
      <div className="mx-auto max-w-screen-2xl px-6 py-28 lg:px-10 lg:py-40">
        <Reveal className="max-w-5xl">
          <span className="cine-eyebrow--dim cine-eyebrow">Our belief</span>
          <p
            className="mt-8 font-serif font-light leading-[1.08] tracking-[-0.02em] text-cine-text"
            style={{ fontSize: 'clamp(1.9rem, 4.5vw, 4rem)' }}
          >
            A film should feel inevitable — like it could only have been made one way.{' '}
            <span className="text-cine-dim">
              We obsess over the frame, the cut and the silence between them.
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function Capabilities() {
  return (
    <section className="mx-auto max-w-screen-2xl px-6 py-24 lg:px-10 lg:py-36">
      <Reveal>
        <span className="cine-eyebrow">Capabilities</span>
        <h2 className="cine-h2 mt-6 max-w-[18ch] text-cine-text">
          End to end, from first idea to final frame.
        </h2>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden border border-cine-hairline bg-cine-hairline sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((s, i) => (
          <Reveal key={s.no} delay={i * 0.06}>
            <div className="flex h-full flex-col gap-5 bg-cine-bg p-8 lg:p-9">
              <span className="font-mono text-[0.7rem] tracking-[0.2em] text-cine-accent">{s.no}</span>
              <h3 className="font-serif text-2xl tracking-[-0.01em] text-cine-text">{s.title}</h3>
              <p className="font-sans text-sm leading-relaxed text-cine-dim">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function CtaBand() {
  return (
    <section className="mx-auto max-w-screen-2xl px-6 pb-28 lg:px-10 lg:pb-40">
      <Reveal>
        <div className="flex flex-col items-start gap-10 border border-cine-accent bg-cine-accent-soft px-8 py-16 md:flex-row md:items-center md:justify-between lg:px-16 lg:py-20">
          <div>
            <span className="cine-eyebrow">Next project</span>
            <h2 className="cine-display mt-6 text-cine-text" style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)' }}>
              Let&rsquo;s talk.
            </h2>
          </div>
          <Link to="/contact" className="cine-btn cine-btn--accent shrink-0">
            Start a project
          </Link>
        </div>
      </Reveal>
    </section>
  )
}

export function Home() {
  return (
    <>
      <Hero />
      <SelectedWork />
      <Statement />
      <Capabilities />
      <CtaBand />
    </>
  )
}
