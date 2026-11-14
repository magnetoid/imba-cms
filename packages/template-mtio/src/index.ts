import { defineTemplate } from '@imba/core'
import './tokens.css'
import { PublicLayout } from './PublicLayout'
import { Home } from './pages/Home'
import { Research, Systems } from './pages/Research'
import { Projects, ProjectPage } from './pages/Projects'
import { Approach, Contact, Results, Services } from './pages/Marketing'

/**
 * mtiosavljevic.com template.
 *
 * The site has two halves, mirrored by the two nav menus (see data/site.ts):
 *   Build & Research     → /research, /systems, /projects, /projects/:slug
 *   Marketing & Services → /services, /results, /approach
 * plus the home page, /contact, and the Journal (the blog plugin's /blog).
 *
 * All copy lives in src/data/*. It is hardcoded for now and meant to move
 * behind the CMS later.
 */
export default defineTemplate({
  name: 'mtio',
  layouts: { Public: PublicLayout },
  pages: [
    {
      path: '/',
      element: Home,
      seo: {
        title: 'Marko Tiosavljević — AI, e-commerce and marketing that make your business more money',
        description:
          'AI automation, e-commerce, performance marketing and SEO from one senior operator. 130+ businesses scaled, 100% Job Success on Upwork, 38 years in software.',
      },
    },
    {
      path: '/research',
      element: Research,
      seo: {
        title: 'Research — multi-model consensus, self-repairing agents, agent memory',
        description:
          'AI and LLM research by Marko Tiosavljević: how models can be made to agree, how far an agent can safely modify itself, and what durable agent memory looks like.',
      },
    },
    {
      path: '/systems',
      element: Systems,
      seo: {
        title: 'Systems & open source — Quorum, Janus, torsor-helper, Morpheus OS',
        description:
          'The AI systems Marko Tiosavljević has built: the problem each one addresses, the approach, and its current status.',
      },
    },
    {
      path: '/projects',
      element: Projects,
      seo: {
        title: 'Case studies — AI products and platforms built end to end',
        description:
          'Case studies of products designed and built by Marko Tiosavljević: ClearCount, Morpheus OS, WooPulse, Aletheia, Quorum and more.',
      },
    },
    // SEO for a single case study is set inside ProjectPage, from the study itself.
    { path: '/projects/:slug', element: ProjectPage },
    {
      path: '/services',
      element: Services,
      seo: {
        title: 'Services — AI automation, e-commerce, performance marketing, SEO, video',
        description:
          'Five ways Marko Tiosavljević helps a business earn more: AI and automation, e-commerce build and growth, performance marketing and tracking, SEO and AI search, and video.',
      },
    },
    {
      path: '/results',
      element: Results,
      seo: {
        title: 'Client results — 130+ businesses, 100% Job Success Score',
        description:
          'Fifteen years on Upwork as Top Rated Plus with a 100% Job Success Score. Who Marko Tiosavljević works with and what clients hire him for.',
      },
    },
    {
      path: '/approach',
      element: Approach,
      seo: {
        title: 'How I work — build it, run it, stay until it works',
        description:
          'What working with Marko Tiosavljević looks like, from the first conversation to the point where the numbers move.',
      },
    },
    {
      path: '/contact',
      element: Contact,
      seo: {
        title: 'Work with me',
        description: 'Get in touch with Marko Tiosavljević by email or hire him through Upwork.',
      },
    },
  ],
  expects: ['blog'],
})
