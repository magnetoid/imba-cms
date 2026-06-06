// Configurable marketing copy for the blog index (hero / pillars / CTA).
// Defaults to the original Imba Production video copy so existing apps are
// unchanged; an app overrides it via `setBlogContent({...})` before render.

export interface BlogContent {
  heroEyebrow: string
  heroTitle: string
  heroTitleEm: string
  heroSubtitle: string
  pillarsLabel: string
  pillars: string[]
  ctaTitle: string
  ctaSubtitle: string
  ctaButtonLabel: string
  ctaHref: string
}

const DEFAULT_CONTENT: BlogContent = {
  heroEyebrow: 'Video production insights',
  heroTitle: 'Expert tips,',
  heroTitleEm: 'real results',
  heroSubtitle: '185+ articles on video production, AI, TikTok strategy, and converting views into sales.',
  pillarsLabel: 'Content pillars',
  pillars: [
    'AI & Generative Video', 'TikTok Content Strategy', 'Cooking Video Production',
    'eCommerce Product Video', 'YouTube Growth', 'Brand Film Craft',
    'Video Equipment & Tech', 'Video SEO', 'Short-Form Content',
    'Post Production', 'Drone Cinematography', 'eLearning Video',
  ],
  ctaTitle: 'Ready to make something memorable?',
  ctaSubtitle: 'Talk to our team. Free quote, 24h reply, no commitment.',
  ctaButtonLabel: 'Get in Touch',
  ctaHref: '/contact',
}

let _content: BlogContent = DEFAULT_CONTENT

/** Override blog index copy. Call once at app startup (before render). */
export function setBlogContent(overrides: Partial<BlogContent>): void {
  _content = { ..._content, ...overrides }
}

export function blogContent(): BlogContent {
  return _content
}
