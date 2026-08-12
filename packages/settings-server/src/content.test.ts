import { describe, expect, it, vi } from 'vitest'
import {
  createPreviewToken,
  getBlogPostBySlug,
  listPublishedBlogPosts,
  verifyPreviewToken,
} from './content'

function makeDb(data: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  }

  return {
    db: {
      from: vi.fn().mockReturnValue(chain),
    },
    chain,
  }
}

describe('content delivery helpers', () => {
  it('creates and verifies preview tokens', () => {
    const token = createPreviewToken('secret', { slug: 'hello-world', expiresInSeconds: 60 })
    expect(verifyPreviewToken('secret', token, 'hello-world')).toBe(true)
    expect(verifyPreviewToken('secret', token, 'other-post')).toBe(false)
  })

  it('lists published blog posts', async () => {
    const { db, chain } = makeDb([{ id: '1', slug: 'hello-world' }])
    const result = await listPublishedBlogPosts(db as never)

    expect(result).toEqual([{ id: '1', slug: 'hello-world' }])
    expect(chain.eq).toHaveBeenCalledWith('published', true)
    expect(chain.eq).toHaveBeenCalledWith('status', 'published')
  })

  it('allows preview access for a draft post with a valid token', async () => {
    const { db, chain } = makeDb({ id: '1', slug: 'hello-world', status: 'draft', published: false })
    const token = createPreviewToken('secret', { slug: 'hello-world', expiresInSeconds: 60 })

    const result = await getBlogPostBySlug(db as never, 'hello-world', {
      previewToken: token,
      previewSecret: 'secret',
    })

    expect(result).toEqual({ id: '1', slug: 'hello-world', status: 'draft', published: false })
    expect(chain.or).not.toHaveBeenCalled()
  })

  it('includes posts with a null published_at', async () => {
    // The RLS policy `public_read_blog_posts` explicitly allows
    // `published_at IS NULL`, but the delivery query used `.lte(...)`, which
    // excludes NULL — so a published, undated post was invisible over the API
    // while being readable directly from Postgres.
    const { db, chain } = makeDb([{ id: '1', slug: 'undated', published_at: null }])
    await listPublishedBlogPosts(db as never)

    expect(chain.lte).not.toHaveBeenCalled()
    expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('published_at.is.null'))
  })

  it('sorts undated posts last rather than first', async () => {
    const { db, chain } = makeDb([])
    await listPublishedBlogPosts(db as never)

    expect(chain.order).toHaveBeenCalledWith('published_at', {
      ascending: false,
      nullsFirst: false,
    })
  })

  it('applies the same null-inclusive filter to a single post lookup', async () => {
    const { db, chain } = makeDb({ id: '1', slug: 'undated', published_at: null })
    await getBlogPostBySlug(db as never, 'undated')

    expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('published_at.is.null'))
  })
})
