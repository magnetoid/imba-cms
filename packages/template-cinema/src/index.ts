import { defineTemplate } from '@imba/core'
import './tokens.css'
import { PublicLayout } from './PublicLayout'
import { Home } from './pages/Home'
import { CINEMA_THEME_DEFAULTS } from './themeDefaults'

export default defineTemplate({
  name: 'cinema',
  layouts: { Public: PublicLayout },
  pages: [{ path: '/', element: Home, seo: { title: 'Home' } }],
  expects: ['blog'],
  theme: { defaults: CINEMA_THEME_DEFAULTS },
})

export { CINEMA_THEME_DEFAULTS } from './themeDefaults'
