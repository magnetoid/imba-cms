import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_PROJECT_RECORDS } from '../defaults'
import { parseProjectContent } from '../types'
import type { ProjectRecord, ProjectSummary, ProjectStatus } from '../types'

export interface ProjectsPublicClient {
  listPublishedProjects(): Promise<ProjectRecord[]>
  getPublishedProjectBySlug(slug: string): Promise<ProjectRecord | null>
}

let _projectsDb: SupabaseClient | null = null
let _publicClient: ProjectsPublicClient | null = null

export function setProjectsDb(db: SupabaseClient) {
  _projectsDb = db
}

export function projectsDb(): SupabaseClient {
  if (!_projectsDb) {
    throw new Error('plugin-projects: database client not initialized')
  }
  return _projectsDb
}

export function setProjectsPublicClient(client: ProjectsPublicClient) {
  _publicClient = client
}

export function projectsPublicClient(): ProjectsPublicClient {
  if (!_publicClient) {
    throw new Error('plugin-projects: public client not initialized')
  }
  return _publicClient
}

interface ProjectRow {
  id: string
  slug: string
  name: string
  url: string
  year: string
  category: string
  tagline: string
  hero: string
  summary: string
  accent: string
  featured: boolean
  sort_order: number
  status: string
  seo_title: string | null
  seo_description: string | null
  content: unknown
  created_at?: string
  updated_at?: string
  published_at?: string | null
}

function mapProjectRow(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    url: row.url,
    year: row.year,
    category: row.category,
    tagline: row.tagline,
    hero: row.hero,
    summary: row.summary,
    accent: row.accent,
    featured: row.featured,
    sortOrder: row.sort_order,
    status: (row.status === 'published' ? 'published' : 'draft') satisfies ProjectStatus,
    seoTitle: row.seo_title ?? '',
    seoDescription: row.seo_description ?? '',
    content: parseProjectContent(row.content),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? null,
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`projects delivery request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

/**
 * Reads projects from `@imba/settings-server`'s delivery API
 * (`/api/content/projects`) instead of Supabase directly. Selected by
 * `register` when `IMBA_CONTENT_API_URL` is set, mirroring the blog plugin.
 * The API returns the same row shape as the table, so the mapper is shared.
 */
export function createHttpProjectsPublicClient(config: { baseUrl: string; fetchImpl?: typeof fetch }): ProjectsPublicClient {
  const fetchImpl = config.fetchImpl ?? fetch
  const base = config.baseUrl.replace(/\/$/, '')
  return {
    async listPublishedProjects() {
      const payload = await readJson<{ items: ProjectRow[] }>(await fetchImpl(`${base}/api/content/projects`))
      return payload.items.map(mapProjectRow)
    },
    async getPublishedProjectBySlug(slug: string) {
      const response = await fetchImpl(`${base}/api/content/projects/${encodeURIComponent(slug)}`)
      if (response.status === 404) return null
      const payload = await readJson<{ item: ProjectRow | null }>(response)
      return payload.item ? mapProjectRow(payload.item) : null
    },
  }
}

export function createSupabaseProjectsPublicClient(db: SupabaseClient): ProjectsPublicClient {
  return {
    async listPublishedProjects(): Promise<ProjectRecord[]> {
      const { data, error } = await db
        .from('projects_entries')
        .select('id, slug, name, url, year, category, tagline, hero, summary, accent, featured, sort_order, status, seo_title, seo_description, content, created_at, updated_at, published_at')
        .eq('status', 'published')
        .order('sort_order', { ascending: true })

      if (error) throw error
      return (data ?? []).map((row) => mapProjectRow(row as ProjectRow))
    },

    async getPublishedProjectBySlug(slug: string): Promise<ProjectRecord | null> {
      const { data, error } = await db
        .from('projects_entries')
        .select('id, slug, name, url, year, category, tagline, hero, summary, accent, featured, sort_order, status, seo_title, seo_description, content, created_at, updated_at, published_at')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle<ProjectRow>()

      if (error) throw error
      if (!data) return null
      return mapProjectRow(data)
    },
  }
}

export async function listProjectsOrDefault(): Promise<ProjectRecord[]> {
  try {
    const projects = await projectsPublicClient().listPublishedProjects()
    return projects.length > 0 ? projects : DEFAULT_PROJECT_RECORDS
  } catch {
    return DEFAULT_PROJECT_RECORDS
  }
}

export async function getProjectOrDefault(slug: string): Promise<ProjectRecord | null> {
  try {
    const project = await projectsPublicClient().getPublishedProjectBySlug(slug)
    return project ?? DEFAULT_PROJECT_RECORDS.find((entry) => entry.slug === slug) ?? null
  } catch {
    return DEFAULT_PROJECT_RECORDS.find((entry) => entry.slug === slug) ?? null
  }
}

export function summarizeProjects(rows: ProjectRow[]): ProjectSummary[] {
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    category: row.category,
    year: row.year,
    accent: row.accent,
    tagline: row.tagline,
    featured: row.featured,
    sortOrder: row.sort_order,
    status: row.status === 'published' ? 'published' : 'draft',
    updatedAt: row.updated_at,
  }))
}
