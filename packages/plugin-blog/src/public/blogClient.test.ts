import { describe, expect, it, vi } from 'vitest'
import { createHttpBlogPublicClient } from './blogClient'

describe('createHttpBlogPublicClient', () => {
  it('loads published posts from the content API', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [{ id: '1', slug: 'hello-world', title: 'Hello', published: true, created_at: '2026-01-01' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const client = createHttpBlogPublicClient({ baseUrl: 'https://cms.example.com', fetchImpl })
    const result = await client.listPublishedPosts()

    expect(fetchImpl).toHaveBeenCalledWith('https://cms.example.com/api/content/blog/posts')
    expect(result).toHaveLength(1)
  })

  it('passes preview tokens when loading a post by slug', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ item: { id: '1', slug: 'hello-world', title: 'Hello', published: false, created_at: '2026-01-01' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const client = createHttpBlogPublicClient({
      baseUrl: 'https://cms.example.com/',
      previewToken: 'preview-token',
      fetchImpl,
    })
    const result = await client.getPublishedPostBySlug('hello-world')

    expect(fetchImpl.mock.calls[0]?.[0]).toBe('https://cms.example.com/api/content/blog/posts/hello-world?previewToken=preview-token')
    expect(result?.published).toBe(false)
  })
})
