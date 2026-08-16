// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createHttpPagesPublicClient } from './pagesClient'
import { buildDefaultPageRecord } from '../defaults'

const aboutRow = () => {
  const about = buildDefaultPageRecord('about')
  return { id: '1', slug: 'about', title: about.title, status: 'published', seo_title: 'About', seo_description: '', content: about.content, updated_at: '2026-01-01' }
}

describe('createHttpPagesPublicClient', () => {
  it('fetches one page from the delivery API and maps it', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ item: aboutRow() }), { status: 200 }))
    const client = createHttpPagesPublicClient({ baseUrl: 'https://cms.example.com/', fetchImpl })
    const page = await client.getPage('about')
    expect(fetchImpl).toHaveBeenCalledWith('https://cms.example.com/api/content/pages/about')
    expect(page?.slug).toBe('about')
    expect(page?.status).toBe('published')
    expect(page?.content.title).toBe(buildDefaultPageRecord('about').content.title)
  })

  it('returns null on 404 and lists page summaries', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [aboutRow(), { ...aboutRow(), slug: 'not-a-page' }] }), { status: 200 }))
    const client = createHttpPagesPublicClient({ baseUrl: 'https://cms.example.com', fetchImpl })
    expect(await client.getPage('contact')).toBeNull()
    expect(await client.listPages()).toEqual([{ slug: 'about', title: aboutRow().title, status: 'published', updatedAt: '2026-01-01' }])
  })
})
