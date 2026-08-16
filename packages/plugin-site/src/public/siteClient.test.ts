// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createHttpSitePublicClient } from './siteClient'
import { DEFAULT_SITE_SETTINGS_CONTENT } from '../defaults'

describe('createHttpSitePublicClient', () => {
  it('fetches the primary published settings and maps them', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      item: { id: '1', slug: 'primary', title: 'Public Site', status: 'published', content: DEFAULT_SITE_SETTINGS_CONTENT },
    }), { status: 200 }))
    const client = createHttpSitePublicClient({ baseUrl: 'https://cms.example.com/', fetchImpl })
    const settings = await client.getPublishedSiteSettings()
    expect(fetchImpl).toHaveBeenCalledWith('https://cms.example.com/api/content/site')
    expect(settings?.content.brand.name).toBe(DEFAULT_SITE_SETTINGS_CONTENT.brand.name)
  })

  it('returns null when nothing is published', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 404 }))
    const client = createHttpSitePublicClient({ baseUrl: 'https://cms.example.com', fetchImpl })
    expect(await client.getPublishedSiteSettings()).toBeNull()
  })
})
