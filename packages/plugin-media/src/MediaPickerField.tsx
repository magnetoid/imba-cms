import { useEffect, useMemo, useState } from 'react'
import { listMediaAssets } from './mediaClient'
import type { MediaAsset } from './types'

export function MediaPickerField({
  label,
  value,
  onChange,
  helperText,
}: {
  label: string
  value: string
  onChange: (nextValue: string) => void
  helperText?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    if (!open) return
    void loadAssets('')
  }, [open])

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.url === value),
    [assets, value],
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
          >
            Choose from library
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://…"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}

      {value && (
        <div className="overflow-hidden rounded-xl border border-border">
          <img
            src={value}
            alt={selectedAsset?.alt_text || selectedAsset?.title || `${label} preview`}
            className="aspect-video w-full object-cover"
          />
          {selectedAsset && (
            <div className="border-t border-border bg-card px-3 py-2 text-xs text-muted-foreground">
              {selectedAsset.title || selectedAsset.storage_path || 'Library asset'}
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Choose media asset</h2>
                <p className="text-sm text-muted-foreground">Pick an existing asset from the shared CMS library.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
              >
                Close
              </button>
            </div>

            <div className="border-b border-border px-5 py-4">
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
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="overflow-y-auto p-5">
              {error && (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-sm text-muted-foreground">Loading media assets…</div>
              ) : assets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  No matching media assets found.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => {
                        onChange(asset.url)
                        setOpen(false)
                      }}
                      className="overflow-hidden rounded-xl border border-border bg-background text-left transition-colors hover:border-primary/40 hover:bg-accent/30"
                    >
                      <img
                        src={asset.url}
                        alt={asset.alt_text || asset.title || 'Media asset'}
                        className="aspect-video w-full object-cover"
                        loading="lazy"
                      />
                      <div className="space-y-1 p-3">
                        <div className="truncate text-sm font-medium text-foreground">
                          {asset.title || asset.storage_path || 'Untitled asset'}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {asset.alt_text || asset.url}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
