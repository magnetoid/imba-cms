import { defineTemplate } from '@imba/core'
import { Navigate, useParams } from 'react-router-dom'
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
 * plugin-site's default (seedable) navigation links to `/projects`, the slug the
 * projects plugin's own sample content uses; this template calls the same
 * section `/work`. Serving both keeps CMS-managed navigation from dead-ending
 * on this template.
 */
function ProjectsRedirect() {
  return <Navigate to="/work" replace />
}
function ProjectRedirect() {
  const { slug = '' } = useParams<{ slug: string }>()
  return <Navigate to={`/work/${slug}`} replace />
}

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
    { path: '/projects', element: ProjectsRedirect },
    { path: '/projects/:slug', element: ProjectRedirect },
    { path: '/about', element: About, seo: { title: 'About' } },
    { path: '/services', element: Services, seo: { title: 'Services' } },
    { path: '/contact', element: Contact, seo: { title: 'Contact' } },
  ],
  expects: ['blog', 'pages', 'projects'],
  theme: { defaults: CINEMA_THEME_DEFAULTS },
})

export { CINEMA_THEME_DEFAULTS } from './themeDefaults'
