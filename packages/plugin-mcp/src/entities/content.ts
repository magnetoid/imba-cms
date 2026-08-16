import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Pages, projects and site settings for the MCP server.
 *
 * The blog was the only entity an agent could reach; the other three content
 * plugins were admin-UI-only. These are the same table shapes those plugins
 * write. Their `content` columns are JSON validated by zod schemas that live in
 * the browser plugins (which import Vite `?raw` SQL and cannot be loaded here),
 * so `content` is accepted as an object and left to the database constraints
 * and the admin editor's parser — the tool descriptions say so.
 */

export type Db = Pick<SupabaseClient, 'from'>

export const PAGES_TABLE = 'pages_entries'
export const PROJECTS_TABLE = 'projects_entries'
export const SITE_TABLE = 'site_entries'
export const SITE_PRIMARY_SLUG = 'primary'

export const contentStatusSchema = z.enum(['draft', 'published'])
export type ContentStatus = z.infer<typeof contentStatusSchema>

const slug = z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case')
const jsonObject = z.record(z.unknown())

function unwrap<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data
}

function statusPatch(status: ContentStatus) {
  const now = new Date().toISOString()
  return status === 'published'
    ? { status, published_at: now, updated_at: now }
    : { status, published_at: null, updated_at: now }
}

// ── Pages ────────────────────────────────────────────────────────────────────

export const listPagesSchema = z.object({ status: contentStatusSchema.optional() })
export const getPageSchema = z.object({ slug })
export const updatePageSchema = z.object({
  slug,
  patch: z.object({
    title: z.string().min(1).optional(),
    seo_title: z.string().nullable().optional(),
    seo_description: z.string().nullable().optional(),
    content: jsonObject.optional(),
  }).strict(),
})
export const setPageStatusSchema = z.object({ slug, status: contentStatusSchema })

export async function listPages(db: Db, args: z.infer<typeof listPagesSchema> = {}) {
  const { status } = listPagesSchema.parse(args)
  let query = db.from(PAGES_TABLE).select('*').order('slug', { ascending: true })
  if (status) query = query.eq('status', status)
  return unwrap(await query)
}

export async function getPage(db: Db, slugValue: string) {
  const { slug: parsed } = getPageSchema.parse({ slug: slugValue })
  const res = await db.from(PAGES_TABLE).select('*').eq('slug', parsed).maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ?? null
}

export async function updatePage(db: Db, args: z.infer<typeof updatePageSchema>) {
  const { slug: parsed, patch } = updatePageSchema.parse(args)
  const res = await db
    .from(PAGES_TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('slug', parsed)
    .select('*')
    .single()
  return unwrap(res)
}

export async function setPageStatus(db: Db, args: z.infer<typeof setPageStatusSchema>) {
  const { slug: parsed, status } = setPageStatusSchema.parse(args)
  const res = await db.from(PAGES_TABLE).update(statusPatch(status)).eq('slug', parsed).select('*').single()
  return unwrap(res)
}

// ── Projects ─────────────────────────────────────────────────────────────────

const projectFields = {
  name: z.string().min(1),
  slug,
  url: z.string().optional(),
  year: z.string().optional(),
  category: z.string().optional(),
  tagline: z.string().optional(),
  hero: z.string().optional(),
  summary: z.string().optional(),
  accent: z.string().optional(),
  featured: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  status: contentStatusSchema.optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  content: jsonObject.optional(),
}

export const listProjectsSchema = z.object({
  status: contentStatusSchema.optional(),
  featured: z.boolean().optional(),
  limit: z.number().int().positive().max(200).optional(),
})
export const getProjectSchema = z.object({ slug })
export const createProjectSchema = z.object(projectFields).strict()
export const updateProjectSchema = z.object({
  id: z.string().uuid(),
  patch: z.object(projectFields).partial().strict(),
})
export const deleteProjectSchema = z.object({ id: z.string().uuid() })
export const setProjectStatusSchema = z.object({ id: z.string().uuid(), status: contentStatusSchema })

export async function listProjects(db: Db, args: z.infer<typeof listProjectsSchema> = {}) {
  const { status, featured, limit } = listProjectsSchema.parse(args)
  let query = db.from(PROJECTS_TABLE).select('*').order('sort_order', { ascending: true })
  if (status) query = query.eq('status', status)
  if (featured !== undefined) query = query.eq('featured', featured)
  if (limit) query = query.limit(limit)
  return unwrap(await query)
}

export async function getProject(db: Db, slugValue: string) {
  const { slug: parsed } = getProjectSchema.parse({ slug: slugValue })
  const res = await db.from(PROJECTS_TABLE).select('*').eq('slug', parsed).maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ?? null
}

export async function createProject(db: Db, input: z.infer<typeof createProjectSchema>) {
  const parsed = createProjectSchema.parse(input)
  const status = parsed.status ?? 'draft'
  const payload = {
    ...parsed,
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
  }
  return unwrap(await db.from(PROJECTS_TABLE).insert(payload).select('*').single())
}

export async function updateProject(db: Db, args: z.infer<typeof updateProjectSchema>) {
  const { id, patch } = updateProjectSchema.parse(args)
  const workflow = patch.status ? statusPatch(patch.status) : { updated_at: new Date().toISOString() }
  return unwrap(await db.from(PROJECTS_TABLE).update({ ...patch, ...workflow }).eq('id', id).select('*').single())
}

export async function deleteProject(db: Db, id: string) {
  const { id: parsed } = deleteProjectSchema.parse({ id })
  const res = await db.from(PROJECTS_TABLE).delete().eq('id', parsed)
  if (res.error) throw new Error(res.error.message)
  return { deleted: true as const, id: parsed }
}

export async function setProjectStatus(db: Db, args: z.infer<typeof setProjectStatusSchema>) {
  const { id, status } = setProjectStatusSchema.parse(args)
  return unwrap(await db.from(PROJECTS_TABLE).update(statusPatch(status)).eq('id', id).select('*').single())
}

// ── Site settings ────────────────────────────────────────────────────────────

export const updateSiteSettingsSchema = z.object({
  patch: z.object({
    title: z.string().min(1).optional(),
    content: jsonObject.optional(),
  }).strict(),
})
export const setSiteStatusSchema = z.object({ status: contentStatusSchema })

export async function getSiteSettings(db: Db) {
  const res = await db.from(SITE_TABLE).select('*').eq('slug', SITE_PRIMARY_SLUG).maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ?? null
}

export async function updateSiteSettings(db: Db, args: z.infer<typeof updateSiteSettingsSchema>) {
  const { patch } = updateSiteSettingsSchema.parse(args)
  const res = await db
    .from(SITE_TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('slug', SITE_PRIMARY_SLUG)
    .select('*')
    .single()
  return unwrap(res)
}

export async function setSiteStatus(db: Db, args: z.infer<typeof setSiteStatusSchema>) {
  const { status } = setSiteStatusSchema.parse(args)
  return unwrap(await db.from(SITE_TABLE).update(statusPatch(status)).eq('slug', SITE_PRIMARY_SLUG).select('*').single())
}
