import { describe, it, expect } from 'vitest'
import type { Plugin, Template, RouteDef, MigrationDef, SiteConfig } from './types'

describe('type contracts', () => {
  it('a minimal Plugin object satisfies the Plugin type', () => {
    const p: Plugin = { name: 'demo', version: '0.0.0' }
    expect(p.name).toBe('demo')
  })

  it('a minimal Template object satisfies the Template type', () => {
    const Public = () => null
    const t: Template = { name: 'bare', layouts: { Public } }
    expect(t.name).toBe('bare')
  })

  it('MigrationDef requires id and sql', () => {
    const m: MigrationDef = { id: 'demo.V001', sql: 'select 1;' }
    expect(m.id).toBe('demo.V001')
  })

  it('SiteConfig and RouteDef are usable', () => {
    const site: SiteConfig = { name: 'X', domain: 'x.com', defaultLocale: 'en', locales: ['en'] }
    const Page = () => null
    const r: RouteDef = { path: '/x', element: Page }
    expect(site.name + r.path).toBe('X/x')
  })
})
