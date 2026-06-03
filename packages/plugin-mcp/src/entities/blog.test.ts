import { describe, it, expect } from 'vitest'

import {
  listPosts,
  getPostBySlug,
  searchPosts,
  listCategories,
  createPost,
  updatePost,
  deletePost,
  setPublished,
  type Db,
} from './blog.js'

/**
 * A hand-rolled mock Supabase client. `.from(table)` returns a chainable stub
 * that records the table and every call, and resolves to the canned result.
 * Terminal awaits resolve to `{ data, error }`; `.single()` / `.maybeSingle()`
 * also resolve to a canned result.
 */
interface Call {
  method: string
  args: unknown[]
}

interface QueryRecord {
  table: string
  calls: Call[]
  payload?: unknown
}

function makeDb(result: { data?: unknown; error?: { message: string } | null }) {
  const records: QueryRecord[] = []
  const resolved = { data: result.data ?? null, error: result.error ?? null }

  function chain(record: QueryRecord): any {
    const builder: any = {
      then(onFulfilled: (v: typeof resolved) => unknown, onRejected?: (e: unknown) => unknown) {
        return Promise.resolve(resolved).then(onFulfilled, onRejected)
      },
    }
    const record_ = record
    const passthrough = (method: string) => (...args: unknown[]) => {
      record_.calls.push({ method, args })
      if ((method === 'insert' || method === 'update' || method === 'upsert') && args.length > 0) {
        record_.payload = args[0]
      }
      return builder
    }
    for (const m of ['select', 'order', 'eq', 'limit', 'or', 'insert', 'update', 'delete', 'upsert']) {
      builder[m] = passthrough(m)
    }
    builder.single = (...args: unknown[]) => {
      record_.calls.push({ method: 'single', args })
      return Promise.resolve(resolved)
    }
    builder.maybeSingle = (...args: unknown[]) => {
      record_.calls.push({ method: 'maybeSingle', args })
      return Promise.resolve(resolved)
    }
    return builder
  }

  const db: Db = {
    from(table: string) {
      const record: QueryRecord = { table, calls: [] }
      records.push(record)
      return chain(record) as any
    },
  } as Db

  return { db, records, last: () => records[records.length - 1] }
}

function callsTo(record: QueryRecord, method: string) {
  return record.calls.filter((c) => c.method === method)
}

describe('listPosts', () => {
  it('selects from blog_posts ordered by created_at, no status filter by default', async () => {
    const rows = [{ id: '1', title: 'A' }]
    const { db, last } = makeDb({ data: rows })
    const out = await listPosts(db, {})
    expect(out).toEqual(rows)
    const rec = last()
    expect(rec.table).toBe('blog_posts')
    expect(callsTo(rec, 'select')).toHaveLength(1)
    expect(callsTo(rec, 'eq')).toHaveLength(0)
  })

  it('filters by status and applies limit when given', async () => {
    const { db, last } = makeDb({ data: [] })
    await listPosts(db, { status: 'published', limit: 5 })
    const rec = last()
    const eqCall = callsTo(rec, 'eq')[0]
    expect(eqCall.args).toEqual(['status', 'published'])
    expect(callsTo(rec, 'limit')[0].args).toEqual([5])
  })

  it('throws when Supabase returns an error', async () => {
    const { db } = makeDb({ error: { message: 'boom' } })
    await expect(listPosts(db, {})).rejects.toThrow('boom')
  })
})

describe('getPostBySlug', () => {
  it('queries by slug and returns the row', async () => {
    const row = { id: '1', slug: 'hello', title: 'Hello' }
    const { db, last } = makeDb({ data: row })
    const out = await getPostBySlug(db, 'hello')
    expect(out).toEqual(row)
    const rec = last()
    expect(callsTo(rec, 'eq')[0].args).toEqual(['slug', 'hello'])
    expect(callsTo(rec, 'maybeSingle')).toHaveLength(1)
  })

  it('returns null when no row found', async () => {
    const { db } = makeDb({ data: null })
    expect(await getPostBySlug(db, 'missing')).toBeNull()
  })
})

describe('searchPosts', () => {
  it('builds an OR ilike clause over title and body', async () => {
    const { db, last } = makeDb({ data: [] })
    await searchPosts(db, 'react')
    const orCall = callsTo(last(), 'or')[0]
    expect(orCall.args[0]).toBe('title.ilike.%react%,body.ilike.%react%')
  })

  it('rejects an empty query (zod)', async () => {
    const { db } = makeDb({ data: [] })
    await expect(searchPosts(db, '')).rejects.toThrow()
  })
})

describe('createPost', () => {
  it('inserts a payload built from validated input and returns the row', async () => {
    const inserted = { id: 'new', title: 'T', slug: 'a-slug' }
    const { db, last } = makeDb({ data: inserted })
    const out = await createPost(db, { title: 'T', slug: 'a-slug', body: 'hi' })
    expect(out).toEqual(inserted)
    const rec = last()
    expect(rec.table).toBe('blog_posts')
    expect(rec.payload).toMatchObject({ title: 'T', slug: 'a-slug', body: 'hi' })
    expect(callsTo(rec, 'single')).toHaveLength(1)
  })

  it('rejects input missing title (zod)', async () => {
    const { db } = makeDb({ data: {} })
    // @ts-expect-error intentionally missing title
    await expect(createPost(db, { slug: 'a-slug' })).rejects.toThrow()
  })

  it('rejects input missing slug (zod)', async () => {
    const { db } = makeDb({ data: {} })
    // @ts-expect-error intentionally missing slug
    await expect(createPost(db, { title: 'T' })).rejects.toThrow()
  })

  it('rejects an invalid (non-kebab) slug', async () => {
    const { db } = makeDb({ data: {} })
    await expect(createPost(db, { title: 'T', slug: 'Not A Slug' })).rejects.toThrow()
  })
})

describe('updatePost', () => {
  it('updates by id with the patch plus an updated_at stamp', async () => {
    const updated = { id: 'x', title: 'New' }
    const { db, last } = makeDb({ data: updated })
    const out = await updatePost(db, { id: '11111111-1111-1111-1111-111111111111', patch: { title: 'New' } })
    expect(out).toEqual(updated)
    const rec = last()
    expect(rec.payload).toMatchObject({ title: 'New' })
    expect((rec.payload as { updated_at?: string }).updated_at).toBeTypeOf('string')
    expect(callsTo(rec, 'eq')[0].args).toEqual(['id', '11111111-1111-1111-1111-111111111111'])
  })

  it('rejects an empty patch (zod)', async () => {
    const { db } = makeDb({ data: {} })
    await expect(
      updatePost(db, { id: '11111111-1111-1111-1111-111111111111', patch: {} }),
    ).rejects.toThrow()
  })
})

describe('deletePost', () => {
  it('calls delete filtered by id and returns { deleted: true }', async () => {
    const { db, last } = makeDb({ data: null })
    const out = await deletePost(db, '22222222-2222-2222-2222-222222222222')
    expect(out).toEqual({ deleted: true, id: '22222222-2222-2222-2222-222222222222' })
    const rec = last()
    expect(callsTo(rec, 'delete')).toHaveLength(1)
    expect(callsTo(rec, 'eq')[0].args).toEqual(['id', '22222222-2222-2222-2222-222222222222'])
  })

  it('throws on a Supabase error', async () => {
    const { db } = makeDb({ error: { message: 'fk violation' } })
    await expect(deletePost(db, '22222222-2222-2222-2222-222222222222')).rejects.toThrow('fk violation')
  })
})

describe('setPublished', () => {
  it('sets published true with a published_at timestamp and status=published', async () => {
    const { db, last } = makeDb({ data: { id: 'p', published: true } })
    await setPublished(db, { id: '33333333-3333-3333-3333-333333333333', published: true })
    const payload = last().payload as { published: boolean; published_at: string | null; status: string }
    expect(payload.published).toBe(true)
    expect(payload.status).toBe('published')
    expect(payload.published_at).toBeTypeOf('string')
    expect(Number.isNaN(Date.parse(payload.published_at as string))).toBe(false)
  })

  it('clears published_at and sets status=draft when unpublishing', async () => {
    const { db, last } = makeDb({ data: { id: 'p', published: false } })
    await setPublished(db, { id: '33333333-3333-3333-3333-333333333333', published: false })
    const payload = last().payload as { published: boolean; published_at: string | null; status: string }
    expect(payload.published).toBe(false)
    expect(payload.status).toBe('draft')
    expect(payload.published_at).toBeNull()
  })
})

describe('listCategories', () => {
  it('selects from blog_categories ordered by name', async () => {
    const cats = [{ id: '1', name: 'News' }]
    const { db, last } = makeDb({ data: cats })
    const out = await listCategories(db)
    expect(out).toEqual(cats)
    const rec = last()
    expect(rec.table).toBe('blog_categories')
    expect(callsTo(rec, 'order')[0].args[0]).toBe('name')
  })
})
