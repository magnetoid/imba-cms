import { Link } from 'react-router-dom'

const EXPERTISE = [
  { k: 'AI & Automation', d: 'Claude API, MCP workflows, local LLMs, and multi-agent orchestration.' },
  { k: 'Full-Stack Development', d: 'React, Vite, TypeScript, Node — from landing pages to SaaS platforms.' },
  { k: 'Performance Marketing', d: 'Google & Meta Ads, GA4, attribution. 130+ businesses scaled.' },
  { k: 'DevOps & Cloud', d: 'Hetzner, Coolify, Docker, self-hosted Supabase, CI/CD.' },
]

export function Home() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="mt-grid relative overflow-hidden px-6 pb-24 pt-36 lg:px-10 lg:pt-44">
        <div className="mx-auto max-w-screen-xl">
          <span className="cine-eyebrow mb-7">Senior Digital Consultant</span>
          <h1 className="cine-display max-w-[16ch] text-cine-text">
            Marko Tiosavljević
          </h1>
          <p className="cine-lead mt-7 max-w-2xl">
            35+ years across graphic design, full-stack development, AI automation, and
            performance marketing. Founder of Imba Production. 130+ businesses scaled.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/blog" className="cine-btn cine-btn--accent">
              Read the Journal
            </Link>
            <a href="mailto:marko.tiosavljevic@gmail.com" className="cine-btn">
              Start a conversation
            </a>
          </div>
        </div>
      </section>

      {/* ── EXPERTISE ── */}
      <section className="border-t border-cine-hairline px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-12 flex items-center gap-3">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-cine-faint">What I do</span>
            <div className="h-px flex-1 bg-cine-hairline" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {EXPERTISE.map((e) => (
              <div
                key={e.k}
                className="border border-cine-hairline bg-cine-surface/40 p-7 transition-colors hover:border-cine-accent/30"
              >
                <div className="mb-3 h-1.5 w-1.5 rounded-full bg-cine-accent" />
                <h3 className="font-mono text-sm tracking-wide text-cine-text">{e.k}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cine-dim">{e.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
