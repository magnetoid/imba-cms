import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

const BLOG_POST_SELECT = '*, blog_categories(name, slug)'

const blogSlugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const previewTokenRequestSchema = z.object({
  slug: blogSlugSchema,
  expiresInSeconds: z.number().int().positive().max(60 * 60 * 24).optional(),
})

type PreviewTokenRequest = z.infer<typeof previewTokenRequestSchema>

type ContentDb = Pick<SupabaseClient, 'from'>

interface PreviewTokenPayload {
  slug: string
  exp: number
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signPayload(secret: string, payload: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function parsePayload(token: string): PreviewTokenPayload | null {
  const [encodedPayload] = token.split('.', 1)
  if (!encodedPayload) return null

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as unknown
    const parsed = z.object({ slug: blogSlugSchema, exp: z.number().int().positive() }).safeParse(payload)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function createPreviewToken(secret: string, input: PreviewTokenRequest) {
  const parsed = previewTokenRequestSchema.parse(input)
  const payload = JSON.stringify({
    slug: parsed.slug,
    exp: Math.floor(Date.now() / 1000) + (parsed.expiresInSeconds ?? 60 * 30),
  } satisfies PreviewTokenPayload)
  const encodedPayload = encodeBase64Url(payload)
  const signature = signPayload(secret, encodedPayload)
  return `${encodedPayload}.${signature}`
}

export function verifyPreviewToken(secret: string, token: string, slug: string) {
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return false

  const expected = signPayload(secret, encodedPayload)
  const signatureBuffer = Buffer.from(signature, 'utf8')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  if (signatureBuffer.length !== expectedBuffer.length) return false
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return false

  const payload = parsePayload(token)
  if (!payload) return false
  if (payload.slug !== slug) return false
  return payload.exp > Math.floor(Date.now() / 1000)
}

export async function listPublishedBlogPosts(db: ContentDb) {
  const now = new Date().toISOString()
  const result = await db
    .from('blog_posts')
    .select(BLOG_POST_SELECT)
    .eq('published', true)
    .eq('status', 'published')
    .lte('published_at', now)
    .order('published_at', { ascending: false })

  if (result.error) throw new Error(result.error.message)
  return result.data ?? []
}

export async function getBlogPostBySlug(
  db: ContentDb,
  slug: string,
  options?: { previewToken?: string; previewSecret?: string },
) {
  const parsedSlug = blogSlugSchema.parse(slug)
  const previewAllowed = Boolean(
    options?.previewSecret
      && options.previewToken
      && verifyPreviewToken(options.previewSecret, options.previewToken, parsedSlug),
  )

  let query = db
    .from('blog_posts')
    .select(BLOG_POST_SELECT)
    .eq('slug', parsedSlug)

  if (!previewAllowed) {
    const now = new Date().toISOString()
    query = query
      .eq('published', true)
      .eq('status', 'published')
      .lte('published_at', now)
  }

  const result = await query.maybeSingle()
  if (result.error) throw new Error(result.error.message)
  return result.data ?? null
}
