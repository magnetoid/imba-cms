import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useThemeConfig } from '@imba/core'
import type { ThemeHomeConfig, ThemeProject } from '@imba/core'
import { CINEMA_THEME_DEFAULTS } from '../themeDefaults'
import { ActionLink, Reveal } from './shared'

/**
 * Cinematic landing page — the showcase for @imba/template-cinema.
 * Dark, high-contrast, editorial. Left-aligned composition, Fraunces display
 * headlines, JetBrains Mono micro-labels, a single restrained film-gold accent.
 * All motion is gated behind prefers-reduced-motion.
 *
 * Every string and list here comes from `useThemeConfig().home`: the template's
 * own copy is the default layer (`CINEMA_THEME_DEFAULTS.home`), the pages
 * plugin publishes the hero, the projects plugin publishes the selected-work
 * grid, and an app can override any field through `site.theme`.
 */

// No background film ships with the template; leave empty to render the layered
// CSS gradient fallback. A host can pass a real reel URL via this constant.
const HERO_VIDEO_SRC = ''
const HERO_POSTER = ''

const DEFAULT_SPANS = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7', 'lg:col-span-6', 'lg:col-span-6']
const DEFAULT_RATIOS = ['aspect-[16/10]', 'aspect-[4/5]', 'aspect-[4/5]', 'aspect-[16/10]', 'aspect-[3/2]', 'aspect-[3/2]']

function useHomeConfig(): ThemeHomeConfig {
  const home = useThemeConfig().home
  const defaults = CINEMA_THEME_DEFAULTS.home!
  // ThemeProvider already deep-merges `home.hero`; the flat fields fall back here.
  return { ...defaults, ...home, hero: { ...defaults.hero, ...home?.hero } }
}

function Hero({ home }: { home: ThemeHomeConfig }) {
  const reduce = useReducedMotion()
  const showVideo = HERO_VIDEO_SRC.length > 0 && !reduce
  const hero = home.hero ?? {}
  const capabilities = hero.capabilities ?? []

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
          {hero.eyebrow && (
            <motion.span variants={item} className="cine-eyebrow">
              {hero.eyebrow}
            </motion.span>
          )}
          {hero.title && (
            <motion.h1 variants={item} className="cine-display mt-7 text-cine-text">
              {hero.title}
            </motion.h1>
          )}
          {hero.lead && (
            <motion.p variants={item} className="cine-lead mt-8 max-w-xl">
              {hero.lead}
            </motion.p>
          )}
          {(hero.primaryAction || hero.secondaryAction) && (
            <motion.div variants={item} className="mt-11 flex flex-wrap items-center gap-4">
              <ActionLink action={hero.primaryAction} className="cine-btn cine-btn--accent" />
              <ActionLink action={hero.secondaryAction} className="cine-btn" />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bottom: scroll cue + capabilities marquee */}
      {capabilities.length > 0 && (
        <div className="relative z-10 border-t border-cine-hairline">
          <div className="mx-auto flex max-w-screen-2xl items-center gap-6 px-6 py-4 lg:px-10">
            <span className="hidden shrink-0 items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.22em] text-cine-faint sm:inline-flex">
              <span aria-hidden="true">↓</span> Scroll
            </span>
            <div className="cine-marquee flex-1" aria-hidden="true">
              <div className="cine-marquee__track">
                {[...capabilities, ...capabilities].map((cap, i) => (
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
      )}
    </section>
  )
}

function WorkCard({ work, i }: { work: ThemeProject; i: number }) {
  const span = work.span ?? DEFAULT_SPANS[i % DEFAULT_SPANS.length]
  const ratio = work.ratio ?? DEFAULT_RATIOS[i % DEFAULT_RATIOS.length]
  return (
    <Reveal className={span} delay={(i % 2) * 0.08}>
      <Link
        to={work.href ?? '/work'}
        className="cine-work-card group block focus:outline-none"
        aria-label={`${work.title} — ${work.category}`}
      >
        <div className={`relative ${ratio} overflow-hidden border border-cine-hairline bg-cine-surface`}>
          {/* Placeholder surface — subtle gradient stands in for the still. */}
          <div className="absolute inset-0 bg-gradient-to-br from-cine-surface-2 to-cine-surface transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]" />
          <div className="cine-vignette" />
          <span className="absolute left-5 top-4 font-mono text-[0.7rem] tracking-[0.18em] text-cine-accent">
            {work.index}
          </span>
        </div>
        <div className="mt-5 flex items-baseline justify-between gap-4">
          <h3 className="font-serif text-2xl tracking-[-0.01em] text-cine-text lg:text-3xl">
            {work.title}
          </h3>
          <span className="shrink-0 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-cine-dim">
            {work.category}
          </span>
        </div>
        <div className="cine-work-rule mt-4" />
      </Link>
    </Reveal>
  )
}

function SelectedWork({ home }: { home: ThemeHomeConfig }) {
  const items = home.selectedWorkItems ?? []
  if (items.length === 0) return null
  return (
    <section className="mx-auto max-w-screen-2xl px-6 py-24 lg:px-10 lg:py-36">
      <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          {home.selectedWorkEyebrow && <span className="cine-eyebrow">{home.selectedWorkEyebrow}</span>}
          {home.selectedWorkTitle && <h2 className="cine-h2 mt-6 max-w-[16ch] text-cine-text">{home.selectedWorkTitle}</h2>}
        </div>
        <ActionLink action={home.selectedWorkAction} className="cine-link self-start md:self-auto" />
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-14 lg:grid-cols-12">
        {items.map((w, i) => (
          <WorkCard key={w.index + w.title} work={w} i={i} />
        ))}
      </div>
    </section>
  )
}

function Statement({ home }: { home: ThemeHomeConfig }) {
  if (!home.statementText) return null
  return (
    <section className="border-y border-cine-hairline bg-cine-surface">
      <div className="mx-auto max-w-screen-2xl px-6 py-28 lg:px-10 lg:py-40">
        <Reveal className="max-w-5xl">
          {home.statementEyebrow && <span className="cine-eyebrow--dim cine-eyebrow">{home.statementEyebrow}</span>}
          <p
            className="mt-8 font-serif font-light leading-[1.08] tracking-[-0.02em] text-cine-text"
            style={{ fontSize: 'clamp(1.9rem, 4.5vw, 4rem)' }}
          >
            {home.statementText}{' '}
            {home.statementAccentText && <span className="text-cine-dim">{home.statementAccentText}</span>}
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function Capabilities({ home }: { home: ThemeHomeConfig }) {
  const items = home.capabilitiesItems ?? []
  if (items.length === 0) return null
  return (
    <section className="mx-auto max-w-screen-2xl px-6 py-24 lg:px-10 lg:py-36">
      <Reveal>
        {home.capabilitiesEyebrow && <span className="cine-eyebrow">{home.capabilitiesEyebrow}</span>}
        {home.capabilitiesTitle && (
          <h2 className="cine-h2 mt-6 max-w-[18ch] text-cine-text">{home.capabilitiesTitle}</h2>
        )}
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden border border-cine-hairline bg-cine-hairline sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s, i) => (
          <Reveal key={s.no + s.title} delay={i * 0.06}>
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

function CtaBand({ home }: { home: ThemeHomeConfig }) {
  if (!home.ctaTitle) return null
  return (
    <section className="mx-auto max-w-screen-2xl px-6 pb-28 lg:px-10 lg:pb-40">
      <Reveal>
        <div className="flex flex-col items-start gap-10 border border-cine-accent bg-cine-accent-soft px-8 py-16 md:flex-row md:items-center md:justify-between lg:px-16 lg:py-20">
          <div>
            {home.ctaEyebrow && <span className="cine-eyebrow">{home.ctaEyebrow}</span>}
            <h2 className="cine-display mt-6 text-cine-text" style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)' }}>
              {home.ctaTitle}
            </h2>
          </div>
          <ActionLink action={home.ctaAction} className="cine-btn cine-btn--accent shrink-0" />
        </div>
      </Reveal>
    </section>
  )
}

export function Home() {
  const home = useHomeConfig()
  return (
    <>
      <Hero home={home} />
      <SelectedWork home={home} />
      <Statement home={home} />
      <Capabilities home={home} />
      <CtaBand home={home} />
    </>
  )
}
