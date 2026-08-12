import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteMediaAsset, registerExternalMedia, setMediaDb, updateMediaAsset, uploadMediaAsset } from './mediaClient'
import type { MediaAsset } from './types'

interface FakeQueryBuilder {
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

function makeFakeDb(seedAsset?: Partial<MediaAsset>) {
  const currentAsset: MediaAsset = {
    id: '11111111-1111-4111-8111-111111111111',
    url: 'https://cdn.example.com/asset.jpg',
    source_type: 'external',
    created_at: '2026-08-10T00:00:00.000Z',
    title: 'Seed asset',
    alt_text: 'Seed alt',
    mime_type: 'image/jpeg',
    ...seedAsset,
  }

  let pendingUpdate: Record<string, unknown> | null = null
  let deleteInvoked = false
  let uploadedPath = ''
  let removedPaths: string[] = []

  const builder: FakeQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(async () => {
      if (pendingUpdate) {
        Object.assign(currentAsset, pendingUpdate)
        pendingUpdate = null
      }
      return { data: currentAsset, error: null }
    }),
    insert: vi.fn((payload: Record<string, unknown>) => {
      Object.assign(currentAsset, payload)
      return builder
    }),
    update: vi.fn((payload: Record<string, unknown>) => {
      pendingUpdate = payload
      return builder
    }),
    delete: vi.fn(() => {
      deleteInvoked = true
      return builder
    }),
  }

  const storageBucket = {
    upload: vi.fn(async (path: string) => {
      uploadedPath = path
      return { data: { path }, error: null }
    }),
    getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.example.com/${path}` } })),
    remove: vi.fn(async (paths: string[]) => {
      removedPaths = paths
      return { data: null, error: null }
    }),
  }

  const db = {
    from: vi.fn(() => builder),
    storage: {
      from: vi.fn(() => storageBucket),
    },
  }

  return {
    db,
    currentAsset,
    builder,
    storageBucket,
    getDeleteInvoked: () => deleteInvoked,
    getUploadedPath: () => uploadedPath,
    getRemovedPaths: () => removedPaths,
  }
}

describe('mediaClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('validates external media URLs before insertion', async () => {
    const { db } = makeFakeDb()
    setMediaDb(db as never)

    await expect(registerExternalMedia({ url: 'not-a-url' })).rejects.toThrow()
  })

  it('keeps uploaded asset URLs immutable during metadata updates', async () => {
    const { db, currentAsset } = makeFakeDb({
      source_type: 'upload',
      url: 'https://cdn.example.com/original.jpg',
      storage_bucket: 'cms-media',
      storage_path: '2026-08-10/original.jpg',
    })
    setMediaDb(db as never)

    const updated = await updateMediaAsset({
      id: currentAsset.id,
      title: 'Updated title',
      altText: 'Updated alt',
      url: 'https://malicious.example.com/replace.jpg',
    })

    expect(updated.url).toBe('https://cdn.example.com/original.jpg')
    expect(updated.title).toBe('Updated title')
    expect(updated.alt_text).toBe('Updated alt')
  })

  it('removes uploaded storage objects before deleting assets', async () => {
    const { db, currentAsset, getDeleteInvoked, getRemovedPaths } = makeFakeDb({
      source_type: 'upload',
      storage_bucket: 'cms-media',
      storage_path: '2026-08-10/to-delete.jpg',
    })
    setMediaDb(db as never)

    await deleteMediaAsset(currentAsset)

    expect(getRemovedPaths()).toEqual(['2026-08-10/to-delete.jpg'])
    expect(getDeleteInvoked()).toBe(true)
  })

  it('captures image dimensions during upload metadata registration', async () => {
    const { db, getUploadedPath } = makeFakeDb({
      source_type: 'upload',
    })
    setMediaDb(db as never)

    const createImageBitmapMock = vi.fn().mockResolvedValue({
      width: 1200,
      height: 630,
      close: vi.fn(),
    })
    vi.stubGlobal('createImageBitmap', createImageBitmapMock)

    const file = new File(['image-bytes'], 'hero.jpg', { type: 'image/jpeg' })
    const uploaded = await uploadMediaAsset({
      bucket: 'cms-media',
      file,
      title: 'Hero image',
      altText: 'Hero alt',
    })

    expect(getUploadedPath()).toMatch(/hero\.jpg$/)
    expect(uploaded.width).toBe(1200)
    expect(uploaded.height).toBe(630)
    expect(uploaded.source_type).toBe('upload')
  })
})
