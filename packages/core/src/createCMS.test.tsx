import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { createCMS } from './createCMS'
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
    const cms = createCMS({ template, plugins: [blog], site, supabase: { anonKey: 'k' } })
    render(
      <MemoryRouter initialEntries={['/blog']}>
        <cms.Router />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('shell')).toBeDefined()
    expect(screen.getByText('BLOG PAGE')).toBeDefined()
  })

  it('composes core.V001 ahead of plugin migrations', () => {
    const cms = createCMS({
      template,
      plugins: [definePlugin({ name: 'blog', version: '1.0.0', migrations: [{ id: 'blog.V001', sql: '-- x' }] })],
      site,
      supabase: { anonKey: 'k' },
    })
    // The core base migration (schema_migrations + is_admin()) MUST lead the list,
    // otherwise plugin RLS policies reference an is_admin() the pipeline never creates.
    expect(cms.migrations.map((m) => m.id)).toEqual(['core.V001', 'blog.V001'])
    expect(cms.migrations[0].sql).toMatch(/is_admin/i)
  })

  it('throws on an invalid plugin set (duplicate names)', () => {
    expect(() =>
      createCMS({
        template,
        plugins: [definePlugin({ name: 'dup', version: '1' }), definePlugin({ name: 'dup', version: '1' })],
        site,
        supabase: { anonKey: 'k' },
      }),
    ).toThrow(/duplicate plugin name: dup/i)
  })
})
