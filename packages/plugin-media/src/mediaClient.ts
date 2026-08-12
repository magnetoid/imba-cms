import type { SupabaseClient } from '@supabase/supabase-js'
import { readBrowserRuntimeOptionalValue } from '@imba/core'
import { z } from 'zod'
import type { CreateExternalMediaInput, MediaAsset, UpdateMediaAssetInput, UploadMediaInput } from './types'

const mediaAssetSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable().optional(),
  alt_text: z.string().nullable().optional(),
  url: z.string().url(),
  storage_bucket: z.string().nullable().optional(),
  storage_path: z.string().nullable().optional(),
  source_type: z.union([z.literal('upload'), z.literal('external')]),
  mime_type: z.string().nullable().optional(),
  size_bytes: z.number().nullable().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
  created_by: z.string().nullable().optional(),
})

const createExternalMediaInputSchema = z.object({
  title: z.string().trim().max(200).optional(),
  altText: z.string().trim().max(300).optional(),
  url: z.string().trim().url(),
  mimeType: z.string().trim().max(120).optional(),
})

const updateMediaAssetInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().max(200).optional(),
  altText: z.string().trim().max(300).optional(),
  url: z.string().trim().url().optional(),
  mimeType: z.string().trim().max(120).optional(),
})

let _db: SupabaseClient | null = null

export function setMediaDb(db: SupabaseClient) {
  _db = db
}

export function mediaDb(): SupabaseClient {
  if (!_db) {
    throw new Error('plugin-media: db not initialized — did createCMS run the plugin register hook?')
  }
  return _db
}

export function resolveMediaBucket() {
  return readBrowserRuntimeOptionalValue('IMBA_MEDIA_BUCKET', 'cms-media') ?? 'cms-media'
}

function normalizeFilename(name: string) {
  const normalized = name.trim().toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-').replace(/-+/g, '-')
  return normalized.length > 0 ? normalized : 'asset'
}

function parseMediaAsset(input: unknown): MediaAsset {
  const parsed = mediaAssetSchema.parse(input)
  return {
    id: parsed.id,
    title: parsed.title ?? undefined,
    alt_text: parsed.alt_text ?? undefined,
    url: parsed.url,
    storage_bucket: parsed.storage_bucket ?? undefined,
    storage_path: parsed.storage_path ?? undefined,
    source_type: parsed.source_type,
    mime_type: parsed.mime_type ?? undefined,
    size_bytes: parsed.size_bytes ?? undefined,
    width: parsed.width ?? undefined,
    height: parsed.height ?? undefined,
    created_at: parsed.created_at,
    updated_at: parsed.updated_at ?? undefined,
    created_by: parsed.created_by ?? undefined,
  }
}

function parseMediaAssets(input: unknown): MediaAsset[] {
  return z.array(mediaAssetSchema).parse(input).map((asset) => parseMediaAsset(asset))
}

async function getImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith('image/')) return {}

  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file)
    try {
      return { width: bitmap.width, height: bitmap.height }
    } finally {
      bitmap.close()
    }
  }

  if (typeof Image === 'undefined' || typeof URL === 'undefined') return {}

  const objectUrl = URL.createObjectURL(file)
  try {
    return await new Promise<{ width?: number; height?: number }>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
      image.onerror = () => reject(new Error('Failed to read image dimensions'))
      image.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function listMediaAssets(query = ''): Promise<MediaAsset[]> {
  let builder = mediaDb()
    .from('media_files')
    .select('*')
    .order('created_at', { ascending: false })

  const trimmed = query.trim()
  if (trimmed.length > 0) {
    builder = builder.or(`title.ilike.%${trimmed}%,alt_text.ilike.%${trimmed}%,url.ilike.%${trimmed}%`)
  }

  const result = await builder
  if (result.error) throw new Error(result.error.message)
  return parseMediaAssets(result.data ?? [])
}

export async function registerExternalMedia(input: CreateExternalMediaInput): Promise<MediaAsset> {
  const parsed = createExternalMediaInputSchema.parse(input)
  const payload = {
    title: parsed.title?.trim() || null,
    alt_text: parsed.altText?.trim() || null,
    url: parsed.url.trim(),
    source_type: 'external' as const,
    mime_type: parsed.mimeType?.trim() || null,
  }

  const result = await mediaDb()
    .from('media_files')
    .insert(payload)
    .select('*')
    .single()

  if (result.error) throw new Error(result.error.message)
  return parseMediaAsset(result.data)
}

export async function updateMediaAsset(input: UpdateMediaAssetInput): Promise<MediaAsset> {
  const parsed = updateMediaAssetInputSchema.parse(input)
  const currentResult = await mediaDb()
    .from('media_files')
    .select('*')
    .eq('id', parsed.id)
    .single()

  if (currentResult.error) throw new Error(currentResult.error.message)
  const current = parseMediaAsset(currentResult.data)

  const nextUrl = current.source_type === 'external'
    ? (parsed.url?.trim() || current.url)
    : current.url

  const result = await mediaDb()
    .from('media_files')
    .update({
      title: parsed.title?.trim() || null,
      alt_text: parsed.altText?.trim() || null,
      url: nextUrl,
      mime_type: parsed.mimeType?.trim() || null,
    })
    .eq('id', parsed.id)
    .select('*')
    .single()

  if (result.error) throw new Error(result.error.message)
  return parseMediaAsset(result.data)
}

export async function deleteMediaAsset(asset: MediaAsset): Promise<void> {
  if (asset.source_type === 'upload' && asset.storage_bucket && asset.storage_path) {
    const storageResult = await mediaDb().storage
      .from(asset.storage_bucket)
      .remove([asset.storage_path])

    if (storageResult.error) throw new Error(storageResult.error.message)
  }

  const result = await mediaDb()
    .from('media_files')
    .delete()
    .eq('id', asset.id)

  if (result.error) throw new Error(result.error.message)
}

export async function uploadMediaAsset(input: UploadMediaInput): Promise<MediaAsset> {
  const dimensions = await getImageDimensions(input.file)
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${normalizeFilename(input.file.name)}`
  const upload = await mediaDb().storage
    .from(input.bucket)
    .upload(path, input.file, {
      cacheControl: '3600',
      upsert: false,
      contentType: input.file.type || 'application/octet-stream',
    })

  if (upload.error) throw new Error(upload.error.message)

  const publicUrl = mediaDb().storage.from(input.bucket).getPublicUrl(path).data.publicUrl
  const insertResult = await mediaDb()
    .from('media_files')
    .insert({
      title: input.title?.trim() || null,
      alt_text: input.altText?.trim() || null,
      url: publicUrl,
      storage_bucket: input.bucket,
      storage_path: path,
      source_type: 'upload',
      mime_type: input.file.type || 'application/octet-stream',
      size_bytes: input.file.size,
      width: dimensions.width ?? null,
      height: dimensions.height ?? null,
    })
    .select('*')
    .single()

  if (insertResult.error) throw new Error(insertResult.error.message)
  return parseMediaAsset(insertResult.data)
}
