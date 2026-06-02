import { defineTemplate } from '@imba/core'
import './tokens.css'
import { PublicLayout } from './PublicLayout'
import { Home } from './pages/Home'

export default defineTemplate({
  name: 'cinema',
  layouts: { Public: PublicLayout },
  pages: [{ path: '/', element: Home, seo: { title: 'Home' } }],
  expects: ['blog'],
})
