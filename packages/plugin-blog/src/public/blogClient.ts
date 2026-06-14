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
