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
  ctaTitle: 'Want this working for your business?',
  ctaSubtitle: 'AI automation, e-commerce and marketing from one senior operator.',
  ctaButtonLabel: 'Work with me',
  ctaHref: '/contact',
})

const cms = createCMS({
  template: mtio,
  plugins: [blog],
  site: {
    name: 'Marko Tiosavljević',
    domain: 'mtiosavljevic.com',
    defaultLocale: 'en',
    locales: ['en', 'sr'],
    contactEmail: 'marko@mtiosavljevic.com',
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
