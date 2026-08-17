import { BrowserRouter } from 'react-router-dom'
import { createCMS } from '@imba/core'
import blog, { setBlogContent } from '@imba/plugin-blog'
import mtio from '@imba/template-mtio'

// Override the blog index copy for mtiosavljevic (defaults are video-agency copy).
setBlogContent({
  heroEyebrow: 'Journal',
  heroTitle: 'Notes on AI,',
  heroTitleEm: 'tech & the work',
  heroSubtitle: 'Long-form writing on artificial intelligence, software, security, and the systems shaping how we build.',
  pillarsLabel: 'Topics',
  pillars: [
    'Artificial Intelligence', 'LLMs & Agents', 'Software Engineering',
    'Cybersecurity', 'DevOps & Cloud', 'Performance Marketing',
    'Data Systems', 'Geopolitics', 'Opinion',
  ],
  ctaTitle: 'Have a project in mind?',
  ctaSubtitle: 'AI platforms, SaaS builds, ecommerce infrastructure. Let’s talk.',
  ctaButtonLabel: 'Get in touch',
  ctaHref: 'mailto:marko.tiosavljevic@gmail.com',
})

const cms = createCMS({
  template: mtio,
  plugins: [blog],
  site: {
    name: 'Marko Tiosavljević',
    domain: 'mtiosavljevic.com',
    defaultLocale: 'en',
    locales: ['en', 'sr'],
    contactEmail: 'marko.tiosavljevic@gmail.com',
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  },
})

export default function App() {
  return (
    <BrowserRouter>
      <cms.Router />
    </BrowserRouter>
  )
}
