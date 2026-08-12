import { describe, expect, it } from 'vitest'
import { CORE_MIGRATIONS, composeMigrations } from './manifest'
import { createAdminApp } from './createCMS'
import { definePlugin } from './define'
import type { SiteConfig } from './types'

const site: SiteConfig = { name: 'Test', domain: 't.com', defaultLocale: 'en', locales: ['en'] }
const supabase = { url: 'https://test.supabase.co', anonKey: 'k' }

const media = definePlugin({
  name: 'media',
  version: '1.0.0',
  migrations: [{ id: 'media.V001', sql: '-- media' }],
})

const blog = definePlugin({
  name: 'blog',
  version: '1.0.0',
  dependsOn: ['media'],
  migrations: [{ id: 'blog.V001', sql: '-- blog 1' }, { id: 'blog.V002', sql: '-- blog 2' }],
})

describe('composeMigrations', () => {
  it('puts every core migration first, in order', () => {
    const ids = composeMigrations([blog, media]).map((m) => m.id)
    const coreIds = CORE_MIGRATIONS.map((m) => m.id)

    expect(ids.slice(0, coreIds.length)).toEqual(coreIds)
  })

  it('orders plugin migrations by dependency, not by input order', () => {
    // blog dependsOn media, so media's migration must come first even though
    // blog is passed first.
    const ids = composeMigrations([blog, media]).map((m) => m.id)
    expect(ids.indexOf('media.V001')).toBeLessThan(ids.indexOf('blog.V001'))
    expect(ids.indexOf('blog.V001')).toBeLessThan(ids.indexOf('blog.V002'))
  })

  it('matches exactly what the app composes at boot', () => {
    // The whole point: the release manifest records this order, and the update
    // engine applies in it. If tooling and runtime ever disagree, a consumer
    // gets a different schema than the release was tested against.
    const app = createAdminApp({ plugins: [blog, media], site, supabase })
    expect(composeMigrations([blog, media]).map((m) => m.id)).toEqual(
      app.migrations.map((m) => m.id),
    )
  })

  it('returns only core migrations for an empty plugin set', () => {
    expect(composeMigrations([]).map((m) => m.id)).toEqual(CORE_MIGRATIONS.map((m) => m.id))
  })

  it('carries the SQL body through, not just the id', () => {
    const composed = composeMigrations([media])
    expect(composed.find((m) => m.id === 'media.V001')?.sql).toBe('-- media')
    expect(composed[0]?.sql.length).toBeGreaterThan(0)
  })

  it('produces unique ids', () => {
    const ids = composeMigrations([blog, media]).map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
