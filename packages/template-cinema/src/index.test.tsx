import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import cinema from './index'

describe('@imba/template-cinema', () => {
  it('is a valid Template with a Public layout and a home page', () => {
    expect(cinema.name).toBe('cinema')
    expect(typeof cinema.layouts.Public).toBe('function')
    expect(cinema.pages?.some((p) => p.path === '/')).toBe(true)
  })

  it('Public layout renders its children', () => {
    const Public = cinema.layouts.Public
    render(
      <MemoryRouter>
        <Public>
          <div>CHILD</div>
        </Public>
      </MemoryRouter>,
    )
    expect(screen.getByText('CHILD')).toBeDefined()
  })
})

describe('@imba/template-cinema reads theme config', () => {
  it('renders navigation, brand and footer from ThemeProvider instead of hardcoded copy', async () => {
    const { ThemeProvider } = await import('@imba/core')
    const Public = cinema.layouts.Public
    render(
      <MemoryRouter>
        <ThemeProvider
          template={cinema}
          site={{ name: 'Test', domain: 't.com', defaultLocale: 'en', locales: ['en'] }}
          resolvers={[async () => ({
            brand: { name: 'Managed', accent: 'Studio' },
            navLinks: [{ label: 'Case Studies', to: '/work' }],
            navCta: { label: 'Book a call', to: '/contact' },
            footer: {
              contactEmail: 'studio@example.com',
              ctaTitle: 'Say hello.',
              columns: [{ heading: 'Managed column', links: [{ label: 'Managed link', to: '/x' }] }],
              socialLinks: [{ label: 'Mastodon', href: 'https://example.social' }],
              copyright: '© Managed Co',
              platformNote: 'Managed note',
            },
          })]}
        >
          <Public>
            <div>CHILD</div>
          </Public>
        </ThemeProvider>
      </MemoryRouter>,
    )
    expect(await screen.findAllByText('Case Studies')).not.toHaveLength(0)
    expect(screen.getAllByText('Book a call')).not.toHaveLength(0)
    expect(screen.getAllByText('Managed').length).toBeGreaterThan(0)
    expect(screen.getByText('studio@example.com')).toBeDefined()
    expect(screen.getByText('Say hello.')).toBeDefined()
    expect(screen.getByText('Managed column')).toBeDefined()
    expect(screen.getByText('Managed link')).toBeDefined()
    expect(screen.getByText('Mastodon')).toBeDefined()
    expect(screen.getByText('© Managed Co')).toBeDefined()
    expect(screen.getByText('Managed note')).toBeDefined()
    // The hardcoded defaults are gone once a resolver supplies its own.
    expect(screen.queryByText('Journal')).toBeNull()
  })

  it('ships its former hardcoded copy as template theme defaults', () => {
    expect(cinema.theme?.defaults?.navLinks?.map((l) => l.label)).toEqual(['Work', 'Services', 'Journal', 'About', 'Contact'])
    expect(cinema.theme?.defaults?.footer?.contactEmail).toBe('hello@imbaproduction.com')
    expect(cinema.theme?.defaults?.brand).toEqual({ name: 'Imba', accent: 'Production', homePath: '/' })
  })
})
