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
export const blogStatusSchema = z.enum(['draft', 'in_review', 'approved', 'scheduled', 'published', 'archived'])
export type BlogStatus = z.infer<typeof blogStatusSchema>
const isoDateTimeSchema = z.string().datetime({ offset: true }).nullable().optional()

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
  published_at: isoDateTimeSchema,
  scheduled_for: isoDateTimeSchema,
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
      published_at: postFields.published_at,
      scheduled_for: postFields.scheduled_for,
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

function normalizePostWrite<
  T extends {
    status?: BlogStatus
    published?: boolean
    published_at?: string | null
    scheduled_for?: string | null
  },
>(input: T): T & {
  status: BlogStatus
  published: boolean
  published_at: string | null
  scheduled_for: string | null
} {
  const now = new Date().toISOString()
  let status = input.status ?? (input.published ? 'published' : 'draft')
  let published = input.published ?? false
  let publishedAt = input.published_at ?? null
  let scheduledFor = input.scheduled_for ?? null

  if (status === 'scheduled' && scheduledFor && Date.parse(scheduledFor) <= Date.parse(now)) {
    status = 'published'
  }

  if (status === 'published' || published) {
    status = 'published'
    published = true
    publishedAt = publishedAt ?? now
    scheduledFor = null
  } else if (status === 'scheduled') {
    published = false
    publishedAt = null
    scheduledFor = scheduledFor ?? now
  } else {
    published = false
    publishedAt = null
    scheduledFor = null
  }

  return {
    ...input,
    status,
    published,
    published_at: publishedAt,
    scheduled_for: scheduledFor,
  }
}

function normalizeWorkflowPatch(input: {
  status?: BlogStatus
  published?: boolean
  published_at?: string | null
  scheduled_for?: string | null
}) {
  const now = new Date().toISOString()

  if (input.status === 'published' || input.published === true) {
    return {
      status: 'published' as const,
      published: true,
      published_at: input.published_at ?? now,
      scheduled_for: null,
    }
  }

  if (input.status === 'scheduled' || input.scheduled_for) {
    const scheduledFor = input.scheduled_for ?? now
    if (Date.parse(scheduledFor) <= Date.parse(now)) {
      return {
        status: 'published' as const,
        published: true,
        published_at: input.published_at ?? scheduledFor,
        scheduled_for: null,
      }
    }

    return {
      status: 'scheduled' as const,
      published: false,
      published_at: null,
      scheduled_for: scheduledFor,
    }
  }

  if (input.status && ['draft', 'in_review', 'approved', 'archived'].includes(input.status)) {
    return {
      status: input.status,
      published: false,
      published_at: null,
      scheduled_for: null,
    }
  }

  if (input.published === false) {
    return {
      status: 'draft' as const,
      published: false,
      published_at: null,
      scheduled_for: null,
    }
  }

  return {}
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
  const payload = normalizePostWrite(createPostSchema.parse(input))
  const res = await db.from(POSTS_TABLE).insert(payload).select('*').single()
  return unwrap(res)
}

export async function updatePost(db: Db, args: UpdatePostArgs) {
  const { id, patch } = updatePostSchema.parse(args)
  const workflowPatch = normalizeWorkflowPatch(patch)
  const res = await db
    .from(POSTS_TABLE)
    .update({ ...patch, ...workflowPatch, updated_at: new Date().toISOString() })
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
  const payload = normalizePostWrite({ published, status: published ? 'published' : 'draft' })
  const res = await db
    .from(POSTS_TABLE)
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()
  return unwrap(res)
}
