import { describe, it, expect } from 'vitest'
import { buildRegistry } from './registry'
import type { Plugin, Template } from './types'

const Page = () => null
const Public = () => null

const blog: Plugin = {
  name: 'blog',
  version: '1.0.0',
  tablePrefix: 'blog_',
  routes: [{ path: '/blog', element: Page }],
  admin: { nav: { group: 'Content', label: 'Blog', path: '/admin/blog' }, pages: [{ path: '/admin/blog/:id', element: Page }] },
  migrations: [{ id: 'blog.V001', sql: '-- blog' }],
  dashboard: [{ id: 'blog-count', render: Page }],
}

const cinema: Template = {
  name: 'cinema',
  layouts: { Public },
  pages: [{ path: '/', element: Page }],
}

describe('buildRegistry', () => {
  it('merges template pages and plugin routes', () => {
    const reg = buildRegistry([blog], cinema)
    expect(reg.routes.map((r) => r.path).sort()).toEqual(['/', '/blog'])
  })

  it('collects admin nav + pages', () => {
    const reg = buildRegistry([blog], cinema)
    expect(reg.adminNav.map((n) => n.path)).toEqual(['/admin/blog'])
    expect(reg.adminPages.map((p) => p.path)).toEqual(['/admin/blog/:id'])
  })

  it('orders migrations and collects dashboard widgets', () => {
    const reg = buildRegistry([blog], cinema)
    expect(reg.migrations.map((m) => m.id)).toEqual(['blog.V001'])
    expect(reg.dashboard.map((w) => w.id)).toEqual(['blog-count'])
  })

  it('throws when a plugin route path collides with a template page path', () => {
    const clash: Template = { name: 'c', layouts: { Public }, pages: [{ path: '/blog', element: Page }] }
    expect(() => buildRegistry([blog], clash)).toThrow(/route path collides with template: \/blog/i)
  })
})

describe('buildRegistry i18n', () => {
  it('collects each plugin\'s strings into a per-locale, per-plugin-namespace bundle', () => {
    const reg = buildRegistry([
      { ...blog, i18n: { en: { title: 'Blog' }, sr: { title: 'Blog (sr)' } } },
      { name: 'pages', version: '1.0.0', i18n: { en: { title: 'Pages' } } },
    ])
    expect(reg.i18n).toEqual({
      en: { blog: { title: 'Blog' }, pages: { title: 'Pages' } },
      sr: { blog: { title: 'Blog (sr)' } },
    })
  })

  it('yields an empty bundle when no plugin declares strings', () => {
    expect(buildRegistry([blog]).i18n).toEqual({})
  })
})

describe('buildRegistry theme resolvers', () => {
  it('collects plugin resolveTheme hooks in dependency order', () => {
    const resolveA = async () => ({ brand: { name: 'a' } })
    const resolveB = async () => ({ brand: { name: 'b' } })
    const reg = buildRegistry([
      { name: 'b', version: '1', dependsOn: ['a'], resolveTheme: resolveB },
      { name: 'a', version: '1', resolveTheme: resolveA },
      { name: 'c', version: '1' },
    ])
    expect(reg.themeResolvers.map((r) => r.plugin)).toEqual(['a', 'b'])
    expect(reg.themeResolvers.map((r) => r.resolve)).toEqual([resolveA, resolveB])
  })
})
