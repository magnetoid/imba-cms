import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { createAdminApp, createCMS, createPublicApp } from './createCMS'
import { definePlugin, defineTemplate } from './define'
import type { PluginContext, SiteConfig } from './types'

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

describe('createCMS i18n', () => {
  it('loads every plugin\'s i18n strings so react-i18next can resolve them by plugin namespace', async () => {
    const i18next = (await import('i18next')).default
    createCMS({
      template,
      plugins: [definePlugin({ name: 'i18n-plugin', version: '1.0.0', i18n: { en: { greeting: 'Hello from plugin' } } })],
      site,
      supabase: { url: 'https://test.supabase.co', anonKey: 'k' },
    })
    expect(i18next.t('greeting', { ns: 'i18n-plugin' })).toBe('Hello from plugin')
  })
})

describe('createCMS seeds', () => {
  it('exposes the plugin seed hooks through the instance instead of leaving them uncalled', async () => {
    // `Plugin.seed` existed on the contract and four plugins implemented it, but
    // nothing in core ever invoked one. The instance now owns the runner.
    const seed = vi.fn(async (_ctx: PluginContext) => {})
    const cms = createCMS({
      template,
      plugins: [definePlugin({ name: 'seeded', version: '1.0.0', seed }), blog],
      site,
      supabase: { url: 'https://test.supabase.co', anonKey: 'k' },
    })
    expect(cms.seedablePlugins).toEqual(['seeded'])
    const results = await cms.seed()
    expect(seed).toHaveBeenCalledOnce()
    expect(seed.mock.calls[0]![0]).toMatchObject({ config: site })
    expect(results).toEqual([{ plugin: 'seeded', status: 'seeded' }])
  })
})

describe('createCMS runtime theme', () => {
  it('feeds plugin-resolved theme config to the public router', async () => {
    const { useThemeConfig } = await import('./theme')
    const { waitFor } = await import('@testing-library/react')
    function BrandPage() {
      return <div data-testid="brand-page">{useThemeConfig().brand?.name}</div>
    }
    const cms = createCMS({
      template: defineTemplate({
        name: 'brandy',
        layouts: { Public: ({ children }: { children?: React.ReactNode }) => <>{children}</> },
        pages: [{ path: '/', element: BrandPage }],
      }),
      plugins: [definePlugin({
        name: 'site-like',
        version: '1.0.0',
        resolveTheme: async (ctx) => ({ brand: { name: `Managed ${ctx.config.name}` } }),
      })],
      site,
      supabase: { url: 'https://test.supabase.co', anonKey: 'k' },
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <cms.PublicRouter />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByTestId('brand-page').textContent).toBe('Managed Test'))
  })
})
