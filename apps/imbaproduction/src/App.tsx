import { BrowserRouter } from 'react-router-dom'
import { createCMS } from '@imba/core'
import blog from '@imba/plugin-blog'
import cinema from '@imba/template-cinema'

const cms = createCMS({
  template: cinema,
  plugins: [blog],
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
