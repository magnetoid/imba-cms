import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Public, read-only delivery for the pages, projects and site plugins —
 * published rows only, no preview path (drafts stay behind RLS + the admin).
 *
 * The blog delivery in `content.ts` was the first slice; docs listed "expand
 * the delivery API beyond blog content" as the next step. These endpoints let
 * a separately-deployed frontend render the same content the templates do,
 * without a Supabase client in the browser.
 */

type DeliveryDb = Pick<SupabaseClient, 'from'>

export const deliverySlugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'invalid slug')

const PAGE_SELECT = 'id, slug, title, status, seo_title, seo_description, content, updated_at, published_at'
const PROJECT_SELECT = 'id, slug, name, url, year, category, tagline, hero, summary, accent, featured, sort_order, status, seo_title, seo_description, content, updated_at, published_at'
const SITE_SELECT = 'id, slug, title, status, content, updated_at, published_at'

export async function listPublishedPages(db: DeliveryDb) {
  const result = await db
    .from('pages_entries')
    .select(PAGE_SELECT)
    .eq('status', 'published')
    .order('slug', { ascending: true })
  if (result.error) throw new Error(result.error.message)
  return result.data ?? []
}

export async function getPublishedPage(db: DeliveryDb, slug: string) {
  const parsed = deliverySlugSchema.parse(slug)
  const result = await db
    .from('pages_entries')
    .select(PAGE_SELECT)
    .eq('slug', parsed)
    .eq('status', 'published')
    .maybeSingle()
  if (result.error) throw new Error(result.error.message)
  return result.data ?? null
}

export async function listPublishedProjects(db: DeliveryDb) {
  const result = await db
    .from('projects_entries')
    .select(PROJECT_SELECT)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
  if (result.error) throw new Error(result.error.message)
  return result.data ?? []
}

export async function getPublishedProject(db: DeliveryDb, slug: string) {
  const parsed = deliverySlugSchema.parse(slug)
  const result = await db
    .from('projects_entries')
    .select(PROJECT_SELECT)
    .eq('slug', parsed)
    .eq('status', 'published')
    .maybeSingle()
  if (result.error) throw new Error(result.error.message)
  return result.data ?? null
}

/** The single `primary` site-settings row, when published. */
export async function getPublishedSiteSettings(db: DeliveryDb) {
  const result = await db
    .from('site_entries')
    .select(SITE_SELECT)
    .eq('slug', 'primary')
    .eq('status', 'published')
    .maybeSingle()
  if (result.error) throw new Error(result.error.message)
  return result.data ?? null
}
