import { describe, expect, it } from 'vitest'
import {
  createProject,
  getPage,
  getSiteSettings,
  listPages,
  listProjects,
  setPageStatus,
  setProjectStatus,
  updatePage,
  updateSiteSettings,
  type Db,
} from './content.js'

interface Call { method: string; args: unknown[] }
interface QueryRecord { table: string; calls: Call[]; payload?: unknown }

function makeDb(result: { data?: unknown; error?: { message: string } | null }) {
  const records: QueryRecord[] = []
  const resolved = { data: result.data ?? null, error: result.error ?? null }
  function chain(record: QueryRecord): any {
    const builder: any = {
      then(onFulfilled: (v: typeof resolved) => unknown, onRejected?: (e: unknown) => unknown) {
        return Promise.resolve(resolved).then(onFulfilled, onRejected)
      },
    }
    const passthrough = (method: string) => (...args: unknown[]) => {
      record.calls.push({ method, args })
      if ((method === 'insert' || method === 'update') && args.length > 0) record.payload = args[0]
      return builder
    }
    for (const m of ['select', 'order', 'eq', 'limit', 'insert', 'update', 'delete']) builder[m] = passthrough(m)
    builder.single = async () => resolved
    builder.maybeSingle = async () => resolved
    return builder
  }
  const db = { from(table: string) { const r: QueryRecord = { table, calls: [] }; records.push(r); return chain(r) } } as unknown as Db
  return { db, last: () => records[records.length - 1]! }
}
const calls = (r: QueryRecord, m: string) => r.calls.filter((c) => c.method === m)

describe('pages', () => {
  it('lists pages by slug with an optional status filter', async () => {
    const { db, last } = makeDb({ data: [] })
    await listPages(db, { status: 'published' })
    expect(last().table).toBe('pages_entries')
    expect(calls(last(), 'eq')[0]!.args).toEqual(['status', 'published'])
  })

  it('gets one page by slug and rejects a bad slug', async () => {
    const { db, last } = makeDb({ data: { slug: 'about' } })
    expect(await getPage(db, 'about')).toEqual({ slug: 'about' })
    expect(calls(last(), 'eq')[0]!.args).toEqual(['slug', 'about'])
    await expect(getPage(db, 'Not Valid')).rejects.toThrow()
  })

  it('updates only allowed page fields', async () => {
    const { db, last } = makeDb({ data: { slug: 'about' } })
    await updatePage(db, { slug: 'about', patch: { title: 'New', content: { eyebrow: 'x' } } })
    expect(last().payload).toMatchObject({ title: 'New', content: { eyebrow: 'x' } })
    await expect(updatePage(db, { slug: 'about', patch: { status: 'published' } as never })).rejects.toThrow()
  })

  it('publishing stamps published_at; drafting clears it', async () => {
    const pub = makeDb({ data: {} })
    await setPageStatus(pub.db, { slug: 'about', status: 'published' })
    expect(pub.last().payload).toMatchObject({ status: 'published' })
    expect((pub.last().payload as { published_at: string }).published_at).toBeTruthy()
    const draft = makeDb({ data: {} })
    await setPageStatus(draft.db, { slug: 'about', status: 'draft' })
    expect(draft.last().payload).toMatchObject({ status: 'draft', published_at: null })
  })
})

describe('projects', () => {
  it('lists projects by sort_order with status/featured/limit filters', async () => {
    const { db, last } = makeDb({ data: [] })
    await listProjects(db, { status: 'published', featured: true, limit: 5 })
    expect(last().table).toBe('projects_entries')
    expect(calls(last(), 'order')[0]!.args[0]).toBe('sort_order')
    expect(calls(last(), 'eq').map((c) => c.args)).toEqual([['status', 'published'], ['featured', true]])
    expect(calls(last(), 'limit')[0]!.args).toEqual([5])
  })

  it('creates a project as draft by default and published when asked', async () => {
    const draft = makeDb({ data: {} })
    await createProject(draft.db, { name: 'P', slug: 'p' })
    expect(draft.last().payload).toMatchObject({ name: 'P', slug: 'p', status: 'draft', published_at: null })
    const pub = makeDb({ data: {} })
    await createProject(pub.db, { name: 'P', slug: 'p', status: 'published' })
    expect((pub.last().payload as { published_at: string }).published_at).toBeTruthy()
  })

  it('sets project status by id', async () => {
    const { db, last } = makeDb({ data: {} })
    await setProjectStatus(db, { id: '00000000-0000-0000-0000-000000000001', status: 'published' })
    expect(calls(last(), 'eq')[0]!.args).toEqual(['id', '00000000-0000-0000-0000-000000000001'])
    expect(last().payload).toMatchObject({ status: 'published' })
  })
})

describe('site settings', () => {
  it('reads and updates the primary row only', async () => {
    const get = makeDb({ data: { slug: 'primary' } })
    expect(await getSiteSettings(get.db)).toEqual({ slug: 'primary' })
    expect(calls(get.last(), 'eq')[0]!.args).toEqual(['slug', 'primary'])
    const upd = makeDb({ data: {} })
    await updateSiteSettings(upd.db, { patch: { content: { brand: { name: 'X' } } } })
    expect(calls(upd.last(), 'eq')[0]!.args).toEqual(['slug', 'primary'])
    expect(upd.last().payload).toMatchObject({ content: { brand: { name: 'X' } } })
  })
})
