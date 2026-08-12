import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CMS_CAPABILITIES, describeWriteError, hasCapability, useCmsSession } from '@imba/core'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@imba/ui'
import { buildDefaultPageRecord, CMS_PAGE_DEFINITIONS } from '../defaults'
import { pagesDb } from '../public/pagesClient'
import { isCmsPageSlug, parseCmsPageContent } from '../types'
import type { CmsPageSlug, CmsPageStatus } from '../types'

interface PageRow {
  id: string
  slug: CmsPageSlug
  title: string
  status: CmsPageStatus
  seo_title: string
  seo_description: string
  content: unknown
  updated_at?: string
  published_at?: string | null
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

export default function PageEditor() {
  const { slug: rawSlug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const session = useCmsSession()
  const canWrite = hasCapability(session, CMS_CAPABILITIES.pagesWrite)
  const canPublish = hasCapability(session, CMS_CAPABILITIES.pagesPublish)
  const slug = rawSlug && isCmsPageSlug(rawSlug) ? rawSlug : null
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [status, setStatus] = useState<CmsPageStatus>('draft')
  const [contentText, setContentText] = useState('{}')

  useEffect(() => {
    if (!slug) {
      setError('Unknown page slug.')
      setLoading(false)
      return
    }

    let active = true

    pagesDb()
      .from('pages_entries')
      .select('id, slug, title, status, seo_title, seo_description, content, updated_at, published_at')
      .eq('slug', slug)
      .maybeSingle<PageRow>()
      .then(({ data, error: loadError }) => {
        if (!active) return
        if (loadError) {
          setError(loadError.message)
          setLoading(false)
          return
        }
        const page = data ?? buildDefaultPageRecord(slug)
        setTitle(page.title)
        setSeoTitle('seoTitle' in page ? page.seoTitle : '')
        setSeoDescription('seoDescription' in page ? page.seoDescription : '')
        setStatus(page.status)
        setContentText(prettyJson(page.content))
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [slug])

  const definition = useMemo(() => (slug ? CMS_PAGE_DEFINITIONS[slug] : null), [slug])

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Loading page editor…</p>
      </div>
    )
  }

  if (!slug || !definition) {
    return (
      <div className="p-8">
        <p className="text-sm text-destructive">Page definition not found.</p>
      </div>
    )
  }

  const pageSlug: CmsPageSlug = slug
  const pageDefinition = definition

  async function handleSave() {
    if (!canWrite) {
      setError('You do not have permission to edit pages.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const parsedContent = parseCmsPageContent(pageSlug, JSON.parse(contentText) as unknown)
      const nextStatus = canPublish ? status : 'draft'
      const publishedAt = nextStatus === 'published' ? new Date().toISOString() : null
      const { error: saveError } = await pagesDb().from('pages_entries').upsert({
        slug: pageSlug,
        title: title.trim() || pageDefinition.title,
        status: nextStatus,
        seo_title: seoTitle.trim(),
        seo_description: seoDescription.trim(),
        content: parsedContent,
        published_at: publishedAt,
      }, { onConflict: 'slug' })

      if (saveError) throw saveError
      navigate('/admin/pages')
    } catch (saveError) {
      setError(describeWriteError(saveError, 'page', 'pages.write'))
    } finally {
      setSaving(false)
    }
  }

  function restoreDefaults() {
    const page = buildDefaultPageRecord(pageSlug)
    setTitle(page.title)
    setSeoTitle(page.seoTitle)
    setSeoDescription(page.seoDescription)
    setStatus(page.status)
    setContentText(prettyJson(page.content))
    setError('')
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <Link to="/admin/pages" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to pages
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">{pageDefinition.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pageDefinition.summary}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={restoreDefaults}>
            Reset to defaults
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !canWrite}>
            {saving ? 'Saving…' : 'Save page'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Page content</CardTitle>
            <CardDescription>
              Edit validated JSON for this page. The structure must match the mtiosavljevic template schema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="page-title">Title</Label>
                <Input id="page-title" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-status">Status</Label>
                <select
                  id="page-status"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={status}
                  onChange={(event) => setStatus(event.target.value === 'published' ? 'published' : 'draft')}
                  disabled={!canPublish}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="page-seo-title">SEO title</Label>
              <Input id="page-seo-title" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="page-seo-description">SEO description</Label>
              <textarea
                id="page-seo-description"
                className="min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="page-content">Structured content JSON</Label>
              <textarea
                id="page-content"
                className="min-h-[520px] w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={contentText}
                onChange={(event) => setContentText(event.target.value)}
                spellCheck={false}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Editing notes</CardTitle>
            <CardDescription>First migration slice: preserve the old public UI while moving content into the CMS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <div className="font-medium text-foreground">Route</div>
              <div className="font-mono">{pageDefinition.path}</div>
            </div>
            <div>
              <div className="font-medium text-foreground">Fallback behavior</div>
              <p>If this page is not saved yet, the public template falls back to the preserved old-site defaults.</p>
            </div>
            <div>
              <div className="font-medium text-foreground">Current scope</div>
              <p>Home, About, Services, and Contact are CMS-backed in this slice. Projects and deeper service detail routes stay for a later phase.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
