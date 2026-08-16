// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createHttpProjectsPublicClient } from './projectsClient'
import { DEFAULT_PROJECTS_DATA } from '../projectsData'

const row = () => {
  const p = DEFAULT_PROJECTS_DATA[0]!
  return { id: '1', slug: p.slug, name: p.name, url: p.url, year: p.year, category: p.category, tagline: p.tagline, hero: p.hero, summary: p.summary, accent: p.accent, featured: true, sort_order: 1, status: 'published', seo_title: '', seo_description: '', content: p.content }
}

describe('createHttpProjectsPublicClient', () => {
  it('lists projects from the delivery API and maps rows to records', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [row()] }), { status: 200 }))
    const client = createHttpProjectsPublicClient({ baseUrl: 'https://cms.example.com/', fetchImpl })
    const projects = await client.listPublishedProjects()
    expect(fetchImpl).toHaveBeenCalledWith('https://cms.example.com/api/content/projects')
    expect(projects[0]).toMatchObject({ slug: row().slug, sortOrder: 1, featured: true })
  })

  it('fetches by slug and returns null on 404', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ item: row() }), { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 404 }))
    const client = createHttpProjectsPublicClient({ baseUrl: 'https://cms.example.com', fetchImpl })
    expect((await client.getPublishedProjectBySlug(row().slug))?.name).toBe(row().name)
    expect(await client.getPublishedProjectBySlug('missing')).toBeNull()
    expect(fetchImpl.mock.calls[0]![0]).toBe(`https://cms.example.com/api/content/projects/${row().slug}`)
  })
})
