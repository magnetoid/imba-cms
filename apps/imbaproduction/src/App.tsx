import { BrowserRouter } from 'react-router-dom'
import { createCMS } from '@imba/core'
import blog from '@imba/plugin-blog'
import media from '@imba/plugin-media'
import pages from '@imba/plugin-pages'
import projects from '@imba/plugin-projects'
import site from '@imba/plugin-site'
import cinema from '@imba/template-cinema'

// pages/projects/site feed the cinema template: its interior routes render the
// pages and projects entries, and the site plugin's published settings drive
// brand, navigation and footer through ThemeProvider.
const cms = createCMS({
  template: cinema,
  plugins: [blog, media, pages, projects, site],
  site: {
    name: 'Imba Production',
    domain: 'imbaproduction.com',
    defaultLocale: 'en',
    locales: ['en', 'sr'],
    contactEmail: 'hello@imbaproduction.com',
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
