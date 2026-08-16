import { BrowserRouter } from 'react-router-dom'
import { createAdminApp, readBrowserRuntimeOptionalValue, readBrowserRuntimeValue } from '@imba/core'
import blog from '@imba/plugin-blog'
import media from '@imba/plugin-media'
import pages from '@imba/plugin-pages'
import projects from '@imba/plugin-projects'
import site from '@imba/plugin-site'
import settings from '@imba/plugin-settings'
import users from '@imba/plugin-users'

const supabaseUrl = readBrowserRuntimeValue('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = readBrowserRuntimeValue('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY ?? '')
const runtimeSiteUrl = readBrowserRuntimeOptionalValue('VITE_SITE_URL', import.meta.env.VITE_SITE_URL)
const resolvedSiteDomain = new URL(runtimeSiteUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'https://mtiosavljevic.com')).host

const cms = createAdminApp({
  plugins: [blog, media, pages, projects, site, settings, users],
  site: {
    name: 'IMBA CMS',
    domain: resolvedSiteDomain,
    defaultLocale: 'en',
    locales: ['en'],
    contactEmail: 'hello@example.com',
  },
  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  },
})

export default function App() {
  return (
    <BrowserRouter>
      <cms.Router />
    </BrowserRouter>
  )
}
