import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { createAdminApp, createCMS, createPublicApp } from './createCMS'
import { definePlugin, defineTemplate } from './define'
import type { SiteConfig } from './types'

const site: SiteConfig = { name: 'Test', domain: 't.com', defaultLocale: 'en', locales: ['en'] }

const blog = definePlugin({
  name: 'blog',
  version: '1.0.0',
  routes: [{ path: '/blog', element: () => <div>BLOG PAGE</div> }],
})

const template = defineTemplate({
  name: 'cinema',
  layouts: { Public: ({ children }: { children?: React.ReactNode }) => <div data-testid="shell">{children}</div> },
  pages: [{ path: '/', element: () => <div>HOME</div> }],
})

describe('createCMS', () => {
  it('renders a plugin route wrapped in the template Public layout', () => {
    const cms = createCMS({ template, plugins: [blog], site, supabase: { url: 'https://test.supabase.co', anonKey: 'k' } })
    render(
      <MemoryRouter initialEntries={['/blog']}>
        <cms.Router />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('shell')).toBeDefined()
    expect(screen.getByText('BLOG PAGE')).toBeDefined()
  })

  it('composes core migrations ahead of plugin migrations', () => {
    const cms = createCMS({
      template,
      plugins: [definePlugin({ name: 'blog', version: '1.0.0', migrations: [{ id: 'blog.V001', sql: '-- x' }] })],
      site,
      supabase: { url: 'https://test.supabase.co', anonKey: 'k' },
    })
    expect(cms.migrations.map((m) => m.id)).toEqual(['core.V001', 'core.V002', 'core.V003', 'core.V004', 'core.V005', 'core.V006', 'blog.V001'])
    expect(cms.migrations[0].sql).toMatch(/is_admin/i)
    expect(cms.migrations[1].sql).toMatch(/cms_private_settings/i)
  })

  it('throws on an invalid plugin set (duplicate names)', () => {
    expect(() =>
      createCMS({
        template,
        plugins: [definePlugin({ name: 'dup', version: '1' }), definePlugin({ name: 'dup', version: '1' })],
        site,
        supabase: { url: 'https://test.supabase.co', anonKey: 'k' },
      }),
    ).toThrow(/duplicate plugin name: dup/i)
  })

  it('creates a dedicated public app router', () => {
    const app = createPublicApp({ template, plugins: [blog], site, supabase: { url: 'https://test.supabase.co', anonKey: 'k' } })
    render(
      <MemoryRouter initialEntries={['/blog']}>
        <app.Router />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('shell')).toBeDefined()
    expect(screen.getByText('BLOG PAGE')).toBeDefined()
  })

  it('runs plugin register hooks for the dedicated public app', () => {
    // This previously asserted the opposite, which pinned a real defect:
    // `createPublicApp` never created a db and never called `register`, so any
    // plugin resolving its delivery client in that hook — plugin-blog does —
    // threw "public client not initialized" on first render. The old test only
    // checked route shape, so nothing caught it.
    let registerCalls = 0
    createPublicApp({
      template,
      plugins: [definePlugin({
        name: 'public-only',
        version: '1.0.0',
        register() {
          registerCalls += 1
        },
      })],
      site,
      supabase: { url: 'https://test.supabase.co', anonKey: 'k' },
    })

    expect(registerCalls).toBe(1)
  })

  it('creates a dedicated admin app router with the admin auth shell', async () => {
    const app = createAdminApp({
      plugins: [definePlugin({
        name: 'settings',
        version: '1.0.0',
        admin: {
          nav: { group: 'System', label: 'Settings', path: '/admin/settings' },
          pages: [{ path: '/admin/settings', element: () => <div>SETTINGS PAGE</div> }],
        },
      })],
      site,
      supabase: { url: 'https://test.supabase.co', anonKey: 'k' },
    })
    render(
      <MemoryRouter initialEntries={['/admin/settings']}>
        <app.Router />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeDefined()
  })

  it('enforces template expected plugins', () => {
    const expectedTemplate = defineTemplate({
      name: 'expected',
      layouts: { Public: ({ children }: { children?: React.ReactNode }) => <div>{children}</div> },
      expects: ['blog'],
    })

    expect(() =>
      createPublicApp({ template: expectedTemplate, plugins: [], site, supabase: { url: 'https://test.supabase.co', anonKey: 'k' } }),
    ).toThrow(/expects plugin "blog"/i)
  })
})
