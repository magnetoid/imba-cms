import type { SupabaseClient } from '@supabase/supabase-js'

import type { BlogPost } from '../types'

let _db: SupabaseClient | null = null
export function setBlogDb(db: SupabaseClient) { _db = db }
export function blogDb(): SupabaseClient {
  if (!_db) throw new Error('plugin-blog: db not initialized — did createCMS run the plugin register hook?')
  return _db
}

export interface BlogPublicClient {
  listPublishedPosts(): Promise<BlogPost[]>
  getPublishedPostBySlug(slug: string): Promise<BlogPost | null>
}

let _publicClient: BlogPublicClient | null = null

export function setBlogPublicClient(client: BlogPublicClient) {
  _publicClient = client
}

export function blogPublicClient(): BlogPublicClient {
  if (!_publicClient) {
    throw new Error('plugin-blog: public client not initialized — configure the blog delivery client before rendering public routes')
  }
  return _publicClient
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`blog delivery request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function createHttpBlogPublicClient(config: {
  baseUrl: string
  previewToken?: string
  fetchImpl?: typeof fetch
}): BlogPublicClient {
  const fetchImpl = config.fetchImpl ?? fetch

  return {
    async listPublishedPosts() {
      const response = await fetchImpl(`${config.baseUrl.replace(/\/$/, '')}/api/content/blog/posts`)
      const payload = await readJson<{ items: BlogPost[] }>(response)
      return payload.items
    },
    async getPublishedPostBySlug(slug: string) {
      const url = new URL(`${config.baseUrl.replace(/\/$/, '')}/api/content/blog/posts/${encodeURIComponent(slug)}`)
      if (config.previewToken) {
        url.searchParams.set('previewToken', config.previewToken)
      }
      const response = await fetchImpl(url.toString())
      if (response.status === 404) return null
      const payload = await readJson<{ item: BlogPost | null }>(response)
      return payload.item
    },
  }
}

export function createSupabaseBlogPublicClient(db: SupabaseClient): BlogPublicClient {
  return {
    async listPublishedPosts() {
      const now = new Date().toISOString()
      const { data, error } = await db
        .from('blog_posts')
        .select('*, blog_categories(name, slug)')
        .eq('published', true)
        .eq('status', 'published')
        .lte('published_at', now)
        .order('published_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as BlogPost[]
    },
    async getPublishedPostBySlug(slug: string) {
      const now = new Date().toISOString()
      const { data, error } = await db
        .from('blog_posts')
        .select('*, blog_categories(name, slug)')
        .eq('slug', slug)
        .eq('published', true)
        .eq('status', 'published')
        .lte('published_at', now)
        .maybeSingle()

      if (error) throw error
      return (data ?? null) as BlogPost | null
    },
  }
}
