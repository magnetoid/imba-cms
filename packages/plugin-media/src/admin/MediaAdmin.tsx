import { useEffect, useMemo, useState } from 'react'
import { CMS_CAPABILITIES, hasCapability, useCmsSession } from '@imba/core'
import { deleteMediaAsset, listMediaAssets, registerExternalMedia, resolveMediaBucket, updateMediaAsset, uploadMediaAsset } from '../mediaClient'
import type { MediaAsset } from '../types'

interface ExternalFormState {
  title: string
  altText: string
  url: string
  mimeType: string
}

const EMPTY_EXTERNAL_FORM: ExternalFormState = {
  title: '',
  altText: '',
  url: '',
  mimeType: '',
}

interface EditFormState {
  title: string
  altText: string
  url: string
  mimeType: string
}

const EMPTY_EDIT_FORM: EditFormState = {
  title: '',
  altText: '',
  url: '',
  mimeType: '',
}

export default function MediaAdmin() {
  const session = useCmsSession()
  const canWrite = hasCapability(session, CMS_CAPABILITIES.mediaWrite)
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingExternal, setSavingExternal] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [externalForm, setExternalForm] = useState<ExternalFormState>(EMPTY_EXTERNAL_FORM)
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>(EMPTY_EDIT_FORM)

  async function loadAssets(search = query) {
    setLoading(true)
    setError('')
    try {
      setAssets(await listMediaAssets(search))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load media assets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAssets()
  }, [])

  const filteredCountLabel = useMemo(() => {
    if (query.trim().length === 0) return `${assets.length} assets`
    return `${assets.length} matching assets`
  }, [assets.length, query])

  async function handleExternalSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canWrite) return

    setSavingExternal(true)
    setError('')
    try {
      await registerExternalMedia(externalForm)
      setExternalForm(EMPTY_EXTERNAL_FORM)
      await loadAssets('')
      setQuery('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save external media.')
    } finally {
      setSavingExternal(false)
    }
  }

  async function handleUploadChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !canWrite) return

    setUploading(true)
    setError('')
    try {
      await uploadMediaAsset({
        file,
        bucket: resolveMediaBucket(),
        title: file.name.replace(/\.[^.]+$/, ''),
      })
      await loadAssets('')
      setQuery('')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  function beginEditing(asset: MediaAsset) {
    setEditingAsset(asset)
    setEditForm({
      title: asset.title ?? '',
      altText: asset.alt_text ?? '',
      url: asset.url,
      mimeType: asset.mime_type ?? '',
    })
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canWrite || !editingAsset) return

    setSavingEdit(true)
    setError('')
    try {
      const updated = await updateMediaAsset({
        id: editingAsset.id,
        title: editForm.title,
        altText: editForm.altText,
        url: editForm.url,
        mimeType: editForm.mimeType,
      })
      setAssets((current) => current.map((asset) => asset.id === updated.id ? updated : asset))
      setEditingAsset(updated)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update media asset.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDelete(asset: MediaAsset) {
    if (!canWrite) return
    if (!confirm(`Delete "${asset.title || asset.storage_path || asset.url}"?`)) return

    setDeletingAssetId(asset.id)
    setError('')
    try {
      await deleteMediaAsset(asset)
      setAssets((current) => current.filter((entry) => entry.id !== asset.id))
      if (editingAsset?.id === asset.id) {
        setEditingAsset(null)
        setEditForm(EMPTY_EDIT_FORM)
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete media asset.')
    } finally {
      setDeletingAssetId(null)
    }
  }

  const selectedAssetSummary = editingAsset
    ? `${editingAsset.source_type}${editingAsset.width && editingAsset.height ? ` · ${editingAsset.width}×${editingAsset.height}` : ''}`
    : null

  return (
    <div className="p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Media Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Managed CMS assets for blog, social cards, and reusable editorial imagery.
          </p>
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">
          Bucket: {resolveMediaBucket()}
        </div>
      </div>

      {!canWrite && (
        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          You can browse assets, but only editors, content admins, and media managers can create new media entries.
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Asset Browser</h2>
              <p className="mt-1 text-xs text-muted-foreground">{filteredCountLabel}</p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void loadAssets(query)
              }}
              className="flex items-center gap-2"
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, alt text, or URL"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:w-72"
              />
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                Search
              </button>
            </form>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-6 text-sm text-muted-foreground">Loading media assets…</div>
          ) : assets.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No media assets found yet. Upload a file or register an external URL to get started.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {assets.map((asset) => (
                <article key={asset.id} className="overflow-hidden rounded-xl border border-border bg-background">
                  <div className="aspect-video bg-muted">
                    <img
                      src={asset.url}
                      alt={asset.alt_text || asset.title || 'Media asset'}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-medium text-foreground">
                          {asset.title || asset.storage_path || 'Untitled asset'}
                        </h3>
                        <p className="truncate text-xs text-muted-foreground">
                          {asset.alt_text || 'No alt text yet'}
                        </p>
                      </div>
                      <span className="rounded-full border border-border px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {asset.source_type}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {asset.mime_type || 'unknown type'}
                      {typeof asset.size_bytes === 'number' ? ` · ${(asset.size_bytes / 1024).toFixed(1)} KB` : ''}
                      {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ''}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Open asset
                        </a>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(asset.url)}
                          className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                        >
                          Copy URL
                        </button>
                      </div>
                      {canWrite && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => beginEditing(asset)}
                            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void handleDelete(asset)
                            }}
                            disabled={deletingAssetId === asset.id}
                            className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/5 disabled:opacity-50"
                          >
                            {deletingAssetId === asset.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Asset Details</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {editingAsset ? 'Update titles, alt text, and external URLs.' : 'Select an asset from the browser to edit it.'}
                </p>
              </div>
              {selectedAssetSummary && (
                <div className="rounded-full border border-border px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {selectedAssetSummary}
                </div>
              )}
            </div>

            {!editingAsset ? (
              <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Choose any asset card and click Edit to manage metadata or remove it.
              </div>
            ) : (
              <form onSubmit={(event) => { void handleEditSubmit(event) }} className="mt-4 space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-foreground">Title</span>
                  <input
                    value={editForm.title}
                    onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-foreground">Alt text</span>
                  <input
                    value={editForm.altText}
                    onChange={(event) => setEditForm((current) => ({ ...current, altText: event.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-foreground">URL</span>
                  <input
                    value={editForm.url}
                    disabled={editingAsset.source_type !== 'external'}
                    onChange={(event) => setEditForm((current) => ({ ...current, url: event.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {editingAsset.source_type === 'external'
                      ? 'External asset URLs can be corrected here.'
                      : 'Uploaded asset URLs are storage-managed and cannot be edited directly.'}
                  </p>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-foreground">MIME type</span>
                  <input
                    value={editForm.mimeType}
                    onChange={(event) => setEditForm((current) => ({ ...current, mimeType: event.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </label>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAsset(null)
                      setEditForm(EMPTY_EDIT_FORM)
                    }}
                    className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit || !canWrite}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {savingEdit ? 'Saving…' : 'Save asset'}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Upload File</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload into the configured public bucket and register the asset automatically.
            </p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 py-8 text-center hover:bg-accent/40">
              <span className="text-sm font-medium text-foreground">
                {uploading ? 'Uploading…' : 'Choose file'}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                Images and media files supported by your Supabase bucket policy
              </span>
              <input
                type="file"
                onChange={(event) => {
                  void handleUploadChange(event)
                }}
                disabled={uploading || !canWrite}
                className="sr-only"
              />
            </label>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Register External URL</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Useful for existing CDN assets, stock libraries, or migrated content.
            </p>
            <form onSubmit={(event) => { void handleExternalSubmit(event) }} className="mt-4 space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-foreground">Title</span>
                <input
                  value={externalForm.title}
                  onChange={(event) => setExternalForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-foreground">Alt text</span>
                <input
                  value={externalForm.altText}
                  onChange={(event) => setExternalForm((current) => ({ ...current, altText: event.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-foreground">URL</span>
                <input
                  value={externalForm.url}
                  required
                  onChange={(event) => setExternalForm((current) => ({ ...current, url: event.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="https://cdn.example.com/image.jpg"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-foreground">MIME type</span>
                <input
                  value={externalForm.mimeType}
                  onChange={(event) => setExternalForm((current) => ({ ...current, mimeType: event.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="image/jpeg"
                />
              </label>
              <button
                type="submit"
                disabled={savingExternal || !canWrite}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {savingExternal ? 'Saving…' : 'Register asset'}
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  )
}
