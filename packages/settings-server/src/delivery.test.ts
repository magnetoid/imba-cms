import { describe, expect, it, vi } from 'vitest'
import {
  getPublishedPage,
  getPublishedProject,
  getPublishedSiteSettings,
  listPublishedPages,
  listPublishedProjects,
} from './delivery.js'

/** Records the query chain so each function's filters can be asserted. */
function makeDb(rows: unknown[] = [], single: unknown = null) {
  const calls: Array<[string, unknown[]]> = []
  const chain: Record<string, unknown> = {}
  for (const name of ['select', 'eq', 'order', 'maybeSingle']) {
    chain[name] = vi.fn((...args: unknown[]) => {
      calls.push([name, args])
      if (name === 'order') return Promise.resolve({ data: rows, error: null })
      if (name === 'maybeSingle') return Promise.resolve({ data: single, error: null })
      return chain
    })
  }
  const from = vi.fn(() => chain)
  return { db: { from }, from, calls }
}

describe('delivery queries', () => {
  it('lists only published pages ordered by slug', async () => {
    const { db, from, calls } = makeDb([{ slug: 'about' }])
    expect(await listPublishedPages(db as never)).toEqual([{ slug: 'about' }])
    expect(from).toHaveBeenCalledWith('pages_entries')
    expect(calls).toContainEqual(['eq', ['status', 'published']])
    expect(calls).toContainEqual(['order', ['slug', { ascending: true }]])
  })

  it('fetches one published page by slug and validates the slug', async () => {
    const { db, calls } = makeDb([], { slug: 'about' })
    expect(await getPublishedPage(db as never, 'about')).toEqual({ slug: 'about' })
    expect(calls).toContainEqual(['eq', ['slug', 'about']])
    expect(calls).toContainEqual(['eq', ['status', 'published']])
    await expect(getPublishedPage(db as never, '../etc')).rejects.toThrow()
  })

  it('lists published projects by sort order and fetches one by slug', async () => {
    const list = makeDb([{ slug: 'p1' }])
    expect(await listPublishedProjects(list.db as never)).toEqual([{ slug: 'p1' }])
    expect(list.from).toHaveBeenCalledWith('projects_entries')
    expect(list.calls).toContainEqual(['order', ['sort_order', { ascending: true }]])

    const one = makeDb([], null)
    expect(await getPublishedProject(one.db as never, 'p1')).toBeNull()
    expect(one.calls).toContainEqual(['eq', ['status', 'published']])
  })

  it('returns the primary published site settings row', async () => {
    const { db, from, calls } = makeDb([], { slug: 'primary', content: {} })
    expect(await getPublishedSiteSettings(db as never)).toEqual({ slug: 'primary', content: {} })
    expect(from).toHaveBeenCalledWith('site_entries')
    expect(calls).toContainEqual(['eq', ['slug', 'primary']])
  })
})
