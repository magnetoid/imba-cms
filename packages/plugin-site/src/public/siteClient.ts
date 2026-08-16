import type { SupabaseClient } from '@supabase/supabase-js'
import { buildDefaultSiteSettingsRecord } from '../defaults'
import { parseSiteSettingsContent, PRIMARY_SITE_SETTINGS_SLUG } from '../types'
import type { SiteSettingsRecord, SiteSettingsStatus } from '../types'

export interface SitePublicClient {
  getPublishedSiteSettings(): Promise<SiteSettingsRecord | null>
}

let _siteDb: SupabaseClient | null = null
let _publicClient: SitePublicClient | null = null

export function setSiteDb(db: SupabaseClient) {
  _siteDb = db
}

export function siteDb(): SupabaseClient {
  if (!_siteDb) {
    throw new Error('plugin-site: database client not initialized')
  }
  return _siteDb
}

export function setSitePublicClient(client: SitePublicClient) {
  _publicClient = client
}

export function sitePublicClient(): SitePublicClient {
  if (!_publicClient) {
    throw new Error('plugin-site: public client not initialized')
  }
  return _publicClient
}

interface SiteSettingsRow {
  id: string
  slug: string
  title: string
  status: string
  content: unknown
  created_at?: string
  updated_at?: string
  published_at?: string | null
}

function mapSiteSettingsRow(row: SiteSettingsRow): SiteSettingsRecord {
  return {
    id: row.id,
    slug: PRIMARY_SITE_SETTINGS_SLUG,
    title: row.title,
    status: (row.status === 'published' ? 'published' : 'draft') satisfies SiteSettingsStatus,
    content: parseSiteSettingsContent(row.content),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? null,
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`site delivery request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

/**
 * Reads the published site settings from `@imba/settings-server`'s delivery
 * API (`/api/content/site`). Selected by `register` when
 * `IMBA_CONTENT_API_URL` is set.
 */
export function createHttpSitePublicClient(config: { baseUrl: string; fetchImpl?: typeof fetch }): SitePublicClient {
  const fetchImpl = config.fetchImpl ?? fetch
  const base = config.baseUrl.replace(/\/$/, '')
  return {
    async getPublishedSiteSettings(): Promise<SiteSettingsRecord | null> {
      const response = await fetchImpl(`${base}/api/content/site`)
      if (response.status === 404) return null
      const payload = await readJson<{ item: SiteSettingsRow | null }>(response)
      return payload.item ? mapSiteSettingsRow(payload.item) : null
    },
  }
}

export function createSupabaseSitePublicClient(db: SupabaseClient): SitePublicClient {
  return {
    async getPublishedSiteSettings(): Promise<SiteSettingsRecord | null> {
      const { data, error } = await db
        .from('site_entries')
        .select('id, slug, title, status, content, created_at, updated_at, published_at')
        .eq('slug', PRIMARY_SITE_SETTINGS_SLUG)
        .eq('status', 'published')
        .maybeSingle<SiteSettingsRow>()

      if (error) throw error
      if (!data) return null
      return mapSiteSettingsRow(data)
    },
  }
}

export async function getSiteSettingsOrDefault(): Promise<SiteSettingsRecord> {
  try {
    const settings = await sitePublicClient().getPublishedSiteSettings()
    return settings ?? buildDefaultSiteSettingsRecord()
  } catch {
    return buildDefaultSiteSettingsRecord()
  }
}
