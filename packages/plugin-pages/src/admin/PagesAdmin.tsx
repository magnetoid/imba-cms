import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CMS_CAPABILITIES, hasCapability, useCmsSession } from '@imba/core'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@imba/ui'
import { CMS_PAGE_DEFINITIONS } from '../defaults'
import { pagesDb } from '../public/pagesClient'
import type { CmsPageSlug, CmsPageStatus, CmsPageSummary } from '../types'

interface PageSummaryRow {
  slug: CmsPageSlug
  title: string
  status: CmsPageStatus
  updated_at?: string
}

function formatUpdatedAt(value: string | undefined): string {
  if (!value) return 'Not saved yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString()
}

export default function PagesAdmin() {
  const session = useCmsSession()
  const canWrite = hasCapability(session, CMS_CAPABILITIES.pagesWrite)
  const [pages, setPages] = useState<CmsPageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    pagesDb()
      .from('pages_entries')
      .select('slug, title, status, updated_at')
      .order('slug', { ascending: true })
      .then(({ data, error: loadError }) => {
        if (!active) return
        if (loadError) {
          setError(loadError.message)
          setLoading(false)
          return
        }
        const rows = (data ?? []) as PageSummaryRow[]
        setPages(
          rows.map((row) => ({
            slug: row.slug,
            title: row.title,
            status: row.status,
            updatedAt: row.updated_at,
          })),
        )
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const mergedPages = useMemo(
    () =>
      (Object.keys(CMS_PAGE_DEFINITIONS) as CmsPageSlug[]).map((slug) => {
        const savedPage = pages.find((page) => page.slug === slug)
        return {
          ...CMS_PAGE_DEFINITIONS[slug],
          title: savedPage?.title ?? CMS_PAGE_DEFINITIONS[slug].title,
          status: savedPage?.status ?? 'draft',
          updatedAt: savedPage?.updatedAt,
        }
      }),
    [pages],
  )

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the core marketing pages that power the preserved mtiosavljevic public UI.
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {canWrite ? 'Write enabled' : 'Read only'}
        </span>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading page entries…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        {mergedPages.map((page) => (
          <Card key={page.slug}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>{page.title}</span>
                <span className="rounded-full border border-border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                  {page.status}
                </span>
              </CardTitle>
              <CardDescription>{page.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-muted-foreground">
                <div>Route: <span className="font-mono text-foreground">{page.path}</span></div>
                <div>Updated: {formatUpdatedAt(page.updatedAt)}</div>
              </div>
              <Button asChild className="w-full" disabled={!canWrite}>
                <Link to={`/admin/pages/${page.slug}`}>{canWrite ? 'Edit page' : 'View page data'}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
