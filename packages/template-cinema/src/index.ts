import { defineTemplate } from '@imba/core'
import './tokens.css'
import { PublicLayout } from './PublicLayout'
import { Home } from './pages/Home'
import { Work } from './pages/Work'
import { Project } from './pages/Project'
import { About } from './pages/About'
import { Services } from './pages/Services'
import { Contact } from './pages/Contact'
import { CINEMA_THEME_DEFAULTS } from './themeDefaults'

/**
 * The cinema template owns the public routes; the blog plugin adds `/blog`.
 * `/about`, `/services`, `/contact` render the pages plugin's entries and
 * `/work` + `/work/:slug` the projects plugin's — which is why both are listed
 * in `expects`. Until this template rendered them its own nav linked to routes
 * that did not exist.
 */
export default defineTemplate({
  name: 'cinema',
  layouts: { Public: PublicLayout },
  pages: [
    { path: '/', element: Home, seo: { title: 'Home' } },
    { path: '/work', element: Work, seo: { title: 'Work' } },
    { path: '/work/:slug', element: Project },
    { path: '/about', element: About, seo: { title: 'About' } },
    { path: '/services', element: Services, seo: { title: 'Services' } },
    { path: '/contact', element: Contact, seo: { title: 'Contact' } },
  ],
  expects: ['blog', 'pages', 'projects'],
  theme: { defaults: CINEMA_THEME_DEFAULTS },
})

export { CINEMA_THEME_DEFAULTS } from './themeDefaults'
