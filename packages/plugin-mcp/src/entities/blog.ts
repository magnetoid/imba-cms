import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Blog entity logic. These functions are intentionally free of any MCP-SDK
 * imports so they can be unit-tested with a hand-rolled mock Supabase client.
 * Each takes `(db, args)` and either returns data or throws on a Supabase error.
 */

export type Db = Pick<SupabaseClient, 'from'>

export const POSTS_TABLE = 'blog_posts'
export const CATEGORIES_TABLE = 'blog_categories'

/** Status values understood by the blog schema (`status` column). */
export const blogStatusSchema = z.enum(['draft', 'published', 'scheduled'])
export type BlogStatus = z.infer<typeof blogStatusSchema>

const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case (a-z, 0-9, hyphens)')

/** Fields a caller may set when creating/updating a post. */
const postFields = {
  title: z.string().min(1),
  slug,
  excerpt: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: blogStatusSchema.optional(),
  published: z.boolean().optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  featured_image_url: z.string().nullable().optional(),
  og_image_url: z.string().nullable().optional(),
  author_name: z.string().nullable().optional(),
  read_time_minutes: z.number().int().nonnegative().nullable().optional(),
}

// ── Input schemas (exported for tool wiring + tests) ──────────────────────────

export const listPostsSchema = z.object({
  status: blogStatusSchema.optional(),
  limit: z.number().int().positive().max(200).optional(),
})
export type ListPostsArgs = z.infer<typeof listPostsSchema>

export const getPostBySlugSchema = z.object({ slug })
export type GetPostBySlugArgs = z.infer<typeof getPostBySlugSchema>

export const searchPostsSchema = z.object({ query: z.string().min(1) })
export type SearchPostsArgs = z.infer<typeof searchPostsSchema>

export const createPostSchema = z.object(postFields).strict()
export type CreatePostInput = z.infer<typeof createPostSchema>

export const updatePostSchema = z.object({
  id: z.string().uuid(),
  patch: z
    .object({
      title: postFields.title.optional(),
      slug: slug.optional(),
      excerpt: postFields.excerpt,
      body: postFields.body,
      category: postFields.category,
      category_id: postFields.category_id,
      tags: postFields.tags,
      status: postFields.status,
      published: postFields.published,
      seo_title: postFields.seo_title,
      seo_description: postFields.seo_description,
      cover_image_url: postFields.cover_image_url,
      featured_image_url: postFields.featured_image_url,
      og_image_url: postFields.og_image_url,
      author_name: postFields.author_name,
      read_time_minutes: postFields.read_time_minutes,
    })
    .strict()
    .refine((p) => Object.keys(p).length > 0, { message: 'patch must contain at least one field' }),
})
export type UpdatePostArgs = z.infer<typeof updatePostSchema>

export const deletePostSchema = z.object({ id: z.string().uuid() })
export type DeletePostArgs = z.infer<typeof deletePostSchema>

export const setPublishedSchema = z.object({
  id: z.string().uuid(),
  published: z.boolean(),
})
export type SetPublishedArgs = z.infer<typeof setPublishedSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Throws if a Supabase response carries an error, otherwise returns the data. */
function unwrap<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data
}

// ── Read operations ─────────────────────────────────────────────────────────

export async function listPosts(db: Db, args: ListPostsArgs = {}) {
  const { status, limit } = listPostsSchema.parse(args)
  let query = db.from(POSTS_TABLE).select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  if (limit) query = query.limit(limit)
  return unwrap(await query)
}

export async function getPostBySlug(db: Db, slugValue: string) {
  const { slug: parsed } = getPostBySlugSchema.parse({ slug: slugValue })
  const res = await db.from(POSTS_TABLE).select('*').eq('slug', parsed).maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ?? null
}

export async function searchPosts(db: Db, query: string) {
  const { query: q } = searchPostsSchema.parse({ query })
  const pattern = `%${q}%`
  const res = await db
    .from(POSTS_TABLE)
    .select('*')
    .or(`title.ilike.${pattern},body.ilike.${pattern}`)
    .order('created_at', { ascending: false })
  return unwrap(res)
}

export async function listCategories(db: Db) {
  return unwrap(await db.from(CATEGORIES_TABLE).select('*').order('name', { ascending: true }))
}

// ── Write operations ────────────────────────────────────────────────────────

export async function createPost(db: Db, input: CreatePostInput) {
  const payload = createPostSchema.parse(input)
  const res = await db.from(POSTS_TABLE).insert(payload).select('*').single()
  return unwrap(res)
}

export async function updatePost(db: Db, args: UpdatePostArgs) {
  const { id, patch } = updatePostSchema.parse(args)
  const res = await db
    .from(POSTS_TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  return unwrap(res)
}

export async function deletePost(db: Db, id: string) {
  const { id: parsed } = deletePostSchema.parse({ id })
  const res = await db.from(POSTS_TABLE).delete().eq('id', parsed)
  if (res.error) throw new Error(res.error.message)
  return { deleted: true as const, id: parsed }
}

export async function setPublished(db: Db, args: SetPublishedArgs) {
  const { id, published } = setPublishedSchema.parse(args)
  const now = new Date().toISOString()
  const res = await db
    .from(POSTS_TABLE)
    .update({
      published,
      status: published ? 'published' : 'draft',
      published_at: published ? now : null,
      updated_at: now,
    })
    .eq('id', id)
    .select('*')
    .single()
  return unwrap(res)
}
