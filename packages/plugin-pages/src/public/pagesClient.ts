import type { SupabaseClient } from '@supabase/supabase-js'
import { buildDefaultPageRecord } from '../defaults'
import { isCmsPageSlug, parseCmsPageContent } from '../types'
import type { CmsPageRecord, CmsPageSlug, CmsPageSummary, CmsPageStatus } from '../types'

export interface PagesPublicClient {
  getPage<TSlug extends CmsPageSlug>(slug: TSlug): Promise<CmsPageRecord<TSlug> | null>
  listPages(): Promise<CmsPageSummary[]>
}

let _pagesDb: SupabaseClient | null = null
let _publicClient: PagesPublicClient | null = null

export function setPagesDb(db: SupabaseClient) {
  _pagesDb = db
}

export function pagesDb(): SupabaseClient {
  if (!_pagesDb) {
    throw new Error('plugin-pages: database client not initialized')
  }
  return _pagesDb
}

export function setPagesPublicClient(client: PagesPublicClient) {
  _publicClient = client
}

export function pagesPublicClient(): PagesPublicClient {
  if (!_publicClient) {
    throw new Error('plugin-pages: public client not initialized')
  }
  return _publicClient
}

interface PageRow {
  id: string
  slug: string
  title: string
  status: string
  seo_title: string | null
  seo_description: string | null
  content: unknown
  created_at?: string
  updated_at?: string
  published_at?: string | null
}

function mapPageRow<TSlug extends CmsPageSlug>(row: PageRow, slug: TSlug): CmsPageRecord<TSlug> {
  return {
    id: row.id,
    slug,
    title: row.title,
    status: (row.status === 'published' ? 'published' : 'draft') satisfies CmsPageStatus,
    seoTitle: row.seo_title ?? '',
    seoDescription: row.seo_description ?? '',
    content: parseCmsPageContent(slug, row.content),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? null,
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`pages delivery request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

/**
 * Reads pages from `@imba/settings-server`'s delivery API
 * (`/api/content/pages`) instead of Supabase directly. Selected by `register`
 * when `IMBA_CONTENT_API_URL` is set. Published entries only — the API never
 * serves drafts.
 */
export function createHttpPagesPublicClient(config: { baseUrl: string; fetchImpl?: typeof fetch }): PagesPublicClient {
  const fetchImpl = config.fetchImpl ?? fetch
  const base = config.baseUrl.replace(/\/$/, '')
  return {
    async getPage<TSlug extends CmsPageSlug>(slug: TSlug): Promise<CmsPageRecord<TSlug> | null> {
      const response = await fetchImpl(`${base}/api/content/pages/${encodeURIComponent(slug)}`)
      if (response.status === 404) return null
      const payload = await readJson<{ item: PageRow | null }>(response)
      if (!payload.item || !isCmsPageSlug(payload.item.slug)) return null
      return mapPageRow(payload.item, payload.item.slug as TSlug)
    },
    async listPages(): Promise<CmsPageSummary[]> {
      const payload = await readJson<{ items: PageRow[] }>(await fetchImpl(`${base}/api/content/pages`))
      return payload.items
        .filter((row) => isCmsPageSlug(row.slug))
        .map((row) => ({
          slug: row.slug as CmsPageSlug,
          title: row.title,
          status: (row.status === 'published' ? 'published' : 'draft') as CmsPageStatus,
          updatedAt: row.updated_at,
        }))
    },
  }
}

export function createSupabasePagesPublicClient(db: SupabaseClient): PagesPublicClient {
  return {
    async getPage<TSlug extends CmsPageSlug>(slug: TSlug): Promise<CmsPageRecord<TSlug> | null> {
      const { data, error } = await db
        .from('pages_entries')
        .select('id, slug, title, status, seo_title, seo_description, content, created_at, updated_at, published_at')
        .eq('slug', slug)
        .maybeSingle<PageRow>()

      if (error) throw error
      if (!data || !isCmsPageSlug(data.slug)) return null
      return mapPageRow(data, data.slug as TSlug)
    },

    async listPages(): Promise<CmsPageSummary[]> {
      const { data, error } = await db
        .from('pages_entries')
        .select('slug, title, status, updated_at')
        .order('slug', { ascending: true })

      if (error) throw error
      const summaries: CmsPageSummary[] = []

      for (const row of data ?? []) {
        const slug = typeof row.slug === 'string' ? row.slug : ''
        if (!isCmsPageSlug(slug)) continue

        summaries.push({
          slug,
          title: typeof row.title === 'string' ? row.title : slug,
          status: row.status === 'published' ? 'published' : 'draft',
          updatedAt: typeof row.updated_at === 'string' ? row.updated_at : undefined,
        })
      }

      return summaries
    },
  }
}

export async function getCmsPageOrDefault<TSlug extends CmsPageSlug>(slug: TSlug): Promise<CmsPageRecord<TSlug>> {
  try {
    const page = await pagesPublicClient().getPage(slug)
    return page ?? buildDefaultPageRecord(slug)
  } catch {
    return buildDefaultPageRecord(slug)
  }
}
